// ─────────────────────────────────────────────────────────────
// Server-side write helpers.
// Wrappers around lib/airtable.ts that serialize JSON fields and
// build link arrays correctly.
// ─────────────────────────────────────────────────────────────

import "server-only";
import { updateRecord, createRecord, tables } from "./airtable";
import type {
  AnalysisResult,
  HumanCorrection,
  MeetingNote,
  NextStepItem,
} from "./types";
import type { GoalStatus, Priority, Confidence } from "./constants";

// ─── Apply AI analysis result to a meeting ──

export async function applyAnalysisToMeeting(
  meetingId: string,
  result: AnalysisResult,
) {
  const fields: Record<string, unknown> = {
    Summary: result.summary,
    "Meeting Score": result.meetingScore,
    "Score Breakdown": JSON.stringify(result.scoreBreakdown),
    "Analysis Confidence": result.analysisConfidence,
    "Next Steps": JSON.stringify(result.nextSteps),
    "Improvement Areas": result.improvementAreas,
    Objections: result.objections,
    "Buying Signals": result.buyingSignals,
    Attendees: result.attendees,
    "Speaker Map": JSON.stringify(result.speakerMap),
    "Post-Mortem Status":
      result.analysisConfidence === "Low" ? "Needs Review" : "Complete",
    "Last Analyzed At": new Date().toISOString(),
  };
  if (result.followupEmail) fields["Follow-up Email"] = result.followupEmail;
  if (result.duration) fields["Duration"] = result.duration;

  return updateRecord(tables.meetingNotes(), meetingId, fields);
}

// ─── Update follow-up email only ──

export async function updateFollowupEmail(
  meetingId: string,
  email: string,
) {
  return updateRecord(tables.meetingNotes(), meetingId, {
    "Follow-up Email": email,
  });
}

// ─── Apply a single human correction ──

export async function applyHumanCorrection(
  meeting: MeetingNote,
  correction: Omit<HumanCorrection, "at">,
  fieldUpdate: Record<string, unknown>,
) {
  const log: HumanCorrection[] = [
    ...meeting.humanCorrections,
    { ...correction, at: new Date().toISOString() },
  ];
  return updateRecord(tables.meetingNotes(), meeting.id, {
    ...fieldUpdate,
    "Human Corrections": JSON.stringify(log),
  });
}

// ─── Update post-mortem status ──

export async function setPostMortemStatus(
  meetingId: string,
  status: "Not Analyzed" | "Complete" | "Needs Review",
) {
  return updateRecord(tables.meetingNotes(), meetingId, {
    "Post-Mortem Status": status,
  });
}

// ─── Promote a Next Step to a Goal ──

export async function promoteNextStepToGoal(args: {
  meetingId: string;
  step: NextStepItem;
  status?: GoalStatus;
  priority?: Priority;
}) {
  const goal = await createRecord(tables.goalsTracker(), {
    "Goal name": args.step.description,
    Status: args.status ?? "Todo",
    Priority: args.priority ?? "Medium",
    "Source Meeting": [args.meetingId],
    Confidence: args.step.confidence ?? "Medium",
    Notes: args.step.owner ? `Owner: ${args.step.owner}` : undefined,
  });
  return goal;
}

// ─── Re-link helpers ──

export async function setRelatedProject(meetingId: string, projectId: string | null) {
  return updateRecord(tables.meetingNotes(), meetingId, {
    "Related Project": projectId ? [projectId] : [],
  });
}
