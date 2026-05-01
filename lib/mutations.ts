// ─────────────────────────────────────────────────────────────
// Server-side write helpers.
// Wrappers around lib/airtable.ts that serialize JSON fields and
// build link arrays correctly.
// All writes target ThrottlInternal (AIRTABLE_INTERNAL_BASE_ID).
// ─────────────────────────────────────────────────────────────

import "server-only";
import { updateRecord, createRecord, tables } from "./airtable";
import type {
  AnalysisResult,
  HumanCorrection,
  MeetingNote,
  NextStepItem,
} from "./types";
import type {
  Category,
  GoalStatus,
  Priority,
  MeetingLead,
} from "./constants";

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

  // ─── Sales / pipeline ──
  if (result.meetingType !== undefined) fields["Meeting Type"] = result.meetingType;
  if (result.funnelStage !== undefined) fields["Funnel Stage"] = result.funnelStage;
  if (result.offerPitched !== undefined) fields["Offer Pitched"] = result.offerPitched;
  if (result.outcome !== undefined) fields["Outcome"] = result.outcome;
  if (result.lossReason !== undefined) fields["Loss Reason"] = result.lossReason;
  if (result.biggestOpportunity !== undefined) fields["Biggest Opportunity"] = result.biggestOpportunity;
  if (result.biggestRisk !== undefined) fields["Biggest Risk"] = result.biggestRisk;

  // ─── AI-enriched ──
  if (result.perSpeakerStats !== undefined) fields["Per-Speaker Stats"] = result.perSpeakerStats;
  if (result.keyMoments !== undefined) fields["Key Moments"] = result.keyMoments;
  if (result.gabrielDebrief !== undefined) fields["Gabriel Debrief"] = result.gabrielDebrief;
  if (result.miguelDebrief !== undefined) fields["Miguel Debrief"] = result.miguelDebrief;
  if (result.skillScores !== undefined) fields["Skill Scores"] = result.skillScores;

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

// ─── Update transcript ──

export async function updateTranscript(meetingId: string, transcript: string) {
  return updateRecord(tables.meetingNotes(), meetingId, {
    Transcript: transcript,
  });
}

// ─── Update context notes ──

export async function updateContextNotes(meetingId: string, notes: string) {
  return updateRecord(tables.meetingNotes(), meetingId, {
    "Context Notes": notes,
  });
}

// ─── Create meeting ──

export async function createMeeting(args: {
  name: string;
  category: Category;
  transcript: string;
  date: string;
  meetingLead: MeetingLead;
  company?: string;
  contactName?: string;
  meetingTime?: string;
  contextNotes?: string;
}) {
  return createRecord(tables.meetingNotes(), {
    Name: args.name,
    Category: args.category,
    Transcript: args.transcript,
    Date: args.date,
    "Meeting Lead": args.meetingLead,
    Company: args.company ?? null,
    "Contact Name": args.contactName ?? null,
    "Meeting Time": args.meetingTime ?? null,
    "Context Notes": args.contextNotes ?? null,
    "Post-Mortem Status": "Not Analyzed",
  });
}

// ─── Update category ──

export async function updateCategory(meetingId: string, category: Category) {
  return updateRecord(tables.meetingNotes(), meetingId, {
    Category: category,
  });
}

// ─── Update meeting metadata (lead, company, contact, time) ──

export async function updateMeetingMeta(
  meetingId: string,
  meta: {
    meetingLead?: MeetingLead;
    company?: string;
    contactName?: string;
    meetingTime?: string;
  },
) {
  const update: Record<string, unknown> = {};
  if (meta.meetingLead !== undefined) update["Meeting Lead"] = meta.meetingLead;
  if (meta.company !== undefined) update["Company"] = meta.company;
  if (meta.contactName !== undefined) update["Contact Name"] = meta.contactName;
  if (meta.meetingTime !== undefined) update["Meeting Time"] = meta.meetingTime;
  return updateRecord(tables.meetingNotes(), meetingId, update);
}

// ─── Apply AI-generated sales/pipeline fields (kept for backward compat) ──

export async function applyPipelineFields(
  meetingId: string,
  fields: {
    meetingType?: string | null;
    funnelStage?: string | null;
    offerPitched?: string | null;
    outcome?: string | null;
    lossReason?: string | null;
    biggestOpportunity?: string | null;
    biggestRisk?: string | null;
    perSpeakerStats?: string | null;
    keyMoments?: string | null;
  },
) {
  const update: Record<string, unknown> = {};
  if (fields.meetingType !== undefined) update["Meeting Type"] = fields.meetingType;
  if (fields.funnelStage !== undefined) update["Funnel Stage"] = fields.funnelStage;
  if (fields.offerPitched !== undefined) update["Offer Pitched"] = fields.offerPitched;
  if (fields.outcome !== undefined) update["Outcome"] = fields.outcome;
  if (fields.lossReason !== undefined) update["Loss Reason"] = fields.lossReason;
  if (fields.biggestOpportunity !== undefined) update["Biggest Opportunity"] = fields.biggestOpportunity;
  if (fields.biggestRisk !== undefined) update["Biggest Risk"] = fields.biggestRisk;
  if (fields.perSpeakerStats !== undefined) update["Per-Speaker Stats"] = fields.perSpeakerStats;
  if (fields.keyMoments !== undefined) update["Key Moments"] = fields.keyMoments;
  return updateRecord(tables.meetingNotes(), meetingId, update);
}

// ─── Create an Offer record ──

export async function createOffer(args: {
  offerName: string;
  type: string;
  status?: string;
  company?: string;
  datePresented?: string;
  meetingId?: string;
}) {
  return createRecord(tables.offers(), {
    "Offer Name": args.offerName,
    Type: args.type,
    Status: args.status ?? "Presented",
    Company: args.company,
    "Date Presented": args.datePresented,
    ...(args.meetingId ? { "Meeting Notes": [args.meetingId] } : {}),
  });
}

// ─── Update Offer status ──

export async function updateOfferStatus(
  offerId: string,
  status: string,
  lossReason?: string,
) {
  return updateRecord(tables.offers(), offerId, {
    Status: status,
    ...(lossReason ? { "Loss Reason": lossReason } : {}),
  });
}
