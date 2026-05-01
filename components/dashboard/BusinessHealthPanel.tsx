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
  color: colorName,
}: {
  name: string;
  score: number | null;
  color: "blue" | "violet";
}) {
  const scoreColorKey = scoreColor(score);
  const scoreColorClass = {
    green: "text-green-600 dark:text-green-400",
    amber: "text-amber-500 dark:text-amber-400",
    red: "text-red-600 dark:text-red-400",
    gray: "text-muted",
  }[scoreColorKey];

  const headerClass =
    colorName === "blue"
      ? "text-blue-600 dark:text-blue-400"
      : "text-violet-600 dark:text-violet-400";

  return (
    <div className="flex flex-col gap-1 rounded-xl border bg-surface-2/40 px-5 py-4">
      <p className={cn("text-xs font-semibold uppercase tracking-wide", headerClass)}>
        {name}
      </p>
      <p className={cn("text-2xl font-bold tabular-nums", scoreColorClass)}>
        {score != null ? score.toFixed(1) : "—"}
      </p>
      <p className="text-xs text-subtle">Avg score · all-time</p>
    </div>
  );
}

// ─── Conversion rate card ──

function ConversionCard({ counts }: { counts: Record<FunnelStage, number> }) {
  const won = counts["Closed Won"] ?? 0;
  const lost = counts["Closed Lost"] ?? 0;
  const total = won + lost;
  const rate = total > 0 ? Math.round((won / total) * 100) : null;

  const tone =
    rate == null
      ? "text-muted"
      : rate >= 50
        ? "text-green-600 dark:text-green-400"
        : rate >= 30
          ? "text-amber-600 dark:text-amber-400"
          : "text-red-600 dark:text-red-400";

  return (
    <div className="flex flex-col gap-1 rounded-xl border bg-surface-2/40 px-5 py-4">
      <p className="text-xs font-medium uppercase tracking-wide text-muted">
        Win Rate
      </p>
      <p className={cn("text-2xl font-bold tabular-nums", tone)}>
        {rate != null ? `${rate}%` : "—"}
      </p>
      <p className="text-xs text-subtle">
        {total > 0
          ? `${won} won · ${lost} lost (${total} closed)`
          : "No closed deals yet"}
      </p>
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
    (s) => s !== "Closed Won" && s !== "Closed Lost",
  );

  if (total === 0) {
    return (
      <div className="rounded-xl border bg-surface-2/40 px-5 py-4">
        <p className="text-xs font-medium uppercase tracking-wide text-muted mb-3">
          Pipeline Funnel
        </p>
        <p className="text-xs text-subtle">
          No funnel data yet. Run analysis on customer calls to populate.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border bg-surface-2/40 px-5 py-4">
      <p className="text-xs font-medium uppercase tracking-wide text-muted mb-3">
        Pipeline Funnel
      </p>

      <div className="space-y-2">
        {active.map((stage) => {
          const count = counts[stage] ?? 0;
          const pct = total > 0 ? (count / total) * 100 : 0;
          return (
            <div key={stage} className="flex items-center gap-3">
              <span className="w-24 shrink-0 text-right text-xs text-muted">
                {stage}
              </span>
              <div className="flex-1 h-2 rounded-full bg-surface-3 overflow-hidden">
                <div
                  className={cn(
                    "h-full rounded-full transition-all",
                    FUNNEL_COLORS[stage],
                  )}
                  style={{ width: `${pct}%` }}
                />
              </div>
              <span className="w-6 shrink-0 text-right text-xs tabular-nums text-muted">
                {count}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Main panel ──

export function BusinessHealthPanel({ stats, funnelCounts }: Props) {
  const pendingTone = stats.pending > 0 ? "amber" : "neutral";

  return (
    <div className="space-y-3">
      {/* Row 1: Key numbers (5 cards) */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
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
        <ConversionCard counts={funnelCounts} />
      </div>

      {/* Row 2: Per-person scores + funnel */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <PersonScoreCard name="Gabriel" score={stats.gabrielAvgScore} color="blue" />
        <PersonScoreCard name="Miguel" score={stats.miguelAvgScore} color="violet" />
        <FunnelBar counts={funnelCounts} />
      </div>
    </div>
  );
}
