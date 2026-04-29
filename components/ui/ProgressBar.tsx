import { cn } from "@/lib/utils";
import { scoreColor } from "@/lib/constants";

export function ProgressBar({
  value,
  max,
  variant = "score",
  className,
}: {
  value: number;
  max: number;
  variant?: "score" | "neutral";
  className?: string;
}) {
  const pct = max > 0 ? Math.max(0, Math.min(100, (value / max) * 100)) : 0;
  let barClass = "bg-text/70";
  if (variant === "score") {
    // Use score thresholds against full 10-pt scale only when max == 10
    if (max === 10) {
      const c = scoreColor(value);
      barClass =
        c === "green"
          ? "bg-emerald-500"
          : c === "amber"
            ? "bg-amber-500"
            : c === "red"
              ? "bg-red-500"
              : "bg-line-strong";
    } else {
      // Component-level bar: color by ratio
      const ratio = value / max;
      barClass =
        ratio >= 0.8
          ? "bg-emerald-500"
          : ratio >= 0.5
            ? "bg-amber-500"
            : ratio > 0
              ? "bg-red-500"
              : "bg-line-strong";
    }
  }
  return (
    <div
      className={cn(
        "h-1.5 w-full overflow-hidden rounded-full bg-surface-2",
        className,
      )}
      role="progressbar"
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={max}
    >
      <div
        className={cn("h-full rounded-full transition-[width]", barClass)}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}
