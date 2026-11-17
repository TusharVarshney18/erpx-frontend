import { Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { ArrowDownLeft, ArrowUpRight, Landmark, Wallet } from "lucide-react";
import { formatINR, formatINRCompact } from "@/lib/format";

export interface OwnerKpis {
  salesThisMonth: number;
  receivables: number;
  payables: number;
  cashAndBank: number;
  bankAccounts: number;
  asOf: string;
}

/**
 * Flagship "where is my money" card. Net position = cash + receivables − payables,
 * all straight from the owner KPI endpoint.
 */
export function MoneyPosition({ data }: { data: OwnerKpis }) {
  const net = data.cashAndBank + data.receivables - data.payables;
  const flow = data.receivables + data.payables;
  const inShare = flow > 0 ? (data.receivables / flow) * 100 : 50;
  const asOf = new Date(data.asOf).toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <section className="hero-panel flex h-full flex-col rounded-2xl p-6 shadow-lg">
      <div className="bg-grid pointer-events-none absolute inset-0 -z-10 opacity-70" />
      <div className="pointer-events-none absolute -right-20 -top-20 -z-10 h-64 w-64 rounded-full bg-[#3B82F6]/25 blur-3xl" />

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-white/10 ring-1 ring-inset ring-white/15">
            <Wallet className="h-4 w-4 text-white" />
          </span>
          <div>
            <h3 className="font-display text-[15px] font-semibold tracking-tight text-white">
              Money position
            </h3>
            <p className="text-[11px] text-white/55">Live · updated {asOf}</p>
          </div>
        </div>
        <Link
          to="/banking/accounts"
          className="rounded-lg px-2 py-1 text-[11px] font-semibold text-white/70 transition hover:bg-white/10 hover:text-white"
        >
          Banking →
        </Link>
      </div>

      <div className="mt-6">
        <div className="text-xs font-medium text-white/60">Cash &amp; bank balance</div>
        <div
          className="mt-1 font-display text-[34px] font-bold leading-none tracking-tight tabular-nums text-white"
          title={formatINR(data.cashAndBank)}
        >
          {formatINRCompact(data.cashAndBank)}
        </div>
        <div className="mt-1.5 text-[11px] text-white/50">
          Across {data.bankAccounts} active account{data.bankAccounts === 1 ? "" : "s"}
        </div>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3">
        <Flow
          to="/accounting/receivables"
          label="To receive"
          value={data.receivables}
          icon={<ArrowDownLeft className="h-3.5 w-3.5" />}
          tone="text-emerald-300 bg-emerald-400/15"
        />
        <Flow
          to="/purchases/bills"
          label="To pay"
          value={data.payables}
          icon={<ArrowUpRight className="h-3.5 w-3.5" />}
          tone="text-rose-300 bg-rose-400/15"
        />
      </div>

      <div className="mb-6 mt-4">
        <div className="flex h-1.5 overflow-hidden rounded-full bg-white/10">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${inShare}%` }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="bg-gradient-to-r from-emerald-400 to-teal-300"
          />
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${100 - inShare}%` }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="bg-gradient-to-r from-rose-400 to-pink-400"
          />
        </div>
      </div>

      <div className="mt-auto flex items-end justify-between border-t border-white/10 pt-4">
        <div>
          <div className="flex items-center gap-1.5 text-xs font-medium text-white/60">
            <Landmark className="h-3.5 w-3.5" /> Net working position
          </div>
          <div
            className={`mt-1 font-display text-xl font-bold tabular-nums ${net >= 0 ? "text-white" : "text-rose-300"}`}
            title={formatINR(net)}
          >
            {formatINRCompact(net)}
          </div>
        </div>
        <div className="text-right">
          <div className="text-xs font-medium text-white/60">Sales this month</div>
          <div className="mt-1 text-[15px] font-semibold tabular-nums text-white">
            {formatINRCompact(data.salesThisMonth)}
          </div>
        </div>
      </div>
    </section>
  );
}

function Flow({
  to,
  label,
  value,
  icon,
  tone,
}: {
  to: string;
  label: string;
  value: number;
  icon: React.ReactNode;
  tone: string;
}) {
  return (
    <Link
      to={to as never}
      className="group rounded-xl border border-white/10 bg-white/[0.05] p-3 backdrop-blur transition hover:border-white/20 hover:bg-white/[0.09]"
    >
      <div className="flex items-center gap-1.5 text-[11px] font-medium text-white/60">
        <span className={`grid h-5 w-5 place-items-center rounded-md ${tone}`}>{icon}</span>
        {label}
      </div>
      <div
        className="mt-2 text-lg font-bold tabular-nums text-white"
        title={formatINR(value)}
      >
        {formatINRCompact(value)}
      </div>
    </Link>
  );
}
