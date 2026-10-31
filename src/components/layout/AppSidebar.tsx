import { Link, useRouterState } from "@tanstack/react-router";
import { ChevronRight, Lock, Sparkles } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarHeader,
  SidebarFooter,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
  useSidebar,
} from "@/components/ui/sidebar";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useAccess } from "@/hooks/useAccess";
import { getVisibleNavigation, type VisibleNavItem } from "@/lib/navigation-access";
import { PremiumChip } from "@/components/premium/PremiumChip";
import { Badge } from "@/components/ui/badge";
import { useUpgradeModal } from "@/components/entitlements/UpgradeModalProvider";
import { planLabel, type EntitlementModule } from "@/lib/entitlements";

export function AppSidebar() {
  const { state } = useSidebar();
  const access = useAccess();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const collapsed = state === "collapsed";

  const groups = getVisibleNavigation(access.context);

  const planLabel = (plan: string | null) => {
    const p = (plan ?? "").toUpperCase();
    if (["PRO", "PRO_YEARLY"].includes(p)) return "PRO";
    if (p.startsWith("ENTERPRISE")) return "ENTERPRISE";
    if (p.startsWith("STARTER")) return "STARTER";
    return "FREE";
  };

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border">
      <SidebarHeader className="border-b border-sidebar-border">
        <div className="flex items-center gap-2.5 px-2 py-1.5">
          <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg gradient-primary shadow-glow">
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <div className="truncate text-sm font-bold text-sidebar-foreground">ERPX</div>
              <div className="truncate text-[11px] text-sidebar-foreground/60">
                Enterprise Suite
              </div>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent className="min-h-0 flex-1 overflow-y-auto px-1.5 pb-4">
        {groups.map((group) => (
          <SidebarGroup key={group.label}>
            {!collapsed && (
              <SidebarGroupLabel className="text-[10px] uppercase tracking-wider text-sidebar-foreground/50">
                {group.label}
              </SidebarGroupLabel>
            )}
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => (
                  <SidebarItem key={item.title} item={item} pathname={pathname} />
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter className="shrink-0 border-t border-sidebar-border">
        {!collapsed ? (
          <div className="rounded-lg bg-sidebar-accent/60 p-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-sidebar-foreground">
                {planLabel(access.plan)}
              </span>
              {access.isSuperAdmin && (
                <Badge variant="secondary" className="text-[9px]">
                  Platform Admin
                </Badge>
              )}
            </div>
            <div className="mt-0.5 text-[10px] text-sidebar-foreground/60">
              {access.isSuperAdmin
                ? "Full platform access"
                : access.isPremium
                  ? "All organization features"
                  : "Upgrade to unlock more features"}
            </div>
          </div>
        ) : (
          <div className="grid h-8 w-8 place-items-center rounded-lg bg-sidebar-accent/60">
            <Sparkles className="h-4 w-4 text-sidebar-foreground" />
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}

function SidebarItem({ item, pathname }: { item: VisibleNavItem; pathname: string }) {
  const Icon = item.icon;
  const { openUpgrade } = useUpgradeModal();

  const openLocked = () => {
    if (!item.lockedModule) return;
    openUpgrade({
      module: item.lockedModule as EntitlementModule,
      requiredPlan: item.requiredPlan ?? null,
    });
  };

  const LockBadge = item.lockedModule ? (
    <span className="ml-auto inline-flex shrink-0 items-center gap-1">
      <Lock className="h-3 w-3 text-amber-500" aria-hidden="true" />
      <Badge
        variant="secondary"
        className="h-4 rounded-full bg-amber-500/10 px-1.5 text-[9px] font-semibold uppercase tracking-wide text-amber-600 dark:text-amber-400"
      >
        {planLabel(item.requiredPlan)}
      </Badge>
    </span>
  ) : item.locked ? (
    <PremiumChip />
  ) : item.hasLockedChild ? (
    <span className="ml-auto inline-flex shrink-0 items-center" title="Some items are locked">
      <Lock className="h-3 w-3 text-amber-500" aria-label="Some items are locked" />
    </span>
  ) : null;

  if (!item.children) {
    const active = item.url === pathname;
    const content = (
      <>
        {Icon && <Icon className="h-4 w-4" />}
        <span className="flex-1 truncate">{item.title}</span>
        {LockBadge}
      </>
    );

    if (item.locked && item.lockedModule) {
      return (
        <SidebarMenuItem key={item.title}>
          <SidebarMenuButton
            tooltip={`${item.title} — locked`}
            onClick={openLocked}
            className="text-muted-foreground"
          >
            {content}
          </SidebarMenuButton>
        </SidebarMenuItem>
      );
    }

    return (
      <SidebarMenuItem key={item.title}>
        <SidebarMenuButton asChild isActive={active} tooltip={item.title}>
          <Link to={item.url!}>{content}</Link>
        </SidebarMenuButton>
      </SidebarMenuItem>
    );
  }

  if (item.locked && item.lockedModule) {
    return (
      <SidebarMenuItem key={item.title}>
        <SidebarMenuButton
          tooltip={`${item.title} — locked`}
          onClick={openLocked}
          className="text-muted-foreground"
        >
          {Icon && <Icon className="h-4 w-4" />}
          <span>{item.title}</span>
          {LockBadge}
        </SidebarMenuButton>
      </SidebarMenuItem>
    );
  }

  const open = item.children.some((c) => pathname.startsWith(c.url ?? ""));
  return (
    <Collapsible key={item.title} defaultOpen={open} className="group/collapsible">
      <SidebarMenuItem>
        <CollapsibleTrigger asChild>
          <SidebarMenuButton tooltip={item.title}>
            {Icon && <Icon className="h-4 w-4" />}
            <span>{item.title}</span>
            {LockBadge}
            <ChevronRight className="ml-auto h-4 w-4 transition-transform group-data-[state=open]/collapsible:rotate-90" />
          </SidebarMenuButton>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <SidebarMenuSub>
            {item.children.map((c) => (
              <SidebarMenuSubItem key={c.url}>
                {c.locked && c.lockedModule ? (
                  <SidebarMenuSubButton
                    onClick={() =>
                      openUpgrade({
                        module: c.lockedModule as EntitlementModule,
                        requiredPlan: c.requiredPlan ?? null,
                      })
                    }
                    className="text-muted-foreground"
                  >
                    <span className="flex-1 truncate">{c.title}</span>
                    {c.lockedModule && (
                      <span className="inline-flex items-center gap-1">
                        <Lock className="h-3 w-3 text-amber-500" />
                        <span className="text-[9px] font-semibold uppercase text-amber-600 dark:text-amber-400">
                          {planLabel(c.requiredPlan)}
                        </span>
                      </span>
                    )}
                  </SidebarMenuSubButton>
                ) : (
                  <SidebarMenuSubButton asChild isActive={pathname === c.url}>
                    <Link to={c.url!}>
                      <span className="flex-1 truncate">{c.title}</span>
                    </Link>
                  </SidebarMenuSubButton>
                )}
                {c.locked && !c.lockedModule && <PremiumChip />}
              </SidebarMenuSubItem>
            ))}
          </SidebarMenuSub>
        </CollapsibleContent>
      </SidebarMenuItem>
    </Collapsible>
  );
}
