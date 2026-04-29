import { AlertTriangle } from "lucide-react";

export function ReviewQueue({ count }: { count: number }) {
  if (count <= 0) return null;
  return (
    <div className="mb-8 flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm dark:border-amber-900/60 dark:bg-amber-950/30">
      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
      <div className="flex-1">
        <p className="font-medium text-amber-900 dark:text-amber-200">
          {count} {count === 1 ? "meeting needs" : "meetings need"} human review
        </p>
        <p className="mt-0.5 text-xs text-amber-700/80 dark:text-amber-300/80">
          AI flagged low-confidence detections. Open each meeting and confirm
          or correct the analysis.
        </p>
      </div>
    </div>
  );
}
