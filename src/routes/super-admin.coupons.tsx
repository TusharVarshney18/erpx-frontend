import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import { RequireSuperAdmin } from "@/components/guards/RequireSuperAdmin";
import { PageHeader } from "@/components/layout/PageShell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Ticket,
  Loader2,
  AlertCircle,
  RefreshCw,
  Ban,
  TimerOff,
  Trash2,
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

export const Route = createFileRoute("/super-admin/coupons")({
  head: () => ({ meta: [{ title: "Coupons — Super Admin — Acme ERP" }] }),
  component: () => (
    <RequireSuperAdmin>
      <SuperAdminCoupons />
    </RequireSuperAdmin>
  ),
});

type Coupon = {
  id: string;
  code: string;
  name: string;
  description: string | null;
  discountType: "PERCENTAGE" | "FIXED_AMOUNT";
  discountValue: number;
  maxUses: number | null;
  usedCount: number;
  maxUsesPerCustomer: number | null;
  currency: string | null;
  minAmount: number | null;
  startsAt: string | null;
  expiresAt: string | null;
  isActive: boolean;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
  _count: { usages: number };
};

type CouponAnalytics = {
  totalCoupons: number;
  activeCoupons: number;
  totalUses: number;
  coupons: Coupon[];
};

type CouponStatus = "Active" | "Disabled" | "Expired" | "Deleted";

const STATUS_STYLES: Record<string, string> = {
  Active: "bg-success/15 text-success",
  Disabled: "bg-muted text-muted-foreground",
  Expired: "bg-warning/15 text-warning",
  Deleted: "bg-destructive/15 text-destructive",
};

const statusOf = (c: Coupon): CouponStatus => {
  if (c.deletedAt) return "Deleted";
  if (!c.isActive) return "Disabled";
  if (c.expiresAt && new Date(c.expiresAt).getTime() < Date.now()) return "Expired";
  return "Active";
};

