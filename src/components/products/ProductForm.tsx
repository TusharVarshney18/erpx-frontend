import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import type { FormRendererProps } from "@/lib/crud/DataModule";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Check, ChevronsUpDown, Loader2, Plus, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const GST_SLABS = [0, 5, 12, 18, 28];
const TAX_CATEGORIES = [
  { value: "TAXABLE", label: "Taxable" },
  { value: "NIL_RATED", label: "Nil Rated" },
  { value: "EXEMPT", label: "Exempt" },
  { value: "NON_GST", label: "Non-GST" },
];

type ItemType = "GOODS" | "SERVICE";

type LookupRecord = Record<string, unknown>;

type HsnRecord = {
  id: string;
  code: string;
  description: string;
  type: string;
  defaultGstRate: number | string;
};

interface ProductValues {
  sku: string;
  name: string;
  barcode: string;
  description: string;
  categoryId: string;
  unitId: string;
  itemType: ItemType;
  hsnSacCode: string;
  hsnSacId: string;
  gstRate: number;
  taxCategory: string;
  priceIncludesTax: boolean;
  purchasePrice: string;
  sellingPrice: string;
  cessRate: string;
  mrp: string;
  trackInventory: boolean;
  status: string;
}

const EMPTY: ProductValues = {
  sku: "",
  name: "",
  barcode: "",
  description: "",
  categoryId: "",
  unitId: "",
  itemType: "GOODS",
  hsnSacCode: "",
  hsnSacId: "",
  gstRate: 0,
  taxCategory: "TAXABLE",
  priceIncludesTax: false,
  purchasePrice: "",
  sellingPrice: "",
  cessRate: "",
  mrp: "",
  trackInventory: true,
  status: "ACTIVE",
};

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

type ProductInitial = {
  sku?: string | null;
  name?: string | null;
  barcode?: string | null;
  description?: string | null;
  categoryId?: string | null;
  unitId?: string | null;
  itemType?: string | null;
  isService?: boolean | null;
  hsnSacCode?: string | null;
  hsnSac?: string | null;
  hsnSacId?: string | null;
  gstRate?: number | string | null;
  taxRate?: number | string | null;
  taxCategory?: string | null;
  priceIncludesTax?: boolean | null;
  purchasePrice?: number | string | null;
  sellingPrice?: number | string | null;
  cessRate?: number | string | null;
  mrp?: number | string | null;
  trackInventory?: boolean | null;
  status?: string | null;
};

function toFormValues(initial: ProductInitial | null): ProductValues {
  if (!initial) return { ...EMPTY };
  const itemType: ItemType =
    initial.itemType === "SERVICE" || initial.isService ? "SERVICE" : "GOODS";
  const num = (v: unknown) => (v === null || v === undefined || v === "" ? "" : String(v));
  return {
    sku: initial.sku ?? "",
    name: initial.name ?? "",
    barcode: initial.barcode ?? "",
    description: initial.description ?? "",
    categoryId: initial.categoryId ?? "",
    unitId: initial.unitId ?? "",
    itemType,
    hsnSacCode: initial.hsnSacCode ?? initial.hsnSac ?? "",
    hsnSacId: initial.hsnSacId ?? "",
    gstRate: Number(initial.gstRate ?? initial.taxRate ?? 0),
    taxCategory: initial.taxCategory ?? "TAXABLE",
    priceIncludesTax: Boolean(initial.priceIncludesTax),
    purchasePrice: num(initial.purchasePrice),
    sellingPrice: num(initial.sellingPrice),
    cessRate: num(initial.cessRate),
    mrp: num(initial.mrp),
    trackInventory: itemType === "SERVICE" ? false : Boolean(initial.trackInventory ?? true),
    status: initial.status ?? "ACTIVE",
  };
}

