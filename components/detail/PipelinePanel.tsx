"use client";

import type { MeetingNote } from "@/lib/types";

interface Props {
  meeting: MeetingNote;
}

const OUTCOME_COLORS: Record<string, string> = {
  Positive: "text-green-600",
  Neutral: "text-yellow-600",
  Negative: "text-red-600",
  "No Show": "text-gray-500",
};

const FUNNEL_COLORS: Record<string, string> = {
  Prospect: "bg-gray-100 text-gray-600",
  Discovery: "bg-blue-100 text-blue-700",
  Proposal: "bg-yellow-100 text-yellow-700",
  Negotiation: "bg-orange-100 text-orange-700",
  "Closed Won": "bg-green-100 text-green-700",
  "Closed Lost": "bg-red-100 text-red-700",
};

export function PipelinePanel({ meeting }: Props) {
  const hasPipelineData =
    meeting.meetingType ||
    meeting.funnelStage ||
    meeting.offerPitched ||
    meeting.outcome ||
    meeting.biggestOpportunity ||
    meeting.biggestRisk;

  if (!hasPipelineData) return null;

  return (
    <div>
      <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted">
        Pipeline Intelligence
      </h3>
      <div className="rounded-lg border bg-surface-2/40 p-4 space-y-3">
        {/* Row 1: Type + Stage + Outcome */}
        <div className="flex flex-wrap gap-2">
          {meeting.meetingType && (
            <span className="rounded border bg-surface-3 px-2 py-0.5 text-xs font-medium text-foreground">
              {meeting.meetingType}
            </span>
          )}
          {meeting.funnelStage && (
            <span
              className={`rounded border px-2 py-0.5 text-xs font-medium ${FUNNEL_COLORS[meeting.funnelStage] ?? "bg-gray-100 text-gray-600"}`}
            >
              {meeting.funnelStage}
            </span>
          )}
          {meeting.outcome && (
            <span
              className={`text-xs font-semibold ${OUTCOME_COLORS[meeting.outcome] ?? "text-gray-500"}`}
            >
              Outcome: {meeting.outcome}
            </span>
          )}
        </div>

        {/* Offer Pitched */}
        {meeting.offerPitched && (
          <div className="text-sm">
            <span className="text-muted">Offer pitched: </span>
            <span className="font-medium text-foreground">{meeting.offerPitched}</span>
          </div>
        )}

        {/* Loss Reason */}
        {meeting.lossReason && (
          <div className="text-sm">
            <span className="text-muted">Loss reason: </span>
            <span className="font-medium text-red-600">{meeting.lossReason}</span>
          </div>
        )}

        {/* Biggest Opportunity */}
        {meeting.biggestOpportunity && (
          <div className="rounded bg-green-50 border border-green-100 px-3 py-2">
            <p className="text-xs font-semibold text-green-700 mb-1">Biggest Opportunity</p>
            <p className="text-sm text-green-900">{meeting.biggestOpportunity}</p>
          </div>
        )}

        {/* Biggest Risk */}
        {meeting.biggestRisk && (
          <div className="rounded bg-red-50 border border-red-100 px-3 py-2">
            <p className="text-xs font-semibold text-red-700 mb-1">Biggest Risk</p>
            <p className="text-sm text-red-900">{meeting.biggestRisk}</p>
          </div>
        )}
      </div>
    </div>
  );
}
