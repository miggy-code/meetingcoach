import { cn } from "@/lib/utils";
import type { DashboardData } from "@/lib/types";

export function HeroStats({ stats }: { stats: DashboardData["weekStats"] }) {
  const cards = [
    {
      label: "Meetings this week",
      value: stats.meetingsThisWeek,
      tone: "neutral" as const,
    },
    {
      label: "Analyzed",
      value: stats.analyzed,
      tone: stats.analyzed > 0 ? "success" : ("neutral" as const),
    },
    {
      label: "Pending",
      value: stats.pending,
      tone: stats.pending > 0 ? "warn" : ("neutral" as const),
    },
    {
      label: "Avg score",
      value: stats.avgScore == null ? "—" : stats.avgScore.toFixed(1),
      tone: "neutral" as const,
      sublabel: "this week",
    },
  ];
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
      {cards.map((c) => (
        <StatCard key={c.label} {...c} />
      ))}
    </div>
  );
}

function StatCard({
  label,
  value,
  tone,
  sublabel,
}: {
  label: string;
  value: number | string;
  tone: "neutral" | "success" | "warn";
  sublabel?: string;
}) {
  const accent: Record<typeof tone, string> = {
    neutral: "text-text",
    success: "text-emerald-600 dark:text-emerald-400",
    warn: "text-amber-600 dark:text-amber-400",
  };
  return (
    <div className="rounded-xl border bg-surface p-5">
      <div className={cn("text-5xl font-semibold tabular", accent[tone])}>
        {value}
      </div>
      <div className="mt-2 text-xs uppercase tracking-wider text-subtle">
        {label}
        {sublabel && <span className="ml-1 text-subtle/70">· {sublabel}</span>}
      </div>
    </div>
  );
}
