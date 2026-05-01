"use client";

import useSWR from "swr";
import type { MeetingNote, Goal, Project, Offer } from "@/lib/types";
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
import { PipelinePanel } from "./PipelinePanel";
import { PerSpeakerStats } from "./PerSpeakerStats";
import { KeyMomentsSection } from "./KeyMomentsSection";
import { OffersPanel } from "./OffersPanel";
import { CoachingDebriefSection } from "./CoachingDebriefSection";
import { MeetingHeader } from "./MeetingHeader";
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
      offers: Offer[];
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
  const { meeting, goals, projects, offers } = data;
  const showSignals =
    meeting.category != null &&
    !SIGNAL_HIDDEN_CATEGORIES.includes(meeting.category);
  const showImprovements =
    meeting.category != null &&
    IMPROVEMENT_VISIBLE_CATEGORIES.includes(meeting.category);
  const showEmail = meeting.category === "Customer Call";
  const showPipeline =
    meeting.category === "Customer Call" || meeting.category === "Presentation";
  const showCoaching =
    showPipeline &&
    (meeting.gabrielDebrief || meeting.miguelDebrief || meeting.skillScores);

  // ─── No transcript yet ──
  if (!meeting.transcript) {
    return (
      <div className="border-t bg-surface-2/30 px-6 py-8 space-y-4">
        <MeetingHeader meeting={meeting} onRefresh={() => mutate()} />
        <p className="text-sm text-muted">
          No transcript uploaded yet. Paste the transcript in the field above or
          wait for the Fathom webhook to deliver it automatically.
        </p>
      </div>
    );
  }

  // ─── Not analyzed yet ──
  if (meeting.postMortemStatus === "Not Analyzed" || !meeting.summary) {
    return (
      <div className="border-t bg-surface-2/30 px-6 py-8 space-y-4">
        <MeetingHeader meeting={meeting} onRefresh={() => mutate()} />
        <RunAnalysisPrompt meeting={meeting} onRefresh={() => mutate()} />
        <TranscriptSection transcript={meeting.transcript} />
      </div>
    );
  }

  return (
    <div className="border-t bg-surface-2/30 px-6 py-6 space-y-6">

      {/* ── Structured header: metadata + context notes ── */}
      <MeetingHeader meeting={meeting} onRefresh={() => mutate()} />

      {/* ── Score sheet ── */}
      <ScoreSheet
        score={meeting.meetingScore}
        breakdown={meeting.scoreBreakdown}
        confidence={meeting.analysisConfidence}
      />

      {/* ── Summary ── */}
      <SummaryBlock
        summary={meeting.summary}
        confidence={meeting.analysisConfidence}
      />

      {/* ── Coaching Debriefs (most important for customer calls) ── */}
      {showCoaching && (
        <CoachingDebriefSection
          gabrielDebrief={meeting.gabrielDebrief}
          miguelDebrief={meeting.miguelDebrief}
          skillScoresJson={meeting.skillScores}
          meetingLead={meeting.meetingLead}
        />
      )}

      {/* ── Pipeline Intelligence ── */}
      {showPipeline && (
        <PipelinePanel meeting={meeting} />
      )}

      {/* ── Two-column: next steps + improvements | goals + project + offers ── */}
      <div className="grid gap-6 lg:grid-cols-[3fr_2fr]">
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
          <OffersPanel
            offers={offers}
            meetingId={meeting.id}
            meetingDate={meeting.date}
            onRefresh={() => mutate()}
          />
        </div>
      </div>

      {/* ── Signals (objections + buying signals) ── */}
      {showSignals && (
        <SignalsSection
          objections={meeting.objections}
          buyingSignals={meeting.buyingSignals}
        />
      )}

      {/* ── Per-Speaker Stats + Key Moments ── */}
      {(meeting.perSpeakerStats || meeting.keyMoments) && (
        <div className="grid gap-6 lg:grid-cols-2">
          <PerSpeakerStats perSpeakerStatsJson={meeting.perSpeakerStats} />
          <KeyMomentsSection keyMomentsJson={meeting.keyMoments} />
        </div>
      )}

      {/* ── Follow-up email suggestion ── */}
      {showEmail && (
        <FollowupEmailSection
          email={meeting.followupEmail}
          meetingId={meeting.id}
          onRefresh={() => mutate()}
        />
      )}

      {/* ── Transcript ── */}
      <TranscriptSection transcript={meeting.transcript} />

      {/* ── Footer ── */}
      <CorrectionFooter meeting={meeting} />
    </div>
  );
}
