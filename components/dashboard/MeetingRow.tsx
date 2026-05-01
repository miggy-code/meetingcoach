"use client";

import type { MeetingNote } from "@/lib/types";
import { cn, formatDateShort } from "@/lib/utils";
import {
  CategoryTag,
  ScoreBadge,
  StatusIcon,
} from "@/components/ui/Badges";
import { DetailPanel } from "@/components/detail/DetailPanel";

const LEAD_COLORS: Record<string, string> = {
  Gabriel: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  Miguel: "bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300",
  Both: "bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300",
};

const OUTCOME_COLORS: Record<string, string> = {
  Positive: "text-green-600",
  Neutral: "text-muted",
  Negative: "text-red-500",
  "No Show": "text-amber-500",
};

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
  const leadColor = meeting.meetingLead ? (LEAD_COLORS[meeting.meetingLead] ?? "") : "";

  return (
    <li className={cn("group", isAlt && "bg-surface-2/40")}>
      <button
        type="button"
        onClick={onToggle}
        className={cn(
          "flex w-full items-start gap-3 px-5 py-3.5 text-left transition-colors hover:bg-surface-2",
          isExpanded && "bg-surface-2",
        )}
        aria-expanded={isExpanded}
      >
        {/* Status icon */}
        <div className="mt-0.5 shrink-0">
          <StatusIcon status={meeting.postMortemStatus} />
        </div>

        {/* Main content */}
        <div className="min-w-0 flex-1">
          {/* Row 1: name + category + lead badge */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="truncate text-sm font-medium">{meeting.name}</span>
            <CategoryTag category={meeting.category} />
            {meeting.meetingLead && (
              <span
                className={cn(
                  "rounded px-1.5 py-0.5 text-[10px] font-semibold",
                  leadColor,
                )}
              >
                {meeting.meetingLead}
              </span>
            )}
          </div>

          {/* Row 2: company · contact · subtitle */}
          <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-xs text-muted">
            {meeting.company && (
              <span className="font-medium text-foreground/70">{meeting.company}</span>
            )}
            {meeting.company && meeting.contactName && (
              <span className="text-subtle">·</span>
            )}
            {meeting.contactName && <span>{meeting.contactName}</span>}
            {(meeting.company || meeting.contactName) && subtitle && (
              <span className="text-subtle">·</span>
            )}
            <span className="truncate">{subtitle}</span>
          </div>

          {/* Row 3: funnel stage + outcome */}
          {(meeting.funnelStage || meeting.outcome) && (
            <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-xs">
              {meeting.funnelStage && (
                <span className="rounded border border-line px-1.5 py-0.5 text-[10px] text-muted">
                  {meeting.funnelStage}
                </span>
              )}
              {meeting.outcome && (
                <span
                  className={cn(
                    "text-[10px] font-medium",
                    OUTCOME_COLORS[meeting.outcome] ?? "text-muted",
                  )}
                >
                  {meeting.outcome}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Right side: date + score */}
        <div className="flex shrink-0 flex-col items-end gap-1">
          <span className="tabular text-xs text-muted">
            {formatDateShort(meeting.date)}
          </span>
          <ScoreBadge score={meeting.meetingScore} size="md" />
        </div>
      </button>
      {isExpanded && <DetailPanel meetingId={meeting.id} />}
    </li>
  );
}

function buildSubtitle(m: MeetingNote): string {
  if (m.postMortemStatus === "Complete" && m.meetingScore != null) {
    const parts: string[] = [`Score ${m.meetingScore}/10`];
    if (m.relatedGoalIds.length)
      parts.push(`${m.relatedGoalIds.length} actions`);
    if (m.objections.length) parts.push(`${m.objections.length} objections`);
    if (m.buyingSignals.length)
      parts.push(`${m.buyingSignals.length} signals`);
    return parts.join(" · ");
  }
  if (m.postMortemStatus === "Not Analyzed" && m.transcript)
    return "Ready for analysis";
  if (!m.transcript) return "No transcript";
  if (m.postMortemStatus === "Needs Review") return "Needs review";
  return "—";
}
