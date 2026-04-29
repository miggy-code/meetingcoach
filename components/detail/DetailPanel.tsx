"use client";

import useSWR from "swr";
import type { MeetingNote, Goal, Project } from "@/lib/types";
import { ScoreSheet } from "./ScoreSheet";
import { SummaryBlock } from "./SummaryBlock";
import { NextStepsList } from "./NextStepsList";
import { ImprovementAreas } from "./ImprovementAreas";
import { LinkedGoalsList } from "./LinkedGoalsList";
import { RelatedProjectCard } from "./RelatedProjectCard";
import { SignalsSection } from "./SignalsSection";
import { FollowupEmailSection } from "./FollowupEmailSection";
import { TranscriptSection } from "./TranscriptSection";
import { CorrectionFooter } from "./CorrectionFooter";
import { RunAnalysisPrompt } from "./RunAnalysisPrompt";
import { CategoryTag } from "@/components/ui/Badges";
import { formatDate, formatDuration } from "@/lib/utils";
import {
  IMPROVEMENT_VISIBLE_CATEGORIES,
  SIGNAL_HIDDEN_CATEGORIES,
} from "@/lib/constants";

type DetailResponse =
  | {
      ok: true;
      meeting: MeetingNote;
      goals: Goal[];
      projects: Project[];
    }
  | { ok: false; error: string };

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export function DetailPanel({ meetingId }: { meetingId: string }) {
  const { data, isLoading, mutate } = useSWR<DetailResponse>(
    `/api/meeting/${meetingId}`,
    fetcher,
    { revalidateOnFocus: false },
  );

  if (isLoading) {
    return (
      <div className="border-t bg-surface-2/30 px-6 py-8 text-sm text-subtle">
        Loading details…
      </div>
    );
  }
  if (!data || !data.ok) {
    return (
      <div className="border-t bg-surface-2/30 px-6 py-8 text-sm text-red-600">
        Failed to load: {data && !data.ok ? data.error : "Unknown error"}
      </div>
    );
  }
  const { meeting, goals, projects } = data;
  const showSignals =
    meeting.category != null &&
    !SIGNAL_HIDDEN_CATEGORIES.includes(meeting.category);
  const showImprovements =
    meeting.category != null &&
    IMPROVEMENT_VISIBLE_CATEGORIES.includes(meeting.category);
  const showEmail = meeting.category === "Customer Call";

  // Empty/pending states
  if (!meeting.transcript) {
    return (
      <div className="border-t bg-surface-2/30 px-6 py-8 text-sm">
        <p className="text-muted">
          No transcript uploaded. Paste a transcript into the meeting record in
          Airtable to enable analysis.
        </p>
      </div>
    );
  }
  if (meeting.postMortemStatus === "Not Analyzed" || !meeting.summary) {
    return (
      <div className="border-t bg-surface-2/30 px-6 py-8">
        <RunAnalysisPrompt meeting={meeting} onRefresh={() => mutate()} />
        <TranscriptSection transcript={meeting.transcript} />
      </div>
    );
  }

  return (
    <div className="border-t bg-surface-2/30 px-6 py-6">
      {/* 2A — Header */}
      <div className="mb-6 flex flex-wrap items-center gap-3 text-xs text-muted">
        <CategoryTag category={meeting.category} />
        <span>{formatDate(meeting.date)}</span>
        <span>·</span>
        <span>{formatDuration(meeting.duration)}</span>
        {meeting.attendees && (
          <>
            <span>·</span>
            <span className="truncate">{meeting.attendees}</span>
          </>
        )}
      </div>

      {/* 2B — Score Sheet */}
      <div className="mb-6">
        <ScoreSheet
          score={meeting.meetingScore}
          breakdown={meeting.scoreBreakdown}
          confidence={meeting.analysisConfidence}
        />
      </div>

      {/* 2C — Summary */}
      <SummaryBlock
        summary={meeting.summary}
        confidence={meeting.analysisConfidence}
      />

      {/* 2D — Two columns */}
      <div className="mt-6 grid gap-6 lg:grid-cols-[3fr_2fr]">
        <div className="space-y-6">
          <NextStepsList
            steps={meeting.nextSteps}
            relatedGoalIds={meeting.relatedGoalIds}
            meetingId={meeting.id}
            onRefresh={() => mutate()}
          />
          {showImprovements && (
            <ImprovementAreas areas={meeting.improvementAreas} />
          )}
        </div>
        <div className="space-y-6">
          <LinkedGoalsList goals={goals} />
          <RelatedProjectCard project={projects[0] ?? null} />
        </div>
      </div>

      {/* 2E — Signals */}
      {showSignals && (
        <div className="mt-6">
          <SignalsSection
            objections={meeting.objections}
            buyingSignals={meeting.buyingSignals}
          />
        </div>
      )}

      {/* 2F — Follow-up email */}
      {showEmail && (
        <div className="mt-6">
          <FollowupEmailSection
            email={meeting.followupEmail}
            meetingId={meeting.id}
            onRefresh={() => mutate()}
          />
        </div>
      )}

      {/* 2G — Transcript */}
      <div className="mt-6">
        <TranscriptSection transcript={meeting.transcript} />
      </div>

      {/* 2H — Footer */}
      <CorrectionFooter meeting={meeting} />
    </div>
  );
}
