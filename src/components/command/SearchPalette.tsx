import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { useAccess } from "@/hooks/useAccess";
import { getVisibleNavigation, type VisibleNavItem } from "@/lib/navigation-access";
import { FEATURE_SLUG_BY_ID } from "@/lib/access";
import { useAuth } from "@/lib/auth";
import { api } from "@/lib/api/client";
import { Lock, Search } from "lucide-react";

/**
 * Global command palette / search. Only pages the current user is permitted to
 * access are listed — unauthorized modules never appear in search results.
 * When a query is typed, matching business records (customers, invoices,
 * products, vendors, employees) are searched via the backend and shown too.
 */
const RECORD_SEARCH: {
  table: string;
  label: string;
  route: string;
  labelKey: string;
  searchKeys: string[];
  permission: string;
}[] = [
  {
    table: "customers",
    label: "Customers",
    route: "/sales/customers",
    labelKey: "name",
    searchKeys: ["name", "email", "gstNumber"],
    permission: "customer:read",
  },
  {
    table: "invoices",
    label: "Invoices",
    route: "/sales/invoices",
    labelKey: "invoiceNumber",
    searchKeys: ["invoiceNumber", "notes"],
    permission: "invoice:read",
  },
  {
    table: "products",
    label: "Products",
    route: "/inventory/products",
    labelKey: "name",
    searchKeys: ["name", "sku", "barcode"],
    permission: "product:read",
  },
  {
    table: "vendors",
    label: "Vendors",
    route: "/purchases/vendors",
    labelKey: "companyName",
    searchKeys: ["companyName", "email"],
    permission: "vendor:read",
  },
  {
    table: "employees",
    label: "Employees",
    route: "/hrms/employees",
    labelKey: "firstName",
    searchKeys: ["firstName", "lastName", "email"],
    permission: "employee:read",
  },
  {
    table: "leads",
    label: "Leads",
    route: "/crm/leads",
    labelKey: "contactName",
    searchKeys: ["contactName", "email", "companyName"],
    permission: "lead:read",
  },
  {
    table: "purchase_orders",
    label: "Purchase Orders",
    route: "/purchases/purchase-orders",
    labelKey: "poNumber",
    searchKeys: ["poNumber"],
    permission: "purchase_order:read",
  },
  {
    table: "sales_invoices",
    label: "Sales Invoices",
    route: "/sales/invoices",
    labelKey: "invoiceNumber",
    searchKeys: ["invoiceNumber"],
    permission: "invoice:read",
  },
  {
    table: "quotations",
    label: "Quotations",
    route: "/sales/quotations",
    labelKey: "quotationNumber",
    searchKeys: ["quotationNumber"],
    permission: "quotation:read",
  },
];

export function SearchPalette({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const access = useAccess();
  const navigate = useNavigate();
  const { activeOrganizationId } = useAuth();
  const [query, setQuery] = useState("");

  useEffect(() => {
    if (!open) setQuery("");
  }, [open]);

  const routes = useMemo(() => {
    const groups = getVisibleNavigation(access.context);
    const out: { title: string; url: string; group: string; locked: boolean }[] = [];
    for (const g of groups) {
      for (const item of g.items) {
        if (item.children) {
          for (const c of item.children) {
            if (!c.url) continue;
            out.push({ title: c.title, url: c.url, group: g.label, locked: c.locked === true });
          }
        } else if (item.url) {
          out.push({
            title: item.title,
            url: item.url,
            group: g.label,
            locked: item.locked === true,
          });
        }
      }
    }
    return out;
  }, [access.context]);

  const filteredRoutes = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return routes;
    return routes.filter(
      (r) => r.title.toLowerCase().includes(q) || r.group.toLowerCase().includes(q),
    );
  }, [query, routes]);

  const searchable = useMemo(
    () => RECORD_SEARCH.filter((s) => access.canAny([s.permission])),
    [access],
  );

  const { data: records = [], isFetching } = useQuery({
    queryKey: ["global-search", activeOrganizationId, query],
    queryFn: async () => {
      const q = query.trim();
      if (!q) return [];
      const results: {
        table: string;
        label: string;
        id: string;
        route: string;
      }[] = [];
      const hits = searchable.slice(0, 5);
      await Promise.all(
        hits.map(async (cfg) => {
          try {
            const res = await api.get<unknown>(
              `/business-data/organizations/${activeOrganizationId}/${cfg.table}`,
              { params: { search: q, searchKeys: cfg.searchKeys.join(","), limit: "5" } },
            );
            const rows = Array.isArray(res)
              ? (res as Record<string, unknown>[])
              : ((res as { data?: Record<string, unknown>[] })?.data ?? []);
            rows.forEach((row) => {
              const value = cfg.labelKey
                .split(".")
                .reduce(
                  (acc: unknown, part: string) =>
                    acc && typeof acc === "object" && part in acc
                      ? (acc as Record<string, unknown>)[part]
                      : undefined,
                  row,
                );
              const labelValue =
                value ??
                row[cfg.labelKey] ??
                row.name ??
                row.companyName ??
                row.invoiceNumber ??
                cfg.label;
              results.push({
                table: cfg.label,
                label: `${cfg.label} · ${String(labelValue)}`,
                id: String(row.id),
                route: cfg.route,
              });
            });
          } catch {
            // Table may not be allowed for this user's plan; skip silently.
          }
        }),
      );
      return results;
    },
    enabled: !!activeOrganizationId && !!query.trim(),
    staleTime: 30000,
  });

  const showRecords = query.trim().length >= 2;

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput
        placeholder="Search pages and records…"
        value={query}
        onValueChange={setQuery}
      />
      <CommandList>
        <CommandEmpty>No results.</CommandEmpty>
        {showRecords && (
          <>
            {isFetching && (
              <CommandGroup heading="Records">
                <CommandItem disabled>Searching…</CommandItem>
              </CommandGroup>
            )}
            {records.length > 0 && (
              <CommandGroup heading="Records">
                {records.slice(0, 10).map((rec) => (
                  <CommandItem
                    key={`${rec.table}-${rec.id}`}
                    value={`${rec.table} ${rec.label}`}
                    onSelect={() => {
                      onOpenChange(false);
                      navigate({ to: rec.route });
                    }}
                  >
                    <Search className="mr-2 h-3.5 w-3.5 text-muted-foreground" />
                    <span className="flex-1 truncate">{rec.label}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
            {records.length > 0 && <CommandSeparator />}
          </>
        )}
        {groupByLabel(filteredRoutes).map(([label, items]) => (
          <CommandGroup key={label} heading={label}>
            {items.map((item) => (
              <CommandItem
                key={item.url}
                value={`${item.title} ${item.url}`}
                onSelect={() => {
                  onOpenChange(false);
                  navigate({ to: item.url });
                }}
              >
                <span className="flex-1">{item.title}</span>
                {item.locked && <Lock className="h-3.5 w-3.5 text-amber-500" />}
              </CommandItem>
            ))}
          </CommandGroup>
        ))}
      </CommandList>
    </CommandDialog>
  );
}

function groupByLabel(items: { title: string; url: string; group: string; locked: boolean }[]) {
  const map = new Map<string, typeof items>();
  for (const item of items) {
    if (!map.has(item.group)) map.set(item.group, []);
    map.get(item.group)!.push(item);
  }
  return [...map.entries()];
}

export type { VisibleNavItem };
