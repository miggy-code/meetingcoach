import type { MeetingNote } from "@/lib/types";
import { formatDateTime } from "@/lib/utils";

export function CorrectionFooter({ meeting }: { meeting: MeetingNote }) {
  return (
    <div className="mt-6 border-t pt-4 text-xs text-subtle">
      <p>
        Analysis confidence:{" "}
        <span className="text-muted">
          {meeting.analysisConfidence ?? "—"}
        </span>{" "}
        · Last analyzed:{" "}
        <span className="text-muted">
          {formatDateTime(meeting.lastAnalyzedAt)}
        </span>
      </p>
      <p className="mt-1">
        Corrections:{" "}
        <span className="text-muted">
          {meeting.humanCorrections.length}
        </span>{" "}
        manual{" "}
        {meeting.humanCorrections.length === 1 ? "fix" : "fixes"} applied — these
        improve future analyses.
      </p>
    </div>
  );
}
