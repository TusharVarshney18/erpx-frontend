import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
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
  CommandGroup as CommandGroupList,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Check, ChevronsUpDown, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { GSTIN_REGEX, IFSC_REGEX, Ledger, LedgerGroup, PAN_REGEX, groupKind } from "./ledger-types";

type LedgerFormModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orgId: string | null;
  initial?: Ledger | null;
  /** Preselect a group (used when creating from a specific group context). */
  defaultGroupId?: string | null;
  onSaved: (ledger: Ledger) => void;
};

type FormValues = {
  accountName: string;
  accountCode: string;
  accountGroupId: string;
  openingBalance: string;
  openingBalanceType: string;
  gstin: string;
  pan: string;
  state: string;
  address: string;
  creditDays: string;
  bankAccountNo: string;
  bankIfsc: string;
  isActive: boolean;
};

const EMPTY: FormValues = {
  accountName: "",
  accountCode: "",
  accountGroupId: "",
  openingBalance: "",
  openingBalanceType: "DEBIT",
  gstin: "",
  pan: "",
  state: "",
  address: "",
  creditDays: "",
  bankAccountNo: "",
  bankIfsc: "",
  isActive: true,
};

export function LedgerFormModal({
  open,
  onOpenChange,
  orgId,
  initial,
  defaultGroupId,
  onSaved,
}: LedgerFormModalProps) {
  const qc = useQueryClient();
  const [values, setValues] = useState<FormValues>(EMPTY);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const { data: groups = [] } = useQuery({
    queryKey: ["ledger-groups", orgId],
    queryFn: () => api.get<LedgerGroup[]>(`/accounting/organizations/${orgId}/account-groups`),
    enabled: !!orgId && open,
  });

  useEffect(() => {
    if (!open) return;
    setErrors({});
    if (initial) {
      setValues({
        accountName: initial.accountName ?? "",
        accountCode: initial.accountCode ?? "",
        accountGroupId: initial.accountGroupId ?? "",
        openingBalance:
          initial.openingBalance === null || initial.openingBalance === undefined
            ? ""
            : String(initial.openingBalance),
        openingBalanceType: initial.openingBalanceType ?? "DEBIT",
        gstin: initial.gstin ?? "",
        pan: initial.pan ?? "",
        state: initial.state ?? "",
        address: initial.address ?? "",
        creditDays:
          initial.creditDays === null || initial.creditDays === undefined
            ? ""
            : String(initial.creditDays),
        bankAccountNo: initial.bankAccountNo ?? "",
        bankIfsc: initial.bankIfsc ?? "",
        isActive: initial.isActive ?? true,
      });
    } else {
      setValues({ ...EMPTY, accountGroupId: defaultGroupId ?? "" });
    }
  }, [open, initial, defaultGroupId]);

  const selectedGroup = useMemo(
    () => groups.find((g) => g.id === values.accountGroupId) ?? null,
    [groups, values.accountGroupId],
  );
  const kind = groupKind(selectedGroup);

  const update = <K extends keyof FormValues>(key: K, value: FormValues[K]) => {
    setValues((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    }
  };

  const save = useMutation({
    mutationFn: async () => {
      const payload: Record<string, unknown> = {
        accountName: values.accountName.trim(),
        accountCode: values.accountCode.trim(),
        accountGroupId: values.accountGroupId,
        accountType: selectedGroup?.groupNature ?? "ASSET",
        openingBalance: values.openingBalance === "" ? 0 : Number(values.openingBalance),
        openingBalanceType: values.openingBalanceType,
        isActive: values.isActive,
      };
      if (kind === "PARTY") {
        payload.gstin = values.gstin.trim().toUpperCase();
        payload.pan = values.pan.trim().toUpperCase();
        payload.state = values.state.trim();
        payload.address = values.address.trim();
        payload.creditDays = values.creditDays === "" ? null : Number(values.creditDays);
      }
      if (kind === "BANK") {
        payload.bankAccountNo = values.bankAccountNo.trim();
        payload.bankIfsc = values.bankIfsc.trim().toUpperCase();
      }
      return initial
        ? api.patch<Ledger>(
            `/accounting/organizations/${orgId}/chart-of-accounts/${initial.id}`,
            payload,
          )
        : api.post<Ledger>(`/accounting/organizations/${orgId}/chart-of-accounts`, payload);
    },
    onSuccess: (ledger) => {
      qc.invalidateQueries({ queryKey: ["ledgers", orgId] });
      qc.invalidateQueries({ queryKey: ["ledger-groups", orgId] });
      toast.success(initial ? "Ledger updated" : "Ledger created");
      onSaved(ledger);
      onOpenChange(false);
    },
    onError: (e: unknown) => toast.error((e as Error)?.message ?? "Save failed"),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (!values.accountName.trim()) errs.accountName = "Name is required";
    if (!values.accountCode.trim()) errs.accountCode = "Code is required";
    if (!values.accountGroupId) errs.accountGroupId = "Group is required";
    if (kind === "PARTY") {
      if (values.gstin && !GSTIN_REGEX.test(values.gstin.trim().toUpperCase())) {
        errs.gstin = "GSTIN is not valid";
      }
      if (values.pan && !PAN_REGEX.test(values.pan.trim().toUpperCase())) {
        errs.pan = "PAN is not valid";
      }
    }
    if (
      kind === "BANK" &&
      values.bankIfsc &&
      !IFSC_REGEX.test(values.bankIfsc.trim().toUpperCase())
    ) {
      errs.bankIfsc = "IFSC is not valid";
    }
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;
    save.mutate();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{initial ? "Edit Ledger" : "New Ledger"}</DialogTitle>
          <DialogDescription>
            Ledgers belong to a group; party and bank fields appear based on the group.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Ledger Name" required error={errors.accountName}>
              <Input
                value={values.accountName}
                onChange={(e) => update("accountName", e.target.value)}
              />
            </Field>
            <Field label="Code" required error={errors.accountCode}>
              <Input
                value={values.accountCode}
                onChange={(e) => update("accountCode", e.target.value)}
                placeholder="e.g. 1200"
              />
            </Field>
            <div className="sm:col-span-2">
              <Field label="Group" required error={errors.accountGroupId}>
                <GroupCombobox
                  groups={groups}
                  value={values.accountGroupId}
                  onChange={(id) => update("accountGroupId", id)}
                />
              </Field>
            </div>
            <Field label="Opening Balance">
              <Input
                type="number"
                step="any"
                value={values.openingBalance}
                onChange={(e) => update("openingBalance", e.target.value)}
              />
            </Field>
            <Field label="Opening Dr/Cr">
              <Select
                value={values.openingBalanceType}
                onValueChange={(v) => update("openingBalanceType", v)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="DEBIT">Debit (Dr)</SelectItem>
                  <SelectItem value="CREDIT">Credit (Cr)</SelectItem>
                </SelectContent>
              </Select>
            </Field>
          </div>

          {kind === "PARTY" && (
            <div className="space-y-3 rounded-lg border border-border p-4">
              <p className="text-sm font-medium">Party Details</p>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="GSTIN" error={errors.gstin}>
                  <Input
                    value={values.gstin}
                    onChange={(e) => update("gstin", e.target.value.toUpperCase())}
                    placeholder="27ABCDE1234F1Z5"
                  />
                </Field>
                <Field label="PAN" error={errors.pan}>
                  <Input
                    value={values.pan}
                    onChange={(e) => update("pan", e.target.value.toUpperCase())}
                    placeholder="ABCDE1234F"
                  />
                </Field>
                <Field label="State">
                  <Input value={values.state} onChange={(e) => update("state", e.target.value)} />
                </Field>
                <Field label="Credit Days">
                  <Input
                    type="number"
                    min={0}
                    value={values.creditDays}
                    onChange={(e) => update("creditDays", e.target.value)}
                  />
                </Field>
                <div className="sm:col-span-2">
                  <Field label="Address">
                    <Textarea
                      value={values.address}
                      onChange={(e) => update("address", e.target.value)}
                    />
                  </Field>
                </div>
              </div>
            </div>
          )}

          {kind === "BANK" && (
            <div className="space-y-3 rounded-lg border border-border p-4">
              <p className="text-sm font-medium">Bank Details</p>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Account Number">
                  <Input
                    value={values.bankAccountNo}
                    onChange={(e) => update("bankAccountNo", e.target.value)}
                  />
                </Field>
                <Field label="IFSC" error={errors.bankIfsc}>
                  <Input
                    value={values.bankIfsc}
                    onChange={(e) => update("bankIfsc", e.target.value.toUpperCase())}
                    placeholder="HDFC0001234"
                  />
                </Field>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between rounded-lg border border-border p-3">
            <div>
              <p className="text-sm font-medium">Active</p>
              <p className="text-xs text-muted-foreground">
                Inactive ledgers are hidden from posting.
              </p>
            </div>
            <Switch checked={values.isActive} onCheckedChange={(v) => update("isActive", v)} />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={save.isPending} className="gradient-primary text-white">
              {save.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {save.isPending ? "Saving…" : "Save"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
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

function GroupCombobox({
  groups,
  value,
  onChange,
}: {
  groups: LedgerGroup[];
  value: string;
  onChange: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const selected = groups.find((g) => g.id === value);

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
          <span className={cn("truncate", !selected && "text-muted-foreground")}>
            {selected ? `${selected.name} · ${selected.groupNature}` : "Search groups…"}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-[var(--radix-popover-trigger-width)] p-0">
        <Command>
          <CommandInput placeholder="Search groups…" />
          <CommandList>
            <CommandEmpty>No groups found</CommandEmpty>
            <CommandGroupList>
              {groups.map((g) => (
                <CommandItem
                  key={g.id}
                  value={`${g.name} ${g.groupNature}`}
                  onSelect={() => {
                    onChange(g.id);
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn("mr-2 h-4 w-4", value === g.id ? "opacity-100" : "opacity-0")}
                  />
                  <span className="flex-1">{g.name}</span>
                  <span className="text-xs text-muted-foreground">{g.groupNature}</span>
                </CommandItem>
              ))}
            </CommandGroupList>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
