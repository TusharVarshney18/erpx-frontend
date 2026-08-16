import { useEffect, useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Search,
  Bell,
  BellOff,
  CheckCheck,
  MessageSquare,
  Plus,
  ChevronDown,
  Moon,
  Sun,
  Building2,
  FileText,
  ShoppingCart,
  Users,
  Settings,
  LogOut,
  Loader2,
  UserPlus,
  Package,
  ReceiptText,
  Briefcase,
  Scale,
} from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useNavigate } from "@tanstack/react-router";
import { api } from "@/lib/api/client";
import { notificationsApi } from "@/lib/api/notifications";
import { useFeatureAccess } from "@/hooks/useFeatureAccess";
import { useAccess } from "@/hooks/useAccess";
import { SearchPalette } from "@/components/command/SearchPalette";
import { DemoBadge } from "@/components/premium/DemoBadge";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

function timeAgo(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return formatDistanceToNow(date, { addSuffix: true });
}

export function TopHeader() {
  const [dark, setDark] = useState(false);
  const { user, organizations, activeOrganizationId, signOut, switchOrganization, refreshOrganizations } = useAuth();
  const featureAccess = useFeatureAccess();
  const access = useAccess();
  const nav = useNavigate();

  const createItems = useMemo(() => {
    const can = access.hasPermission;
    const items: { to: string; label: string; icon: any }[] = [];
    const add = (to: string, label: string, icon: any, perms: string[]) => {
      if (perms.some((p) => can(p))) items.push({ to, label, icon });
    };
    add("/crm/leads", "Lead", UserPlus, ["lead:create"]);
    add("/sales/customers", "Customer", Users, ["customer:create", "company:create"]);
    add("/sales/quotations", "Quotation", FileText, ["quotation:create"]);
    add("/sales/sales-orders", "Sales Order", ShoppingCart, ["sales_order:create"]);
    add("/sales/invoices", "Invoice", ReceiptText, ["invoice:create"]);
    add("/purchases/vendors", "Vendor", Briefcase, ["vendor:create"]);
    add("/purchases/purchase-orders", "Purchase Order", ShoppingCart, ["purchase_order:create"]);
    add("/inventory/products", "Product", Package, ["product:create"]);
    add("/hrms/employees", "Employee", Users, ["employee:create"]);
    add("/accounting/chart-of-accounts", "Account", Scale, ["chart_of_account:create"]);
    add("/accounting/journal-entries", "Journal Entry", FileText, ["journal_entry:create"]);
    return items;
  }, [access.hasPermission]);
  const [showCreateOrg, setShowCreateOrg] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [orgName, setOrgName] = useState("");
  const [orgCode, setOrgCode] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSearchOpen((o) => !o);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const activeOrg = organizations.find((o) => o.id === activeOrganizationId) || user?.organization;
  const displayName = user ? `${user.firstName} ${user.lastName}`.trim() || user.email : "U";
  const initials = displayName
    .split(/[\s@]/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p: string) => p[0].toUpperCase())
    .join("");

  const qc = useQueryClient();

  const { data: notifications = [] } = useQuery({
    queryKey: ["notifications-preview", user?.id, activeOrganizationId],
    queryFn: () => notificationsApi.list({ limit: 8 }),
    enabled: !!user && !!activeOrganizationId,
    refetchInterval: 30000,
  });

  const { data: unreadData } = useQuery({
    queryKey: ["notifications-unread", user?.id, activeOrganizationId],
    queryFn: () => notificationsApi.unreadCount(),
    enabled: !!user && !!activeOrganizationId,
    refetchInterval: 30000,
  });

  const markAllRead = useMutation({
    mutationFn: () => notificationsApi.markAllRead(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["notifications-preview"] });
      qc.invalidateQueries({ queryKey: ["notifications-unread"] });
      toast.success("All notifications marked as read");
    },
    onError: (e: any) => toast.error(e.message ?? "Failed to mark all as read"),
  });

  const markRead = useMutation({
    mutationFn: (id: string) => notificationsApi.markRead(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["notifications-preview"] });
      qc.invalidateQueries({ queryKey: ["notifications-unread"] });
    },
    onError: (e: any) => toast.error(e.message ?? "Failed to mark as read"),
  });

  const unreadCount = unreadData?.count ?? 0;

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
  }, [dark]);

  const handleCreateOrg = async () => {
    if (!orgName.trim() || !orgCode.trim()) {
      toast.error("Name and code are required");
      return;
    }
    setCreateLoading(true);
    try {
      await api.post("/organizations", {
        name: orgName.trim(),
        code: orgCode.trim().toLowerCase().replace(/[^a-z0-9-]/g, ""),
      });
      toast.success("Company created successfully");
      setShowCreateOrg(false);
      setOrgName("");
      setOrgCode("");
      await refreshOrganizations();
    } catch (e: any) {
      toast.error(e.message ?? "Failed to create company");
    } finally {
      setCreateLoading(false);
    }
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-2 border-b border-border bg-background/70 px-3 backdrop-blur-xl sm:px-4">
      <SidebarTrigger className="shrink-0" />

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="hidden h-9 gap-2 px-2 md:flex">
            <Building2 className="h-4 w-4 text-primary" />
            <span className="max-w-[200px] truncate text-sm font-medium">
              {activeOrg?.name ?? "Select Company"}
            </span>
            <ChevronDown className="h-3.5 w-3.5 opacity-60" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-72">
          <DropdownMenuLabel>Switch Company</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {organizations.length === 0 && (
            <DropdownMenuItem disabled>No companies available</DropdownMenuItem>
          )}
          {organizations.map((org) => (
            <DropdownMenuItem
              key={org.id}
              onClick={() => {
                if (org.id !== activeOrganizationId) {
                  switchOrganization(org.id);
                }
              }}
              className={org.id === activeOrganizationId ? "bg-accent" : ""}
            >
              <Building2 className="mr-2 h-4 w-4 text-muted-foreground" />
              <div className="flex flex-1 items-center justify-between">
                <span className="truncate">{org.name}</span>
                {org.id === activeOrganizationId && (
                  <Badge variant="secondary" className="ml-2 text-[10px]">Active</Badge>
                )}
              </div>
            </DropdownMenuItem>
          ))}
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => setShowCreateOrg(true)}>
            <Plus className="mr-2 h-4 w-4" /> New Company
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <div className="relative ml-auto hidden max-w-md flex-1 md:block">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search pages…"
          className="h-9 border-border bg-muted/50 pl-9 pr-16 focus-visible:bg-background"
          onFocus={() => setSearchOpen(true)}
        />
        <kbd className="pointer-events-none absolute right-2 top-1/2 hidden -translate-y-1/2 rounded border border-border bg-background px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground lg:inline-block">
          ⌘K
        </kbd>
      </div>
      <SearchPalette open={searchOpen} onOpenChange={setSearchOpen} />

      <div className="ml-auto flex items-center gap-1 md:ml-2">
        {!featureAccess.isPremium && !featureAccess.isSuperAdmin && !featureAccess.isLoading && (
          <DemoBadge />
        )}
        {createItems.length > 0 && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              size="sm"
              className="hidden h-9 gap-1.5 gradient-primary text-white shadow-glow sm:flex"
            >
              <Plus className="h-4 w-4" /> <span>Create</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52">
            <DropdownMenuLabel>Quick Create</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {createItems.map((item: { to: string; label: string; icon: any }) => (
              <DropdownMenuItem key={item.to} onClick={() => nav({ to: item.to })}>
                <item.icon className="mr-2 h-4 w-4" /> {item.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
        )}

        <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => setDark((d) => !d)}>
          {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </Button>

        <Button variant="ghost" size="icon" className="relative h-9 w-9">
          <MessageSquare className="h-4 w-4" />
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative h-9 w-9">
              <Bell className="h-4 w-4" />
              {unreadCount > 0 && (
                <Badge className="absolute -right-0.5 -top-0.5 h-4 min-w-4 rounded-full p-0 text-[10px]">
                  {unreadCount > 99 ? "99+" : unreadCount}
                </Badge>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80">
            <DropdownMenuLabel className="flex items-center justify-between gap-2">
              <span>Notifications</span>
              {notifications.some((n) => !n.isRead) && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 gap-1 px-2 text-xs"
                  disabled={markAllRead.isPending}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    markAllRead.mutate();
                  }}
                >
                  {markAllRead.isPending ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <CheckCheck className="h-3 w-3" />
                  )}
                  Mark all read
                </Button>
              )}
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <div className="max-h-96 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="flex flex-col items-center gap-2 px-6 py-10 text-center">
                  <div className="grid h-10 w-10 place-items-center rounded-full bg-accent text-muted-foreground">
                    <BellOff className="h-5 w-5" />
                  </div>
                  <p className="text-sm font-medium">No notifications yet</p>
                  <p className="text-xs text-muted-foreground">You're all caught up.</p>
                </div>
              ) : (
                notifications.map((n) => (
                  <DropdownMenuItem
                    key={n.id}
                    className="flex items-start gap-2.5 py-3"
                    onClick={() => {
                      if (!n.isRead) markRead.mutate(n.id);
                    }}
                  >
                    <div
                      className={cn(
                        "mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg",
                        n.isRead
                          ? "bg-muted text-muted-foreground"
                          : "bg-primary/10 text-primary",
                      )}
                    >
                      <Bell className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{n.title}</p>
                      {n.body && (
                        <p className="line-clamp-1 text-xs text-muted-foreground">{n.body}</p>
                      )}
                      <p className="mt-0.5 text-[10px] text-muted-foreground">
                        {timeAgo(n.createdAt)}
                      </p>
                    </div>
                    {!n.isRead && (
                      <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary" />
                    )}
                  </DropdownMenuItem>
                ))
              )}
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => nav({ to: "/notifications" })}>
              View all notifications
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-9 gap-2 px-1.5">
              <Avatar className="h-7 w-7">
                <AvatarFallback className="gradient-primary text-xs font-semibold text-white">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="hidden text-left lg:block">
                <div className="text-xs font-semibold leading-tight">
                  {displayName}
                </div>
                <div className="text-[10px] leading-tight text-muted-foreground">{user?.email}</div>
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <Users className="mr-2 h-4 w-4" /> Profile
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => nav({ to: "/admin/settings" })}>
              <Settings className="mr-2 h-4 w-4" /> Company Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive"
              onClick={async () => {
                await signOut();
                nav({ to: "/auth" });
              }}
            >
              <LogOut className="mr-2 h-4 w-4" /> Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <Dialog open={showCreateOrg} onOpenChange={(o) => { if (!o) { setShowCreateOrg(false); setOrgName(""); setOrgCode(""); } }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>New Company</DialogTitle>
            <DialogDescription>Create a new company organization.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-1.5">
              <Label>Company Name *</Label>
              <Input
                placeholder="e.g. Acme Logistics"
                value={orgName}
                onChange={(e) => setOrgName(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Company Code *</Label>
              <Input
                placeholder="e.g. acme-logistics"
                value={orgCode}
                onChange={(e) => setOrgCode(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
              />
              <p className="text-xs text-muted-foreground">Lowercase letters, numbers, and hyphens only.</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateOrg(false)}>Cancel</Button>
            <Button className="gradient-primary text-white" disabled={createLoading} onClick={handleCreateOrg}>
              {createLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Company
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </header>
  );
}
