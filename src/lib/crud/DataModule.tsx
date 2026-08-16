import { useMemo, useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import { useAuth } from "@/lib/auth";
import { useAccess } from "@/hooks/useAccess";
import { PageHeader } from "@/components/layout/PageShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import {
  Plus,
  MoreHorizontal,
  Pencil,
  Trash2,
  Inbox,
  AlertCircle,
  Loader2,
  Search,
  X,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Download,
  RefreshCw,
  Columns3,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Command, CommandInput, CommandEmpty, CommandList, CommandItem, CommandGroup } from "@/components/ui/command";
import { Check, ChevronsUpDown } from "lucide-react";
import { toast } from "sonner";

export type FieldType =
  | "text"
  | "textarea"
  | "number"
  | "date"
  | "select"
  | "email"
  | "tel"
  | "lookup";

export type Field = {
  key: string;
  label: string;
  type?: FieldType;
  options?: string[];
  required?: boolean;
  defaultValue?: any;
  hideInTable?: boolean;
  hideInForm?: boolean;
  badge?: Record<string, string>;
  format?: (v: any, row: any) => React.ReactNode;
  sortable?: boolean;
  /** For type === "lookup": fetch options from this business-data table. */
  lookupTable?: string;
  /** Field on the lookup record whose value is submitted (defaults to "id"). */
  lookupValueKey?: string;
  /** Field on the lookup record used as the display label (defaults to "name"). */
  lookupLabelKey?: string;
};

export type DataModuleProps = {
  title: string;
  subtitle?: string;
  table: string;
  fields: Field[];
  orderBy?: { column: string; ascending?: boolean };
  searchKeys?: string[];
  newLabel?: string;
  /**
   * RBAC resource prefix for action-level gating (e.g. "customer").
   * When provided, New/Edit/Delete/Bulk actions are hidden unless the user has
   * the matching <prefix>:create / :update / :delete permission.
   */
  permissionPrefix?: string;
  /** Override the create-permission check (e.g. custom create permission). */
  createPermission?: string;
};

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

function orgPath(orgId: string | null, table: string): string {
  if (!orgId) return "";
  return `/business-data/organizations/${orgId}/${table}`;
}

function colStorageKey(table: string) {
  return `datamodule-columns-${table}`;
}

