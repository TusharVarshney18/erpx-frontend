import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Check, ChevronsUpDown, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { Ledger } from "./ledger-types";
import { LedgerFormModal } from "./LedgerFormModal";

type LedgerSelectProps = {
  orgId: string | null;
  value: string;
  onChange: (id: string, ledger?: Ledger) => void;
  placeholder?: string;
  disabled?: boolean;
  /** Load options only when the surrounding form is open. Defaults to true. */
  active?: boolean;
  className?: string;
  /** Allow creating a ledger inline (default true). */
  allowCreate?: boolean;
};

export function LedgerSelect({
  orgId,
  value,
  onChange,
  placeholder = "Select ledger…",
  disabled,
  active = true,
  className,
  allowCreate = true,
}: LedgerSelectProps) {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [showCreate, setShowCreate] = useState(false);

  const { data: ledgers = [] } = useQuery({
    queryKey: ["ledgers", orgId],
    queryFn: () =>
      api.get<Ledger[]>(`/accounting/organizations/${orgId}/chart-of-accounts`, {
        params: { limit: "500", isActive: "true" },
      }),
    enabled: !!orgId && active,
  });

  const selected = ledgers.find((l) => l.id === value);

  return (
    <>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            role="combobox"
            aria-expanded={open}
            disabled={disabled}
            className={cn("h-9 w-full justify-between font-normal", className)}
          >
            <span className={cn("truncate", !selected && "text-muted-foreground")}>
              {selected ? `${selected.accountCode} · ${selected.accountName}` : placeholder}
            </span>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-[var(--radix-popover-trigger-width)] p-0">
          <Command>
            <CommandInput placeholder="Search ledgers…" />
            <CommandList>
              <CommandEmpty>No ledgers found</CommandEmpty>
              <CommandGroup>
                {ledgers.map((l) => (
                  <CommandItem
                    key={l.id}
                    value={`${l.accountCode} ${l.accountName}`}
                    onSelect={() => {
                      onChange(l.id, l);
                      setOpen(false);
                    }}
                  >
                    <Check
                      className={cn("mr-2 h-4 w-4", value === l.id ? "opacity-100" : "opacity-0")}
                    />
                    <span className="font-mono text-xs text-muted-foreground">{l.accountCode}</span>
                    <span className="ml-2 flex-1 truncate">{l.accountName}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
              {allowCreate && (
                <CommandGroup>
                  <CommandItem
                    value="__create_ledger__"
                    onSelect={() => {
                      setOpen(false);
                      setShowCreate(true);
                    }}
                    className="text-primary"
                  >
                    <Plus className="mr-2 h-4 w-4" /> Create new ledger
                  </CommandItem>
                </CommandGroup>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      <LedgerFormModal
        open={showCreate}
        onOpenChange={setShowCreate}
        orgId={orgId}
        onSaved={(ledger) => {
          qc.invalidateQueries({ queryKey: ["ledgers", orgId] });
          onChange(ledger.id, ledger);
        }}
      />
    </>
  );
}
