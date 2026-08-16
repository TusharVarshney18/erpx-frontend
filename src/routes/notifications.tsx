import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { useAuth } from "@/lib/auth";
import { notificationsApi, type AppNotification } from "@/lib/api/notifications";
import { PageHeader } from "@/components/layout/PageShell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Bell,
  BellOff,
  CheckCheck,
  Trash2,
  Loader2,
  AlertCircle,
  AlertTriangle,
  RefreshCw,
  Info,
  CheckCircle2,
  FileText,
  Package,
  ShoppingCart,
  Workflow,
  ChevronLeft,
  ChevronRight,
  type LucideIcon,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/notifications")({
  head: () => ({ meta: [{ title: "Notifications — Acme ERP" }] }),
  component: NotificationsPage,
});

const TYPE_META: Record<string, { icon: LucideIcon; className: string }> = {
  WORKFLOW: {
    icon: Workflow,
    className: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300",
  },
  SYSTEM: {
    icon: Info,
    className: "bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300",
  },
  ALERT: {
    icon: AlertTriangle,
    className: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
  },
  TASK: {
    icon: CheckCircle2,
    className: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
  },
  INVOICE: {
    icon: FileText,
    className: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
  },
  ORDER: {
    icon: ShoppingCart,
    className: "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300",
  },
  STOCK: {
    icon: Package,
    className: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300",
  },
};

const DEFAULT_TYPE_META = {
  icon: Bell,
  className: "bg-accent text-accent-foreground",
};

function getTypeMeta(type: string) {
  return TYPE_META[type.toUpperCase()] ?? DEFAULT_TYPE_META;
}

function timeAgo(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return formatDistanceToNow(date, { addSuffix: true });
}

function NotificationsPage() {
  const qc = useQueryClient();
  const { activeOrganizationId } = useAuth();
  const [filter, setFilter] = useState<"all" | "unread">("all");
  const [page, setPage] = useState(1);
  const pageSize = 20;

  const {
    data: notifications = [],
    isLoading,
    isError,
    isFetching,
    refetch,
  } = useQuery({
    queryKey: ["notifications", activeOrganizationId, filter, page],
    queryFn: () =>
      notificationsApi.list({
        page,
        limit: pageSize,
        isRead: filter === "unread" ? false : undefined,
      }),
    enabled: !!activeOrganizationId,
    refetchInterval: 30000,
  });

  const { data: unreadData } = useQuery({
    queryKey: ["notifications-unread", activeOrganizationId],
    queryFn: () => notificationsApi.unreadCount(),
    enabled: !!activeOrganizationId,
    refetchInterval: 30000,
  });

  const refresh = () => {
    qc.invalidateQueries({ queryKey: ["notifications"] });
    qc.invalidateQueries({ queryKey: ["notifications-preview"] });
    qc.invalidateQueries({ queryKey: ["notifications-unread"] });
  };

  const markRead = useMutation({
    mutationFn: (id: string) => notificationsApi.markRead(id),
    onSuccess: refresh,
    onError: (e: any) => toast.error(e.message ?? "Failed to mark as read"),
  });

  const markAllRead = useMutation({
    mutationFn: () => notificationsApi.markAllRead(),
    onSuccess: () => {
      refresh();
      toast.success("All notifications marked as read");
    },
    onError: (e: any) => toast.error(e.message ?? "Failed to mark all as read"),
  });

  const deleteNotification = useMutation({
    mutationFn: (id: string) => notificationsApi.remove(id),
    onSuccess: () => {
      refresh();
      toast.success("Notification deleted");
    },
    onError: (e: any) => toast.error(e.message ?? "Failed to delete notification"),
  });

  const hasMore = notifications.length === pageSize;

  return (
    <div className="mx-auto max-w-[1400px] space-y-6">
      <PageHeader
        title="Notifications"
        subtitle="Review alerts and updates across your organization"
        actions={
          <Button
            variant="outline"
            size="sm"
            disabled={markAllRead.isPending || !notifications.some((n) => !n.isRead)}
            onClick={() => markAllRead.mutate()}
          >
            {markAllRead.isPending ? (
              <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
            ) : (
              <CheckCheck className="mr-1.5 h-3.5 w-3.5" />
            )}
            Mark all as read
          </Button>
        }
      />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1 rounded-lg border border-border bg-muted/40 p-1">
          {(["all", "unread"] as const).map((f) => (
            <button
              key={f}
              onClick={() => {
                setFilter(f);
                setPage(1);
              }}
              className={cn(
                "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                filter === f
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {f === "all" ? "All" : "Unread"}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          {isFetching && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
          {unreadData?.count ? (
            <Badge variant="secondary" className="text-xs">
              {unreadData.count} unread
            </Badge>
          ) : null}
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="space-y-2 p-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-20 w-full" />
              ))}
            </div>
          ) : isError ? (
            <div className="flex flex-col items-center gap-3 py-16 text-center">
              <AlertCircle className="h-10 w-10 text-destructive" />
              <p className="font-semibold">Failed to load notifications</p>
              <p className="text-sm text-muted-foreground">
                Check your connection and try again.
              </p>
              <Button variant="outline" size="sm" onClick={() => refetch()}>
                <RefreshCw className="mr-1.5 h-3.5 w-3.5" /> Retry
              </Button>
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-16 text-center">
              <div className="grid h-12 w-12 place-items-center rounded-xl bg-accent text-accent-foreground">
                <BellOff className="h-6 w-6" />
              </div>
              <p className="font-semibold">
                {filter === "unread" ? "No unread notifications" : "No notifications yet"}
              </p>
              <p className="text-sm text-muted-foreground">
                {filter === "unread"
                  ? "You're all caught up."
                  : "Notifications will appear here as they arrive."}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {notifications.map((notification) => {
                const meta = getTypeMeta(notification.type);
                const Icon = meta.icon;
                return (
                  <div
                    key={notification.id}
                    onClick={() => {
                      if (!notification.isRead) markRead.mutate(notification.id);
                    }}
                    className={cn(
                      "flex cursor-pointer items-start gap-3 p-4 transition-colors hover:bg-accent/40",
                      !notification.isRead && "bg-primary/5",
                    )}
                  >
                    <div
                      className={cn(
                        "mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-lg",
                        meta.className,
                      )}
                    >
                      <Icon className="h-4.5 w-4.5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <p
                          className={cn(
                            "truncate text-sm font-medium",
                            !notification.isRead && "font-semibold",
                          )}
                        >
                          {notification.title}
                        </p>
                        <span className="shrink-0 text-xs text-muted-foreground">
                          {timeAgo(notification.createdAt)}
                        </span>
                      </div>
                      {notification.body && (
                        <p className="mt-0.5 line-clamp-2 text-sm text-muted-foreground">
                          {notification.body}
                        </p>
                      )}
                      <div className="mt-1.5 flex items-center gap-2">
                        <Badge
                          variant="outline"
                          className="border-0 bg-muted px-1.5 py-0 text-[10px] font-medium text-muted-foreground"
                        >
                          {notification.type}
                        </Badge>
                        {!notification.isRead && (
                          <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                        )}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteNotification.mutate(notification.id);
                      }}
                    >
                      {deleteNotification.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {!isLoading && !isError && notifications.length > 0 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">Page {page}</p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              <ChevronLeft className="mr-1 h-3.5 w-3.5" /> Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={!hasMore}
              onClick={() => setPage((p) => p + 1)}
            >
              Next <ChevronRight className="ml-1 h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
