"use client";

import type { DashboardData } from "@/lib/types";
import type { FunnelStage } from "@/lib/constants";
import { FUNNEL_STAGES, scoreColor } from "@/lib/constants";
import { cn } from "@/lib/utils";

interface Props {
  stats: DashboardData["weekStats"];
  funnelCounts: Record<FunnelStage, number>;
}

function StatCard({
  label,
  value,
  sub,
  tone = "neutral",
}: {
  label: string;
  value: string | number;
  sub?: string;
  tone?: "neutral" | "green" | "amber" | "red";
}) {
  const toneClass = {
    neutral: "text-foreground",
    green: "text-green-600 dark:text-green-400",
    amber: "text-amber-600 dark:text-amber-400",
    red: "text-red-600 dark:text-red-400",
  }[tone];

  return (
    <div className="flex flex-col gap-1 rounded-xl border bg-surface-2/40 px-5 py-4">
      <p className="text-xs font-medium uppercase tracking-wide text-muted">{label}</p>
      <p className={cn("text-2xl font-bold tabular-nums", toneClass)}>{value}</p>
      {sub && <p className="text-xs text-subtle">{sub}</p>}
    </div>
  );
}

function PersonScoreCard({
  name,
  score,
}: {
  name: string;
  score: number | null;
}) {
  const color = scoreColor(score);
  const colorClass = {
    green: "text-green-600 dark:text-green-400",
    amber: "text-amber-500 dark:text-amber-400",
    red: "text-red-600 dark:text-red-400",
    gray: "text-muted",
  }[color];

  return (
    <div className="flex flex-col gap-1 rounded-xl border bg-surface-2/40 px-5 py-4">
      <p className="text-xs font-medium uppercase tracking-wide text-muted">
        {name} · Avg Score
      </p>
      <p className={cn("text-2xl font-bold tabular-nums", colorClass)}>
        {score != null ? score.toFixed(1) : "—"}
      </p>
      <p className="text-xs text-subtle">All-time, analyzed meetings</p>
    </div>
  );
}

// ─── Funnel bar ──

const FUNNEL_COLORS: Record<FunnelStage, string> = {
  Prospect: "bg-gray-400",
  Discovery: "bg-blue-400",
  Proposal: "bg-indigo-500",
  Negotiation: "bg-violet-500",
  "Closed Won": "bg-green-500",
  "Closed Lost": "bg-red-400",
};

function FunnelBar({ counts }: { counts: Record<FunnelStage, number> }) {
  const total = Object.values(counts).reduce((a, b) => a + b, 0);
  const active = FUNNEL_STAGES.filter(
    (s) => s !== "Closed Won" && s !== "Closed Lost"
  );
  const won = counts["Closed Won"] ?? 0;
  const lost = counts["Closed Lost"] ?? 0;

  if (total === 0) {
    return (
      <div className="rounded-xl border bg-surface-2/40 px-5 py-4">
        <p className="text-xs font-medium uppercase tracking-wide text-muted mb-3">
          Pipeline Funnel
        </p>
        <p className="text-xs text-subtle">No funnel data yet. Run analysis on customer calls to populate.</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border bg-surface-2/40 px-5 py-4">
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-medium uppercase tracking-wide text-muted">
          Pipeline Funnel
        </p>
        <span className="text-xs text-muted">
          {won} won · {lost} lost
        </span>
      </div>

      {/* Active stages */}
      <div className="space-y-2">
        {active.map((stage) => {
          const count = counts[stage] ?? 0;
          const pct = total > 0 ? (count / total) * 100 : 0;
          return (
            <div key={stage} className="flex items-center gap-3">
              <span className="w-24 shrink-0 text-xs text-muted text-right">{stage}</span>
              <div className="flex-1 h-2 rounded-full bg-surface-3 overflow-hidden">
                <div
                  className={cn("h-full rounded-full transition-all", FUNNEL_COLORS[stage])}
                  style={{ width: `${pct}%` }}
                />
              </div>
              <span className="w-6 shrink-0 text-xs tabular-nums text-muted">{count}</span>
            </div>
          );
        })}
      </div>

      {/* Won/Lost row */}
      <div className="mt-3 flex gap-4 border-t pt-3">
        <div className="flex items-center gap-1.5 text-xs">
          <span className="h-2 w-2 rounded-full bg-green-500" />
          <span className="text-muted">Won: </span>
          <span className="font-medium text-green-600">{won}</span>
        </div>
        <div className="flex items-center gap-1.5 text-xs">
          <span className="h-2 w-2 rounded-full bg-red-400" />
          <span className="text-muted">Lost: </span>
          <span className="font-medium text-red-600">{lost}</span>
        </div>
        {won + lost > 0 && (
          <div className="ml-auto text-xs text-muted">
            Win rate:{" "}
            <span className="font-medium text-foreground">
              {Math.round((won / (won + lost)) * 100)}%
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

export function BusinessHealthPanel({ stats, funnelCounts }: Props) {
  const pendingTone = stats.pending > 0 ? "amber" : "neutral";

  return (
    <div className="space-y-4">
      {/* Top row: key numbers */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard
          label="Meetings This Week"
          value={stats.meetingsThisWeek}
          sub={`${stats.customerCallsThisWeek} customer calls`}
        />
        <StatCard
          label="Pending Analysis"
          value={stats.pending}
          sub="Transcripts waiting"
          tone={pendingTone}
        />
        <StatCard
          label="Active Offers"
          value={stats.activeOffers}
          sub="Presented or accepted"
          tone={stats.activeOffers > 0 ? "green" : "neutral"}
        />
        <StatCard
          label="Won This Month"
          value={stats.wonOffersThisMonth}
          sub="Closed Won offers"
          tone={stats.wonOffersThisMonth > 0 ? "green" : "neutral"}
        />
      </div>

      {/* Second row: per-person scores + funnel */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <PersonScoreCard name="Gabriel" score={stats.gabrielAvgScore} />
        <PersonScoreCard name="Miguel" score={stats.miguelAvgScore} />
        <FunnelBar counts={funnelCounts} />
      </div>
    </div>
  );
}