export function DataModule({
  title,
  subtitle,
  table,
  fields,
  orderBy: defaultOrderBy,
  searchKeys,
  newLabel,
  permissionPrefix,
  createPermission,
}: DataModuleProps) {
  const qc = useQueryClient();
  const { user, activeOrganizationId } = useAuth();
  const access = useAccess();
  const orgId = activeOrganizationId || user?.organization?.id || null;

  const canCreate = useMemo(() => {
    if (!permissionPrefix) return true;
    return access.canAny([createPermission ?? `${permissionPrefix}:create`]);
  }, [permissionPrefix, createPermission, access]);

  const canUpdate = useMemo(() => {
    if (!permissionPrefix) return true;
    return access.canAny([`${permissionPrefix}:update`]);
  }, [permissionPrefix, access]);

  const canDelete = useMemo(() => {
    if (!permissionPrefix) return true;
    return access.canAny([`${permissionPrefix}:delete`]);
  }, [permissionPrefix, access]);

  const [rawSearch, setRawSearch] = useState("");
  const [openForm, setOpenForm] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);
  const [confirmDel, setConfirmDel] = useState<any | null>(null);
  const [confirmBulkDel, setConfirmBulkDel] = useState(false);

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [sortBy, setSortBy] = useState<string | null>(defaultOrderBy?.column ?? null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">(defaultOrderBy?.ascending !== false ? "asc" : "desc");

  const [selected, setSelected] = useState<Set<string>>(new Set());

  const allFields = fields;
  const allTableFields = useMemo(() => allFields.filter((f) => !f.hideInTable), [allFields]);

  const [visibleKeys, setVisibleKeys] = useState<Set<string>>(() => {
    try {
      const stored = localStorage.getItem(colStorageKey(table));
      if (stored) {
        const parsed: string[] = JSON.parse(stored);
        const valid = allTableFields.map((f) => f.key);
        const filtered = parsed.filter((k) => valid.includes(k));
        if (filtered.length > 0) return new Set(filtered);
      }
    } catch {}
    return new Set(allTableFields.map((f) => f.key));
  });

  const debouncedSearch = useDebounce(rawSearch, 300);

  const basePath = orgPath(orgId, table);
  const queryKey = useMemo(
    () => [table, orgId, page, pageSize, sortBy, sortDir, debouncedSearch],
    [table, orgId, page, pageSize, sortBy, sortDir, debouncedSearch],
  );

  const {
    data: queryResult,
    isLoading,
    refetch,
    isFetching,
    error,
  } = useQuery({
    queryKey,
    queryFn: async () => {
      const params: Record<string, string> = {
        page: String(page),
        pageSize: String(pageSize),
      };
      if (sortBy) {
        params.orderBy = sortBy;
        params.ascending = String(sortDir === "asc");
      }
      if (debouncedSearch && searchKeys) {
        params.search = debouncedSearch;
        params.searchKeys = searchKeys.join(",");
      }
      const res = await api.get<any>(basePath, { params });
      const data = Array.isArray(res) ? res : (res?.data ?? []);
      const total = Array.isArray(res) ? data.length : (res?.total ?? data.length);
      return { data, total };
    },
    enabled: !!orgId,
  });

  const rows = queryResult?.data ?? [];
  const total = queryResult?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch]);

  useEffect(() => {
    setSelected((prev) => {
      const ids = new Set(rows.map((r: any) => String(r.id)));
      return new Set([...prev].filter((id) => ids.has(id)));
    });
  }, [rows]);

  const upsert = useMutation({
    mutationFn: async (values: any) => {
      Object.keys(values).forEach((k) => {
        if (values[k] === "" || values[k] === undefined) values[k] = null;
      });
      if (editing) {
        return api.patch(`${basePath}/${editing.id}`, values);
      } else {
        return api.post(basePath, values);
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey });
      toast.success(editing ? "Updated successfully" : "Created successfully");
      setOpenForm(false);
      setEditing(null);
    },
    onError: (e: any) => toast.error(e.message ?? "Save failed"),
  });

  const del = useMutation({
    mutationFn: async (row: any) => {
      return api.delete(`${basePath}/${row.id}`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey });
      toast.success("Deleted");
      setConfirmDel(null);
    },
    onError: (e: any) => toast.error(e.message ?? "Delete failed"),
  });

  const bulkDel = useMutation({
    mutationFn: async (ids: string[]) => {
      return api.delete(basePath, { body: JSON.stringify({ ids }) });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey });
      toast.success(`Deleted ${selected.size} record${selected.size === 1 ? "" : "s"}`);
      setSelected(new Set());
      setConfirmBulkDel(false);
    },
    onError: (e: any) => toast.error(e.message ?? "Bulk delete failed"),
  });

  const tableFields = useMemo(
    () => allTableFields.filter((f) => visibleKeys.has(f.key)),
    [allTableFields, visibleKeys],
  );

  const toggleSort = (key: string) => {
    if (sortBy === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(key);
      setSortDir("asc");
    }
  };

  const allSelected = rows.length > 0 && selected.size === rows.length;
  const someSelected = selected.size > 0 && selected.size < rows.length;

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelected(new Set());
    } else {
      setSelected(new Set(rows.map((r: any) => String(r.id))));
    }
  };

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const exportCSV = () => {
    const headers = tableFields.map((f) => f.label);
    const csvRows = [headers.map((h) => `"${h.replace(/"/g, '""')}"`).join(",")];
    rows.forEach((row: any) => {
      const vals = tableFields.map((f) => {
        const v = row[f.key];
        if (v == null) return "";
        const s = String(v).replace(/"/g, '""');
        return `"${s}"`;
      });
      csvRows.push(vals.join(","));
    });
    const blob = new Blob([csvRows.join("\r\n")], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `${table}-export.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
    toast.success("CSV exported");
  };

  const toggleColumn = (key: string) => {
    setVisibleKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      localStorage.setItem(colStorageKey(table), JSON.stringify([...next]));
      return next;
    });
  };

  const paginationStart = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const paginationEnd = Math.min(page * pageSize, total);

  return (
    <div className="space-y-4">
      <PageHeader
        title={title}
        subtitle={
          subtitle ??
          (isLoading
            ? "Loading\u2026"
            : `${total.toLocaleString("en-IN")} record${total === 1 ? "" : "s"}`)
        }
        actions={
          canCreate ? (
            <Button
              size="sm"
              className="gradient-primary text-white"
              onClick={() => {
                setEditing(null);
                setOpenForm(true);
              }}
            >
              <Plus className="mr-1.5 h-3.5 w-3.5" /> {newLabel ?? "New"}
            </Button>
          ) : undefined
        }
      />

      <div className="flex flex-wrap items-center gap-2 rounded-xl border border-border bg-card p-2">
        <div className="relative min-w-0 flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search\u2026"
            className="h-9 border-0 bg-muted/50 pl-9 pr-9"
            value={rawSearch}
            onChange={(e) => setRawSearch(e.target.value)}
          />
          {rawSearch && (
            <button
              type="button"
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              onClick={() => setRawSearch("")}
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        <Button
          variant="outline"
          size="sm"
          className="h-9"
          onClick={() => refetch()}
          disabled={isFetching}
        >
          <RefreshCw className={`mr-1.5 h-3.5 w-3.5 ${isFetching ? "animate-spin" : ""}`} />
          Refresh
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="h-9">
              <Columns3 className="mr-1.5 h-3.5 w-3.5" /> Columns
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="max-h-72">
            <DropdownMenuLabel>Toggle columns</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {allTableFields.map((f) => (
              <DropdownMenuCheckboxItem
                key={f.key}
                checked={visibleKeys.has(f.key)}
                onCheckedChange={() => toggleColumn(f.key)}
              >
                {f.label}
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <Button
          variant="outline"
          size="sm"
          className="h-9"
          onClick={exportCSV}
          disabled={rows.length === 0}
        >
          <Download className="mr-1.5 h-3.5 w-3.5" /> Export
        </Button>

        {selected.size > 0 && canDelete && (
          <Button
            variant="destructive"
            size="sm"
            className="h-9"
            onClick={() => setConfirmBulkDel(true)}
          >
            <Trash2 className="mr-1.5 h-3.5 w-3.5" /> Delete ({selected.size})
          </Button>
        )}
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="space-y-2 p-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
              <div className="grid h-12 w-12 place-items-center rounded-xl bg-destructive/10 text-destructive">
                <AlertCircle className="h-6 w-6" />
              </div>
              <div className="text-base font-semibold">Failed to load data</div>
              <p className="max-w-md text-sm text-muted-foreground">
                {(error as Error)?.message ?? "Unknown error"}
              </p>
              <Button size="sm" variant="outline" onClick={() => refetch()}>
                <RefreshCw className="mr-1.5 h-3.5 w-3.5" /> Retry
              </Button>
            </div>
          ) : rows.length === 0 ? (
            <EmptyState
              onCreate={
                canCreate
                  ? () => {
                      setEditing(null);
                      setOpenForm(true);
                    }
                  : undefined
              }
              label={newLabel ?? "record"}
            />
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10">
                      <Checkbox
                        checked={allSelected || (someSelected ? "indeterminate" : false)}
                        onCheckedChange={toggleSelectAll}
                        aria-label="Select all"
                      />
                    </TableHead>
                    {tableFields.map((f) => (
                      <TableHead
                        key={f.key}
                        className={f.sortable === false ? "" : "cursor-pointer select-none"}
                        onClick={() => f.sortable !== false && toggleSort(f.key)}
                      >
                        <span className="inline-flex items-center gap-1">
                          {f.label}
                          {f.sortable !== false &&
                            (sortBy === f.key ? (
                              sortDir === "asc" ? (
                                <ArrowUp className="h-3.5 w-3.5" />
                              ) : (
                                <ArrowDown className="h-3.5 w-3.5" />
                              )
                            ) : (
                              <ArrowUpDown className="h-3.5 w-3.5 opacity-30" />
                            ))}
                        </span>
                      </TableHead>
                    ))}
                    <TableHead className="w-10" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((row: any) => (
                    <TableRow
                      key={row.id}
                      className={canUpdate ? "cursor-pointer" : ""}
                      onClick={() => {
                        if (!canUpdate) return;
                        setEditing(row);
                        setOpenForm(true);
                      }}
                    >
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <Checkbox
                          checked={selected.has(String(row.id))}
                          onCheckedChange={() => toggleSelect(String(row.id))}
                          aria-label={`Select row ${row.id}`}
                        />
                      </TableCell>
                      {tableFields.map((f) => (
                        <TableCell key={f.key}>{renderCell(row, f)}</TableCell>
                      ))}
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {canUpdate && (
                              <DropdownMenuItem
                                onClick={() => {
                                  setEditing(row);
                                  setOpenForm(true);
                                }}
                              >
                                <Pencil className="mr-2 h-4 w-4" /> Edit
                              </DropdownMenuItem>
                            )}
                            {canDelete && (
                              <DropdownMenuItem
                                className="text-destructive"
                                onClick={() => setConfirmDel(row)}
                              >
                                <Trash2 className="mr-2 h-4 w-4" /> Delete
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {selected.size > 0 && (
                <div className="border-t border-border px-4 py-2 text-sm text-muted-foreground">
                  {selected.size} of {total} row{selected.size === 1 ? "" : "s"} selected
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {total > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground">
            Showing {paginationStart} to {paginationEnd} of{" "}
            {total.toLocaleString("en-IN")} results
          </p>
          <div className="flex items-center gap-2">
            <Select
              value={String(pageSize)}
              onValueChange={(v) => {
                setPageSize(Number(v));
                setPage(1);
              }}
            >
              <SelectTrigger className="h-8 w-20 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[10, 25, 50, 100].map((n) => (
                  <SelectItem key={n} value={String(n)}>
                    {n}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                disabled={page <= 1}
                onClick={() => setPage(1)}
              >
                <ChevronsLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>

              <span className="min-w-[5rem] text-center text-sm text-muted-foreground">
                Page {page} of {totalPages}
              </span>

              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                disabled={page >= totalPages}
                onClick={() => setPage(totalPages)}
              >
                <ChevronsRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      )}

      <FormDialog
        open={openForm}
        onClose={() => {
          setOpenForm(false);
          setEditing(null);
        }}
        fields={fields}
        title={editing ? `Edit ${title.replace(/s$/, "")}` : `New ${title.replace(/s$/, "")}`}
        initial={editing}
        busy={upsert.isPending}
        orgId={orgId}
        onSubmit={(values) => upsert.mutate(values)}
      />

      <AlertDialog open={!!confirmDel} onOpenChange={(o) => !o && setConfirmDel(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete record?</AlertDialogTitle>
            <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => confirmDel && del.mutate(confirmDel)}
              className="bg-destructive text-destructive-foreground"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={confirmBulkDel} onOpenChange={(o) => !o && setConfirmBulkDel(false)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Delete {selected.size} record{selected.size === 1 ? "" : "s"}?
            </AlertDialogTitle>
            <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => bulkDel.mutate([...selected])}
              className="bg-destructive text-destructive-foreground"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function LookupSelect({
  orgId,
  table,
  value,
  onChange,
  labelKey = "name",
  valueKey = "id",
  placeholder = "Search and select\u2026",
}: {
  orgId: string | null;
  table: string;
  value: string;
  onChange: (v: string) => void;
  labelKey?: string;
  valueKey?: string;
  placeholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const { data: options = [], isFetching } = useQuery({
    queryKey: ["datamodule-lookup", orgId, table, search],
    queryFn: async () => {
      const params: Record<string, string> = { limit: "100", ascending: "true" };
      if (search) {
        params.search = search;
        params.searchKeys = labelKey;
      }
      const res = await api.get<any>(`/business-data/organizations/${orgId}/${table}`, { params });
      return Array.isArray(res) ? res : (res?.data ?? []);
    },
    enabled: !!orgId && open,
  });

  const selected = options.find((o: any) => String(o[valueKey]) === String(value));
  const label = selected ? (selected[labelKey] ?? selected.name ?? value) : "";

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="h-9 w-full justify-between font-normal"
        >
          <span className="truncate">{value ? label || value : placeholder}</span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-[var(--radix-popover-trigger-width)] p-0">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder={`Search ${table.replace(/_/g, " ")}…`}
            value={search}
            onValueChange={setSearch}
          />
          <CommandList>
            <CommandEmpty>{isFetching ? "Loading…" : "No matches found"}</CommandEmpty>
            <CommandGroup>
              {options.map((o: any) => {
                const v = String(o[valueKey]);
                const lbl = String(o[labelKey] ?? o.name ?? v);
                return (
                  <CommandItem
                    key={v}
                    value={v}
                    onSelect={() => {
                      onChange(v);
                      setOpen(false);
                    }}
                  >
                    <Check className={cn("mr-2 h-4 w-4", value === v ? "opacity-100" : "opacity-0")} />
                    {lbl}
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

function renderCell(row: any, f: Field) {
  const v = row[f.key];
  if (f.format) return f.format(v, row);
  if (f.badge && v != null) {
    const cls = f.badge[String(v)] ?? "bg-muted text-muted-foreground";
    return (
      <Badge variant="secondary" className={cls}>
        {String(v)}
      </Badge>
    );
  }
  if (v == null || v === "") return <span className="text-muted-foreground">&mdash;</span>;
  if (f.type === "number") return Number(v).toLocaleString("en-IN");
  if (f.type === "date") return new Date(v).toLocaleDateString();
  return String(v);
}

function FormDialog({
  open,
  onClose,
  fields,
  title,
  initial,
  busy,
  orgId,
  onSubmit,
}: {
  open: boolean;
  onClose: () => void;
  fields: Field[];
  title: string;
  initial: any | null;
  busy: boolean;
  orgId: string | null;
  onSubmit: (values: any) => void;
}) {
  const formFields = useMemo(() => fields.filter((f) => !f.hideInForm), [fields]);
  const [values, setValues] = useState<Record<string, any>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [confirmClose, setConfirmClose] = useState(false);

  const initialRef = useMemo(() => {
    if (!open) return null;
    const v: Record<string, any> = {};
    formFields.forEach((f) => {
      const init = initial?.[f.key];
      if (init != null) {
        v[f.key] = f.type === "date" && typeof init === "string" ? init.slice(0, 10) : init;
      } else if (f.defaultValue != null) {
        v[f.key] = f.defaultValue;
      } else {
        v[f.key] = "";
      }
    });
    return v;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, initial]);

  useEffect(() => {
    if (initialRef) {
      setValues(initialRef);
      setErrors({});
    }
  }, [initialRef]);

  const isDirty = useMemo(() => {
    if (!open || !initialRef) return false;
    return formFields.some((f) => {
      const cur = values[f.key];
      const init = initialRef[f.key];
      return String(cur ?? "") !== String(init ?? "");
    });
  }, [values, initialRef, open, formFields]);

  const handleClose = () => {
    if (isDirty) {
      setConfirmClose(true);
    } else {
      onClose();
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};
    formFields.forEach((f) => {
      if (f.required) {
        const val = values[f.key];
        if (val === "" || val == null || val === undefined) {
          newErrors[f.key] = `${f.label} is required`;
        }
      }
    });
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    const payload: any = {};
    formFields.forEach((f) => {
      let val = values[f.key];
      if (f.type === "number" && val !== "" && val != null) val = Number(val);
      payload[f.key] = val;
    });
    onSubmit(payload);
  };

  const updateValue = (key: string, val: any) => {
    setValues((prev) => ({ ...prev, [key]: val }));
    if (errors[key]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            <DialogDescription>Fill the details below and save.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2">
            {formFields.map((f) => {
              const hasError = !!errors[f.key];
              return (
                <div
                  key={f.key}
                  className={
                    f.type === "textarea" ? "sm:col-span-2 space-y-1.5" : "space-y-1.5"
                  }
                >
                  <Label>
                    {f.label}
                    {f.required && <span className="text-destructive"> *</span>}
                  </Label>
                  {f.type === "textarea" ? (
                    <Textarea
                      value={values[f.key] ?? ""}
                      onChange={(e) => updateValue(f.key, e.target.value)}
                      required={f.required}
                    />
                  ) : f.type === "select" ? (
                    <Select
                      value={String(values[f.key] ?? "")}
                      onValueChange={(val) => updateValue(f.key, val)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select\u2026" />
                      </SelectTrigger>
                      <SelectContent>
                        {(f.options ?? []).map((o) => (
                          <SelectItem key={o} value={o}>
                            {o}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : f.type === "lookup" && f.lookupTable ? (
                    <LookupSelect
                      orgId={orgId}
                      table={f.lookupTable}
                      value={String(values[f.key] ?? "")}
                      onChange={(val) => updateValue(f.key, val)}
                      labelKey={f.lookupLabelKey}
                      valueKey={f.lookupValueKey}
                    />
                  ) : (
                    <Input
                      type={
                        f.type === "number"
                          ? "number"
                          : f.type === "date"
                            ? "date"
                            : f.type === "email"
                              ? "email"
                              : f.type === "tel"
                                ? "tel"
                                : "text"
                      }
                      step={f.type === "number" ? "any" : undefined}
                      value={values[f.key] ?? ""}
                      onChange={(e) => updateValue(f.key, e.target.value)}
                      required={f.required}
                    />
                  )}
                  {hasError && (
                    <p className="text-xs text-destructive">{errors[f.key]}</p>
                  )}
                </div>
              );
            })}
            <DialogFooter className="sm:col-span-2">
              <Button type="button" variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={busy} className="gradient-primary text-white">
                {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {busy ? "Saving\u2026" : "Save"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={confirmClose} onOpenChange={(o) => !o && setConfirmClose(false)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Unsaved changes</AlertDialogTitle>
            <AlertDialogDescription>
              You have unsaved changes. Are you sure you want to close without saving?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Stay editing</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setConfirmClose(false);
                onClose();
              }}
              className="bg-destructive text-destructive-foreground"
            >
              Discard
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

function EmptyState({ onCreate, label }: { onCreate?: () => void; label: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 px-6 py-16 text-center">
      <div className="grid h-12 w-12 place-items-center rounded-xl bg-accent text-accent-foreground">
        <Inbox className="h-6 w-6" />
      </div>
      <div className="text-base font-semibold">No data yet</div>
      <p className="max-w-md text-sm text-muted-foreground">
        {onCreate
          ? `Get started by creating your first ${label.toLowerCase()}.`
          : "No records available."}
      </p>
      {onCreate && (
        <Button size="sm" className="gradient-primary text-white" onClick={onCreate}>
          <Plus className="mr-1.5 h-3.5 w-3.5" /> {label}
        </Button>
      )}
    </div>
  );
}

export const statusBadge: Record<string, string> = {
  ACTIVE: "bg-success/15 text-success",
  active: "bg-success/15 text-success",
  INACTIVE: "bg-muted text-muted-foreground",
  inactive: "bg-muted text-muted-foreground",
  DRAFT: "bg-muted text-muted-foreground",
  draft: "bg-muted text-muted-foreground",
  PENDING: "bg-warning/15 text-warning",
  pending: "bg-warning/15 text-warning",
  PAID: "bg-success/15 text-success",
  paid: "bg-success/15 text-success",
  UNPAID: "bg-warning/15 text-warning",
  unpaid: "bg-warning/15 text-warning",
  OVERDUE: "bg-destructive/15 text-destructive",
  overdue: "bg-destructive/15 text-destructive",
  SENT: "bg-primary/15 text-primary",
  sent: "bg-primary/15 text-primary",
  POSTED: "bg-success/15 text-success",
  posted: "bg-success/15 text-success",
  APPROVED: "bg-success/15 text-success",
  approved: "bg-success/15 text-success",
  REJECTED: "bg-destructive/15 text-destructive",
  rejected: "bg-destructive/15 text-destructive",
  PRESENT: "bg-success/15 text-success",
  present: "bg-success/15 text-success",
  ABSENT: "bg-destructive/15 text-destructive",
  absent: "bg-destructive/15 text-destructive",
  NEW: "bg-primary/15 text-primary",
  QUALIFIED: "bg-primary/15 text-primary",
  PROPOSAL: "bg-warning/15 text-warning",
  WON: "bg-success/15 text-success",
  won: "bg-success/15 text-success",
  LOST: "bg-destructive/15 text-destructive",
  lost: "bg-destructive/15 text-destructive",
  OPEN: "bg-primary/15 text-primary",
  CANCELLED: "bg-destructive/15 text-destructive",
  COMPLETED: "bg-success/15 text-success",
  IN_PROGRESS: "bg-warning/15 text-warning",
  CONFIRMED: "bg-primary/15 text-primary",
  PROCESSING: "bg-warning/15 text-warning",
  PARTIALLY_FULFILLED: "bg-warning/15 text-warning",
  FULFILLED: "bg-success/15 text-success",
  PARTIALLY_RECEIVED: "bg-warning/15 text-warning",
  RECEIVED: "bg-success/15 text-success",
  VIEWED: "bg-primary/15 text-primary",
  PARTIALLY_PAID: "bg-warning/15 text-warning",
  VOID: "bg-destructive/15 text-destructive",
  ACCEPTED: "bg-success/15 text-success",
  EXPIRED: "bg-muted text-muted-foreground",
  AUTHORIZED: "bg-primary/15 text-primary",
  CAPTURED: "bg-success/15 text-success",
  FAILED: "bg-destructive/15 text-destructive",
  REFUNDED: "bg-warning/15 text-warning",
  CONTACTED: "bg-primary/15 text-primary",
  NEGOTIATION: "bg-warning/15 text-warning",
  DISQUALIFIED: "bg-destructive/15 text-destructive",
  HALF_DAY: "bg-warning/15 text-warning",
  LEAVE: "bg-info/15 text-info",
  TERMINATED: "bg-destructive/15 text-destructive",
  REVERSED: "bg-warning/15 text-warning",
  ARCHIVED: "bg-muted text-muted-foreground",
};
