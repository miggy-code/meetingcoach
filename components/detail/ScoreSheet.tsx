import type { ScoreBreakdown } from "@/lib/types";
import type { Confidence } from "@/lib/constants";
import { SCORE_COMPONENTS } from "@/lib/constants";
import { ScoreBadge, ConfidenceBadge } from "@/components/ui/Badges";
import { ProgressBar } from "@/components/ui/ProgressBar";

export function ScoreSheet({
  score,
  breakdown,
  confidence,
}: {
  score: number | null;
  breakdown: ScoreBreakdown | null;
  confidence: Confidence | null;
}) {
  return (
    <div className="rounded-xl border bg-surface p-6">
      <div className="flex items-start justify-between gap-6">
        <div>
          <div className="text-xs uppercase tracking-wider text-subtle">
            Meeting score
          </div>
          <div className="mt-1 flex items-baseline gap-2">
            <ScoreBadge score={score} size="xl" />
            <span className="text-xl text-subtle">/ 10</span>
          </div>
        </div>
        <ConfidenceBadge confidence={confidence} />
      </div>
      <div className="mt-4">
        <ProgressBar value={score ?? 0} max={10} variant="score" />
      </div>
      {breakdown && (
        <div className="mt-6 space-y-3 border-t pt-5">
          {Object.entries(SCORE_COMPONENTS).map(([key, meta]) => {
            const v = breakdown[key as keyof ScoreBreakdown] ?? 0;
            return (
              <div key={key} className="grid grid-cols-[140px_1fr_50px] items-center gap-3 text-xs">
                <span className="text-muted">{meta.label}</span>
                <ProgressBar value={v} max={meta.max} variant="score" />
                <span className="tabular text-right font-medium">
                  {v}/{meta.max}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
