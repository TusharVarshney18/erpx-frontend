import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { LedgerSelect } from "@/components/accounting/LedgerSelect";
import { AlertTriangle, Loader2, Send, Scale } from "lucide-react";
import { toast } from "sonner";

export type TransferMode = "payment" | "receipt" | "contra";

type Party = { id: string; name: string };
type OpenBill = {
  id: string;
  referenceType: string;
  number: string;
  outstanding: number | string;
};
type Credit = {
  creditDays: number | null;
  creditLimit: number | null;
  outstanding: number;
  exceedsLimit: boolean;
};

const ALLOCATION_TYPES = ["AGAINST_REF", "NEW_REF", "ADVANCE", "ON_ACCOUNT"];

export function TransferVoucherForm({
  orgId,
  mode,
  onPosted,
}: {
  orgId: string | null;
  mode: TransferMode;
  onPosted?: () => void;
}) {
  const qc = useQueryClient();
  const [postingDate, setPostingDate] = useState(new Date().toISOString().slice(0, 10));
  const [description, setDescription] = useState("");
  const [accountId, setAccountId] = useState("");
  const [toAccountId, setToAccountId] = useState("");
  const [partyId, setPartyId] = useState("");
  const [amount, setAmount] = useState("");
  const [allocations, setAllocations] = useState<Record<string, { amount: string; type: string }>>(
    {},
  );

  const partyType = mode === "payment" ? "VENDOR" : "CUSTOMER";
  const isContra = mode === "contra";

  const { data: parties = [] } = useQuery({
    queryKey: ["transfer-parties", orgId, partyType],
    queryFn: async () => {
      const table = partyType === "VENDOR" ? "vendors" : "customers";
      const res = await api.get<Record<string, unknown>[]>(
        `/business-data/organizations/${orgId}/${table}`,
        { params: { limit: "300", ascending: "true" } },
      );
      return (Array.isArray(res) ? res : []).map((p) => ({
        id: String(p.id),
        name: String(p.name ?? p.companyName ?? p.fullName ?? p.id),
      })) as Party[];
    },
    enabled: !!orgId && !isContra,
  });

  const { data: openBills = [] } = useQuery({
    queryKey: ["transfer-open-bills", orgId, partyType, partyId],
    queryFn: () =>
      api.get<OpenBill[]>(`/accounting/organizations/${orgId}/vouchers/open-bills`, {
        params: { partyType, partyId },
      }),
    enabled: !!orgId && !!partyId && !isContra,
  });

  const { data: credit } = useQuery({
    queryKey: ["transfer-party-credit", orgId, partyType, partyId],
    queryFn: () =>
      api.get<Credit>(
        `/accounting/organizations/${orgId}/vouchers/parties/${partyType}/${partyId}/credit`,
      ),
    enabled: !!orgId && !!partyId && !isContra,
  });

  const selectedAllocations = useMemo(
    () =>
      Object.entries(allocations)
        .filter(([, v]) => Number(v.amount) > 0)
        .map(([id, v]) => {
          const bill = openBills.find((b) => b.id === id);
          return {
            referenceType: bill?.referenceType ?? "SALES_INVOICE",
            referenceId: id,
            amount: Number(v.amount),
            allocationType: v.type,
          };
        }),
    [allocations, openBills],
  );

  const post = useMutation({
    mutationFn: async () => {
      const payload: Record<string, unknown> = {
        postingDate,
        description: description.trim() || undefined,
        accountId,
        amount: Number(amount) || 0,
      };
      if (isContra) {
        payload.toAccountId = toAccountId;
      } else {
        payload.partyType = partyType;
        payload.partyId = partyId;
        if (selectedAllocations.length > 0) payload.billAllocations = selectedAllocations;
      }
      return api.post<{ journalNumber?: string }>(
        `/accounting/organizations/${orgId}/vouchers/${mode}`,
        payload,
      );
    },
    onSuccess: (data: { journalNumber?: string }) => {
      qc.invalidateQueries({ queryKey: ["voucher-history"] });
      qc.invalidateQueries({ queryKey: ["transfer-open-bills"] });
      toast.success(`Voucher ${data?.journalNumber ?? ""} posted`);
      setAmount("");
      setAllocations({});
      setDescription("");
      onPosted?.();
    },
    onError: (e: unknown) => toast.error((e as Error)?.message ?? "Posting failed"),
  });

  const canPost = isContra
    ? !!accountId && !!toAccountId && Number(amount) > 0
    : !!accountId && !!partyId && Number(amount) > 0;

  const title = mode === "payment" ? "Payment" : mode === "receipt" ? "Receipt" : "Contra";

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Scale className="h-4 w-4 text-primary" /> New {title} Voucher
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="space-y-1.5">
            <Label>Date</Label>
            <Input
              type="date"
              value={postingDate}
              onChange={(e) => setPostingDate(e.target.value)}
            />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label>Narration</Label>
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Narration"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label>{isContra ? "From account (Bank/Cash)" : "Bank / Cash account"}</Label>
            <LedgerSelect
              orgId={orgId}
              value={accountId}
              onChange={(v) => setAccountId(v)}
              placeholder="Select ledger…"
            />
          </div>
          {isContra ? (
            <div className="space-y-1.5">
              <Label>To account (Bank/Cash)</Label>
              <LedgerSelect
                orgId={orgId}
                value={toAccountId}
                onChange={(v) => setToAccountId(v)}
                placeholder="Select ledger…"
              />
            </div>
          ) : (
            <div className="space-y-1.5">
              <Label>{partyType === "VENDOR" ? "Vendor" : "Customer"}</Label>
              <Select value={partyId} onValueChange={setPartyId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select party…" />
                </SelectTrigger>
                <SelectContent className="max-h-80">
                  {parties.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          <div className="space-y-1.5">
            <Label>Amount</Label>
            <Input
              type="number"
              min={0}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>
        </div>

        {!isContra && credit && (
          <div className="space-y-2">
            {credit.exceedsLimit && (
              <div className="flex items-center gap-2 rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
                <AlertTriangle className="h-4 w-4" />
                Credit limit exceeded: outstanding{" "}
                {Number(credit.outstanding).toLocaleString("en-IN")}
                {credit.creditLimit != null
                  ? ` / limit ${Number(credit.creditLimit).toLocaleString("en-IN")}`
                  : ""}
              </div>
            )}
            {credit.creditDays != null && credit.creditDays > 0 && (
              <p className="text-xs text-muted-foreground">
                Credit period: {credit.creditDays} days · Outstanding{" "}
                {Number(credit.outstanding).toLocaleString("en-IN")}
              </p>
            )}
          </div>
        )}

        {!isContra && openBills.length > 0 && (
          <div className="space-y-2 rounded-lg border border-border p-3">
            <p className="text-sm font-medium">Allocate against open bills</p>
            {openBills.map((b) => (
              <div key={b.id} className="grid grid-cols-[1fr_120px_150px] items-center gap-2">
                <div className="text-sm">
                  {b.number}
                  <span className="ml-2 text-xs text-muted-foreground">
                    Outstanding {Number(b.outstanding).toLocaleString("en-IN")}
                  </span>
                </div>
                <Input
                  type="number"
                  min={0}
                  placeholder="0"
                  value={allocations[b.id]?.amount ?? ""}
                  onChange={(e) =>
                    setAllocations((prev) => ({
                      ...prev,
                      [b.id]: {
                        amount: e.target.value,
                        type: prev[b.id]?.type ?? "AGAINST_REF",
                      },
                    }))
                  }
                />
                <Select
                  value={allocations[b.id]?.type ?? "AGAINST_REF"}
                  onValueChange={(v) =>
                    setAllocations((prev) => ({
                      ...prev,
                      [b.id]: { amount: prev[b.id]?.amount ?? "", type: v },
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ALLOCATION_TYPES.map((t) => (
                      <SelectItem key={t} value={t}>
                        {t.replace(/_/g, " ")}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ))}
          </div>
        )}

        <div className="flex justify-end">
          <Button
            className="gradient-primary text-white"
            disabled={!canPost || post.isPending}
            onClick={() => post.mutate()}
          >
            {post.isPending ? (
              <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
            ) : (
              <Send className="mr-1.5 h-4 w-4" />
            )}
            Post {title}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