export function ProductForm({ open, onClose, initial, busy, orgId, onSubmit }: FormRendererProps) {
  const [values, setValues] = useState<ProductValues>(EMPTY);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showCustomGst, setShowCustomGst] = useState(false);
  const [confirmClose, setConfirmClose] = useState(false);

  const { data: settings } = useQuery({
    queryKey: ["org-settings", orgId],
    queryFn: () => api.get<{ hsnMinDigits?: number }>(`/organizations/${orgId}/settings`),
    enabled: !!orgId && open,
  });
  const hsnMinDigits = settings?.hsnMinDigits === 6 ? 6 : 4;

  useEffect(() => {
    if (!open) return;
    const next = toFormValues(initial);
    setValues(next);
    setErrors({});
    setShowCustomGst(!GST_SLABS.includes(next.gstRate));
  }, [open, initial]);

  const isDirty = useMemo(
    () => JSON.stringify(values) !== JSON.stringify(toFormValues(initial)),
    [values, initial],
  );

  const update = <K extends keyof ProductValues>(key: K, value: ProductValues[K]) => {
    setValues((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    }
  };

  const setItemType = (itemType: ItemType) => {
    setValues((prev) => ({
      ...prev,
      itemType,
      // Switching type invalidates the previously selected code.
      hsnSacCode: "",
      hsnSacId: "",
      trackInventory: itemType === "SERVICE" ? false : true,
    }));
    setErrors((prev) => {
      const next = { ...prev };
      delete next.hsnSacCode;
      return next;
    });
  };

  const validate = (v: ProductValues): Record<string, string> => {
    const errs: Record<string, string> = {};
    if (!v.sku.trim()) errs.sku = "SKU is required";
    if (!v.name.trim()) errs.name = "Name is required";

    const code = v.hsnSacCode.trim();
    if (!code) {
      errs.hsnSacCode = v.itemType === "SERVICE" ? "SAC code is required" : "HSN code is required";
    } else if (!/^\d+$/.test(code)) {
      errs.hsnSacCode = "HSN/SAC code must contain digits only";
    } else if (v.itemType === "SERVICE") {
      if (code.length !== 6) errs.hsnSacCode = "SAC code must be exactly 6 digits";
      else if (!code.startsWith("99")) errs.hsnSacCode = "SAC code must start with 99";
    } else {
      if (![4, 6, 8].includes(code.length)) errs.hsnSacCode = "HSN code must be 4, 6 or 8 digits";
      else if (code.length < hsnMinDigits)
        errs.hsnSacCode = `HSN code must be at least ${hsnMinDigits} digits`;
    }
    return errs;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate(values);
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    onSubmit({
      sku: values.sku.trim(),
      name: values.name.trim(),
      barcode: values.barcode.trim() || null,
      description: values.description.trim() || null,
      categoryId: values.categoryId || null,
      unitId: values.unitId || null,
      itemType: values.itemType,
      hsnSacCode: values.hsnSacCode.trim(),
      hsnSacId: values.hsnSacId || null,
      gstRate: Number(values.gstRate) || 0,
      taxCategory: values.taxCategory,
      priceIncludesTax: values.priceIncludesTax,
      purchasePrice: values.purchasePrice === "" ? 0 : Number(values.purchasePrice),
      sellingPrice: values.sellingPrice === "" ? 0 : Number(values.sellingPrice),
      cessRate: values.cessRate === "" ? 0 : Number(values.cessRate),
      mrp: values.mrp === "" ? null : Number(values.mrp),
      trackInventory: values.itemType === "SERVICE" ? false : values.trackInventory,
      status: values.status,
    });
  };

  const handleClose = () => (isDirty ? setConfirmClose(true) : onClose());

  return (
    <>
      <Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
        <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{initial ? "Edit Product" : "New Product"}</DialogTitle>
            <DialogDescription>
              Goods use HSN codes; services use SAC codes. Fields marked * are required.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-6">
            <Section title="Basic">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="SKU" required error={errors.sku}>
                  <Input value={values.sku} onChange={(e) => update("sku", e.target.value)} />
                </Field>
                <Field label="Name" required error={errors.name}>
                  <Input value={values.name} onChange={(e) => update("name", e.target.value)} />
                </Field>
                <Field label="Barcode">
                  <Input
                    value={values.barcode}
                    onChange={(e) => update("barcode", e.target.value)}
                  />
                </Field>
                <Field label="Item Type" required>
                  <Select value={values.itemType} onValueChange={(v) => setItemType(v as ItemType)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="GOODS">Goods (HSN)</SelectItem>
                      <SelectItem value="SERVICE">Service (SAC)</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="Category">
                  <SearchableSelect
                    active={open}
                    orgId={orgId}
                    table="categories"
                    value={values.categoryId}
                    onChange={(v) => update("categoryId", v)}
                    allowCreate
                    createFields={[{ key: "name", label: "Name", required: true }]}
                  />
                </Field>
                <Field label="Unit">
                  <SearchableSelect
                    active={open}
                    orgId={orgId}
                    table="units"
                    value={values.unitId}
                    onChange={(v) => update("unitId", v)}
                    labelKey="name"
                    allowCreate
                    createFields={[
                      { key: "name", label: "Name", required: true },
                      { key: "shortName", label: "Short name", required: true },
                    ]}
                  />
                </Field>
                <div className="sm:col-span-2">
                  <Field
                    label={values.itemType === "SERVICE" ? "SAC Code" : "HSN Code"}
                    required
                    error={errors.hsnSacCode}
                  >
                    <HsnSacPicker
                      active={open}
                      itemType={values.itemType}
                      value={values.hsnSacCode}
                      onChange={(code, record) => {
                        setValues((prev) => ({
                          ...prev,
                          hsnSacCode: code,
                          hsnSacId: record?.id ?? "",
                          gstRate:
                            record?.defaultGstRate !== undefined
                              ? Number(record.defaultGstRate)
                              : prev.gstRate,
                        }));
                        setShowCustomGst(
                          record?.defaultGstRate !== undefined &&
                            !GST_SLABS.includes(Number(record.defaultGstRate)),
                        );
                      }}
                    />
                  </Field>
                </div>
                <div className="sm:col-span-2">
                  <Field label="Description">
                    <Textarea
                      value={values.description}
                      onChange={(e) => update("description", e.target.value)}
                    />
                  </Field>
                </div>
              </div>
            </Section>

            <Section title="Pricing & Tax">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Purchase Price">
                  <Input
                    type="number"
                    step="any"
                    value={values.purchasePrice}
                    onChange={(e) => update("purchasePrice", e.target.value)}
                  />
                </Field>
                <Field label="Selling Price">
                  <Input
                    type="number"
                    step="any"
                    value={values.sellingPrice}
                    onChange={(e) => update("sellingPrice", e.target.value)}
                  />
                </Field>
                <Field label="GST Rate %">
                  <div className="space-y-2">
                    <Select
                      value={showCustomGst ? "custom" : String(values.gstRate)}
                      onValueChange={(v) => {
                        if (v === "custom") {
                          setShowCustomGst(true);
                        } else {
                          setShowCustomGst(false);
                          update("gstRate", Number(v));
                        }
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {GST_SLABS.map((slab) => (
                          <SelectItem key={slab} value={String(slab)}>
                            {slab}%
                          </SelectItem>
                        ))}
                        <SelectItem value="custom">Custom…</SelectItem>
                      </SelectContent>
                    </Select>
                    {showCustomGst && (
                      <Input
                        type="number"
                        step="any"
                        placeholder="Custom GST rate %"
                        value={values.gstRate}
                        onChange={(e) => update("gstRate", Number(e.target.value))}
                      />
                    )}
                  </div>
                </Field>
                <Field label="Tax Category">
                  <Select
                    value={values.taxCategory}
                    onValueChange={(v) => update("taxCategory", v)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TAX_CATEGORIES.map((t) => (
                        <SelectItem key={t.value} value={t.value}>
                          {t.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="Cess Rate %">
                  <Input
                    type="number"
                    step="any"
                    value={values.cessRate}
                    onChange={(e) => update("cessRate", e.target.value)}
                  />
                </Field>
                <Field label="MRP">
                  <Input
                    type="number"
                    step="any"
                    value={values.mrp}
                    onChange={(e) => update("mrp", e.target.value)}
                  />
                </Field>
                <div className="sm:col-span-2 flex items-center justify-between rounded-lg border border-border p-3">
                  <div>
                    <p className="text-sm font-medium">Price includes tax</p>
                    <p className="text-xs text-muted-foreground">
                      Selling price already contains GST.
                    </p>
                  </div>
                  <Switch
                    checked={values.priceIncludesTax}
                    onCheckedChange={(v) => update("priceIncludesTax", v)}
                  />
                </div>
              </div>
            </Section>

            <Section title="Inventory">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2 flex items-center justify-between rounded-lg border border-border p-3">
                  <div>
                    <p className="text-sm font-medium">Track inventory</p>
                    <p className="text-xs text-muted-foreground">
                      {values.itemType === "SERVICE"
                        ? "Services never track inventory."
                        : "Keep stock levels for this product."}
                    </p>
                  </div>
                  <Switch
                    checked={values.trackInventory}
                    disabled={values.itemType === "SERVICE"}
                    onCheckedChange={(v) => update("trackInventory", v)}
                  />
                </div>
                <Field label="Status">
                  <Select value={values.status} onValueChange={(v) => update("status", v)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ACTIVE">ACTIVE</SelectItem>
                      <SelectItem value="INACTIVE">INACTIVE</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
              </div>
            </Section>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={busy} className="gradient-primary text-white">
                {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {busy ? "Saving…" : "Save"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={confirmClose} onOpenChange={(o) => !o && setConfirmClose(false)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Unsaved changes</DialogTitle>
            <DialogDescription>
              You have unsaved changes. Are you sure you want to close without saving?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmClose(false)}>
              Stay editing
            </Button>
            <Button
              className="bg-destructive text-destructive-foreground"
              onClick={() => {
                setConfirmClose(false);
                onClose();
              }}
            >
              Discard
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <h3 className="text-sm font-semibold">{title}</h3>
        <div className="h-px flex-1 bg-border" />
      </div>
      {children}
    </div>
  );
}

function Field({
  label,
  required,
  error,
  children,
}: {
  label: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label>
        {label}
        {required && <span className="text-destructive"> *</span>}
      </Label>
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

type CreateField = { key: string; label: string; required?: boolean };

function SearchableSelect({
  active,
  orgId,
  table,
  value,
  onChange,
  labelKey = "name",
  valueKey = "id",
  placeholder = "Search…",
  allowCreate = false,
  createFields = [],
}: {
  active: boolean;
  orgId: string | null;
  table: string;
  value: string;
  onChange: (value: string) => void;
  labelKey?: string;
  valueKey?: string;
  placeholder?: string;
  allowCreate?: boolean;
  createFields?: CreateField[];
}) {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [newVals, setNewVals] = useState<Record<string, string>>({});

  const basePath = `/business-data/organizations/${orgId}/${table}`;

  const { data: options = [] } = useQuery({
    queryKey: ["product-lookup", orgId, table],
    queryFn: async () => {
      const res = await api.get<LookupRecord[]>(basePath, {
        params: { limit: "200", ascending: "true" },
      });
      return Array.isArray(res) ? res : [];
    },
    enabled: !!orgId && active,
  });

  const createMutation = useMutation({
    mutationFn: async () => api.post<LookupRecord>(basePath, newVals),
    onSuccess: (created: LookupRecord) => {
      qc.invalidateQueries({ queryKey: ["product-lookup", orgId, table] });
      const id = created?.[valueKey] ?? created?.id;
      if (id) onChange(String(id));
      toast.success("Created");
      setShowCreate(false);
      setNewVals({});
      setOpen(false);
    },
    onError: (e: unknown) => toast.error((e as Error)?.message ?? "Create failed"),
  });

  const selected = options.find((o) => String(o[valueKey]) === String(value));
  const label = selected ? String(selected[labelKey] ?? selected.name ?? value) : value;

  const canCreate = createFields.every(
    (f) => !f.required || (newVals[f.key] ?? "").trim().length > 0,
  );

  return (
    <Popover
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (!o) setShowCreate(false);
      }}
    >
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="h-9 w-full justify-between font-normal"
        >
          <span className="truncate">{value ? label : placeholder}</span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-[var(--radix-popover-trigger-width)] p-0">
        <Command>
          <CommandInput placeholder={`Search ${table.replace(/_/g, " ")}…`} />
          <CommandList>
            <CommandEmpty>No matches found</CommandEmpty>
            <CommandGroup>
              {options.map((o) => {
                const v = String(o[valueKey]);
                const lbl = String(o[labelKey] ?? o.name ?? v);
                return (
                  <CommandItem
                    key={v}
                    value={lbl}
                    onSelect={() => {
                      onChange(v);
                      setOpen(false);
                    }}
                  >
                    <Check
                      className={cn("mr-2 h-4 w-4", value === v ? "opacity-100" : "opacity-0")}
                    />
                    {lbl}
                  </CommandItem>
                );
              })}
            </CommandGroup>
            {allowCreate && (
              <CommandGroup>
                {!showCreate ? (
                  <CommandItem
                    value="__create_new__"
                    onSelect={() => setShowCreate(true)}
                    className="text-primary"
                  >
                    <Plus className="mr-2 h-4 w-4" /> Create new
                  </CommandItem>
                ) : (
                  <div className="space-y-2 p-2" onClick={(e) => e.stopPropagation()}>
                    {createFields.map((f) => (
                      <Input
                        key={f.key}
                        placeholder={f.label}
                        value={newVals[f.key] ?? ""}
                        onChange={(e) => setNewVals((p) => ({ ...p, [f.key]: e.target.value }))}
                      />
                    ))}
                    <div className="flex justify-end gap-2">
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() => setShowCreate(false)}
                      >
                        <X className="mr-1 h-3.5 w-3.5" /> Cancel
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        disabled={!canCreate || createMutation.isPending}
                        onClick={() => createMutation.mutate()}
                      >
                        {createMutation.isPending && (
                          <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />
                        )}
                        Create
                      </Button>
                    </div>
                  </div>
                )}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

function HsnSacPicker({
  active,
  itemType,
  value,
  onChange,
}: {
  active: boolean;
  itemType: ItemType;
  value: string;
  onChange: (code: string, record?: HsnRecord) => void;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const debounced = useDebounce(search, 300);
  const type = itemType === "SERVICE" ? "SAC" : "HSN";

  const { data: options = [], isFetching } = useQuery({
    queryKey: ["hsn-sac-search", debounced, type],
    queryFn: async () => {
      const params: Record<string, string> = { type, limit: "20" };
      if (debounced.trim()) params.q = debounced.trim();
      const res = await api.get<HsnRecord[]>("/hsn-sac/search", { params });
      return Array.isArray(res) ? res : [];
    },
    enabled: !!active && open,
  });

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
          <span className={cn("truncate", !value && "text-muted-foreground")}>
            {value || (type === "SAC" ? "Search SAC (e.g. 998314)…" : "Search HSN (e.g. 8471)…")}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-[var(--radix-popover-trigger-width)] p-0">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder={
              type === "SAC" ? "Type a SAC code or service…" : "Type an HSN code or item…"
            }
            value={search}
            onValueChange={setSearch}
          />
          <CommandList>
            <CommandEmpty>{isFetching ? "Searching…" : "No matches found"}</CommandEmpty>
            <CommandGroup>
              {options.map((o) => (
                <CommandItem
                  key={o.id}
                  value={o.id}
                  onSelect={() => {
                    onChange(String(o.code), o);
                    setSearch("");
                    setOpen(false);
                  }}
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{o.code}</span>
                      <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] uppercase text-muted-foreground">
                        {o.type}
                      </span>
                      <span className="text-xs text-muted-foreground">{o.defaultGstRate}% GST</span>
                    </div>
                    <p className="truncate text-xs text-muted-foreground">{o.description}</p>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
