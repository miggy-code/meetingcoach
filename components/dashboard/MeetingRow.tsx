"use client";

import type { MeetingNote } from "@/lib/types";
import { cn, formatDateShort } from "@/lib/utils";
import {
  CategoryTag,
  ScoreBadge,
  StatusIcon,
} from "@/components/ui/Badges";
import { DetailPanel } from "@/components/detail/DetailPanel";

export function MeetingRow({
  meeting,
  isExpanded,
  onToggle,
  isAlt,
}: {
  meeting: MeetingNote;
  isExpanded: boolean;
  onToggle: () => void;
  isAlt: boolean;
}) {
  const subtitle = buildSubtitle(meeting);
  return (
    <li className={cn("group", isAlt && "bg-surface-2/40")}>
      <button
        type="button"
        onClick={onToggle}
        className={cn(
          "flex w-full items-center gap-4 px-5 py-4 text-left transition-colors hover:bg-surface-2",
          isExpanded && "bg-surface-2",
        )}
        aria-expanded={isExpanded}
      >
        <StatusIcon status={meeting.postMortemStatus} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="truncate text-sm font-medium">{meeting.name}</span>
            <CategoryTag category={meeting.category} />
          </div>
          <p className="mt-0.5 truncate text-xs text-subtle">{subtitle}</p>
        </div>
        <span className="tabular text-xs text-muted">
          {formatDateShort(meeting.date)}
        </span>
        <div className="w-12 text-right">
          <ScoreBadge score={meeting.meetingScore} size="md" />
        </div>
        <span className="tabular w-12 text-right text-xs text-muted">
          {meeting.relatedGoalIds.length > 0
            ? `${meeting.relatedGoalIds.length} ▦`
            : ""}
        </span>
      </button>
      {isExpanded && <DetailPanel meetingId={meeting.id} />}
    </li>
  );
}

function buildSubtitle(m: MeetingNote): string {
  if (m.postMortemStatus === "Complete" && m.meetingScore != null) {
    const parts: string[] = [`Score ${m.meetingScore}/10`];
    if (m.relatedGoalIds.length)
      parts.push(`${m.relatedGoalIds.length} action items`);
    if (m.objections.length) parts.push(`⚠ ${m.objections.length} objections`);
    if (m.buyingSignals.length)
      parts.push(`🟢 ${m.buyingSignals.length} buying signals`);
    return parts.join(" · ");
  }
  if (m.postMortemStatus === "Not Analyzed" && m.transcript)
    return "Transcript uploaded · Ready for analysis";
  if (!m.transcript) return "No transcript yet";
  if (m.postMortemStatus === "Needs Review")
    return "Needs review — AI flagged low confidence";
  return "—";
}
