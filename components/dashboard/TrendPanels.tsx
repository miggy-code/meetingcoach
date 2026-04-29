import type { DashboardData } from "@/lib/types";
import {
  OBJECTION_TYPES,
  BUYING_SIGNAL_TYPES,
  type ObjectionType,
  type BuyingSignalType,
} from "@/lib/constants";

export function TrendPanels({
  trends,
}: {
  trends: DashboardData["monthlyTrends"];
}) {
  const objTotal = Object.values(trends.objections).reduce((a, b) => a + b, 0);
  const sigTotal = Object.values(trends.buyingSignals).reduce(
    (a, b) => a + b,
    0,
  );
  if (objTotal === 0 && sigTotal === 0) {
    return (
      <div className="rounded-lg border bg-surface p-6 text-center text-sm text-muted">
        No analyzed meetings this month yet. Trends appear once a few meetings
        are scored.
      </div>
    );
  }
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {objTotal > 0 && (
        <Panel
          title="Top objections"
          subtitle="this month"
          variant="objection"
          rows={OBJECTION_TYPES.map((o) => ({
            label: o,
            count: trends.objections[o] ?? 0,
          })).filter((r) => r.count > 0)}
        />
      )}
      {sigTotal > 0 && (
        <Panel
          title="Buying signal momentum"
          subtitle="this month"
          variant="signal"
          rows={BUYING_SIGNAL_TYPES.map((s) => ({
            label: s,
            count: trends.buyingSignals[s] ?? 0,
          })).filter((r) => r.count > 0)}
        />
      )}
    </div>
  );
}

function Panel({
  title,
  subtitle,
  rows,
  variant,
}: {
  title: string;
  subtitle: string;
  rows: { label: ObjectionType | BuyingSignalType; count: number }[];
  variant: "objection" | "signal";
}) {
  const max = Math.max(...rows.map((r) => r.count), 1);
  const sorted = [...rows].sort((a, b) => b.count - a.count);
  const barClass =
    variant === "objection"
      ? "bg-rose-400/80 dark:bg-rose-500/70"
      : "bg-emerald-400/80 dark:bg-emerald-500/70";
  return (
    <div className="rounded-xl border bg-surface p-5">
      <div className="mb-4 flex items-baseline justify-between">
        <h3 className="text-sm font-medium tracking-tight">{title}</h3>
        <span className="text-xs text-subtle">{subtitle}</span>
      </div>
      <ul className="space-y-2.5">
        {sorted.map((r) => (
          <li key={r.label} className="grid grid-cols-[140px_1fr_24px] items-center gap-3 text-xs">
            <span className="truncate text-muted">{r.label}</span>
            <div className="h-2 overflow-hidden rounded-full bg-surface-2">
              <div
                className={`h-full ${barClass}`}
                style={{ width: `${(r.count / max) * 100}%` }}
              />
            </div>
            <span className="tabular text-right font-medium text-text">
              {r.count}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
