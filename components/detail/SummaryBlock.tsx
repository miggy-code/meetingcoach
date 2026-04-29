import type { Confidence } from "@/lib/constants";
import { ConfidenceBadge } from "@/components/ui/Badges";

export function SummaryBlock({
  summary,
  confidence,
}: {
  summary: string | null;
  confidence: Confidence | null;
}) {
  if (!summary) return null;
  return (
    <div className="relative rounded-xl border bg-surface p-5">
      <div className="absolute right-4 top-4">
        <ConfidenceBadge confidence={confidence} />
      </div>
      <h3 className="mb-2 pr-20 text-xs font-medium uppercase tracking-wider text-subtle">
        Summary
      </h3>
      <p className="whitespace-pre-wrap text-sm leading-relaxed text-text">
        {summary}
      </p>
    </div>
  );
}