function SuperAdminCoupons() {
  const qc = useQueryClient();
  const [deleting, setDeleting] = useState<Coupon | null>(null);

  const { data: coupons = [], isLoading, isError, refetch } = useQuery({
    queryKey: ["super-admin-coupons"],
    queryFn: () => api.get<Coupon[]>("/super-admin/coupons"),
  });

  const { data: analytics, isLoading: analyticsLoading, isError: analyticsError, refetch: refetchAnalytics } = useQuery({
    queryKey: ["super-admin-coupon-analytics"],
    queryFn: () => api.get<CouponAnalytics>("/super-admin/coupons/analytics"),
  });

  const disableCoupon = useMutation({
    mutationFn: async (id: string) => {
      return api.patch(`/super-admin/coupons/${id}/disable`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["super-admin-coupons"] });
      qc.invalidateQueries({ queryKey: ["super-admin-coupon-analytics"] });
      toast.success("Coupon disabled");
    },
    onError: (e: any) => toast.error(e.message ?? "Disable failed"),
  });

  const expireCoupon = useMutation({
    mutationFn: async (id: string) => {
      return api.post(`/super-admin/coupons/${id}/expire`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["super-admin-coupons"] });
      qc.invalidateQueries({ queryKey: ["super-admin-coupon-analytics"] });
      toast.success("Coupon expired");
    },
    onError: (e: any) => toast.error(e.message ?? "Expire failed"),
  });

  const deleteCoupon = useMutation({
    mutationFn: async (id: string) => {
      return api.delete(`/super-admin/coupons/${id}`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["super-admin-coupons"] });
      qc.invalidateQueries({ queryKey: ["super-admin-coupon-analytics"] });
      toast.success("Coupon deleted");
      setDeleting(null);
    },
    onError: (e: any) => toast.error(e.message ?? "Delete failed"),
  });

  const formatDiscount = (c: Coupon) => {
    if (c.discountType === "PERCENTAGE") return `${c.discountValue}% off`;
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: c.currency ?? "INR",
      maximumFractionDigits: 0,
    }).format(c.discountValue);
  };

  const kpis = [
    {
      label: "Total Coupons",
      value: analytics?.totalCoupons ?? coupons.length,
      sub: analytics ? "across all organizations" : "from list",
      loading: analyticsLoading,
    },
    {
      label: "Active Coupons",
      value: analytics?.activeCoupons ?? 0,
      sub: "currently enabled",
      loading: analyticsLoading,
    },
    {
      label: "Total Uses",
      value: analytics?.totalUses ?? 0,
      sub: "redemptions recorded",
      loading: analyticsLoading,
    },
  ];

  return (
    <div className="max-w-[1400px] mx-auto space-y-6">
      <PageHeader title="Coupons" subtitle="Manage discount codes across the platform" />

      {analyticsError && !analyticsLoading ? (
        <div className="flex flex-col items-center gap-3 py-10 text-center">
          <AlertCircle className="h-10 w-10 text-destructive" />
          <p className="font-semibold">Failed to load coupon analytics</p>
          <Button variant="outline" size="sm" onClick={() => refetchAnalytics()}>
            <RefreshCw className="mr-1.5 h-3.5 w-3.5" /> Retry
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-3">
          {kpis.map((kpi) => (
            <Card key={kpi.label}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{kpi.label}</CardTitle>
              </CardHeader>
              <CardContent>
                {kpi.loading ? (
                  <Skeleton className="h-8 w-20" />
                ) : (
                  <>
                    <p className="text-3xl font-bold tracking-tight">{kpi.value}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">{kpi.sub}</p>
                  </>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="space-y-2 p-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : isError ? (
            <div className="flex flex-col items-center gap-3 py-16 text-center">
              <AlertCircle className="h-10 w-10 text-destructive" />
              <p className="font-semibold">Failed to load coupons</p>
              <p className="text-sm text-muted-foreground">Check your connection and try again.</p>
              <Button variant="outline" size="sm" onClick={() => refetch()}>
                <RefreshCw className="mr-1.5 h-3.5 w-3.5" /> Retry
              </Button>
            </div>
          ) : coupons.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-16 text-center">
              <div className="grid h-12 w-12 place-items-center rounded-xl bg-accent text-accent-foreground">
                <Ticket className="h-6 w-6" />
              </div>
              <p className="font-semibold">No coupons yet</p>
              <p className="text-sm text-muted-foreground">
                Discount coupons created on subscriptions will appear here.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Discount</TableHead>
                  <TableHead>Max Uses / Used</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Expires</TableHead>
                  <TableHead className="w-[180px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {coupons.map((c) => {
                  const status = statusOf(c);
                  const usable = status === "Active";
                  return (
                    <TableRow key={c.id}>
                      <TableCell className="font-mono text-sm font-medium">{c.code}</TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium">{c.name}</span>
                          {c.description && (
                            <span className="max-w-[240px] truncate text-xs text-muted-foreground">
                              {c.description}
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">{formatDiscount(c)}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {c.usedCount} / {c.maxUses ?? "∞"}
                      </TableCell>
                      <TableCell>
                        <Badge className={STATUS_STYLES[status]}>{status}</Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {c.expiresAt ? format(new Date(c.expiresAt), "MMM dd, yyyy") : "—"}
                      </TableCell>
                      <TableCell>
                        {usable ? (
                          <div className="flex gap-1.5">
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-8 px-2.5 text-xs"
                              onClick={() => disableCoupon.mutate(c.id)}
                              disabled={disableCoupon.isPending}
                            >
                              {disableCoupon.isPending ? (
                                <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                              ) : (
                                <Ban className="mr-1.5 h-3.5 w-3.5" />
                              )}
                              Disable
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-8 px-2.5 text-xs"
                              onClick={() => expireCoupon.mutate(c.id)}
                              disabled={expireCoupon.isPending}
                            >
                              {expireCoupon.isPending ? (
                                <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                              ) : (
                                <TimerOff className="mr-1.5 h-3.5 w-3.5" />
                              )}
                              Expire
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-8 px-2.5 text-xs text-destructive hover:text-destructive"
                              onClick={() => setDeleting(c)}
                            >
                              <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                              Delete
                            </Button>
                          </div>
                        ) : (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 px-2.5 text-xs text-destructive hover:text-destructive"
                            onClick={() => setDeleting(c)}
                          >
                            <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                            Delete
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete coupon?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleting?.code} will be soft-deleted and immediately disabled. This can be reversed
              only through database-level restore.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-white hover:bg-destructive/90"
              disabled={deleteCoupon.isPending}
              onClick={() => deleting && deleteCoupon.mutate(deleting.id)}
            >
              {deleteCoupon.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
