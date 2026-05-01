"use server";

import { revalidatePath } from "next/cache";
import { fetchMeeting } from "@/lib/queries";
import {
  applyAnalysisToMeeting,
  applyHumanCorrection,
  applyPipelineFields,
  promoteNextStepToGoal,
  setPostMortemStatus,
  setRelatedProject,
  updateFollowupEmail,
  updateTranscript,
  createMeeting,
  updateCategory,
  createOffer,
  updateOfferStatus,
} from "@/lib/mutations";
import { analyzeTranscript, regenerateFollowupEmail } from "@/lib/deepseek";
import type { NextStepItem } from "@/lib/types";
import type { Category, GoalStatus, Priority } from "@/lib/constants";

// ─── Run Analysis ──

export async function runAnalysisAction(meetingId: string) {
  const meeting = await fetchMeeting(meetingId);
  if (!meeting.transcript) {
    return { ok: false, error: "No transcript on this meeting." };
  }
  if (!meeting.category) {
    return { ok: false, error: "Meeting category is required before analysis." };
  }
  try {
    const result = await analyzeTranscript({
      transcript: meeting.transcript,
      category: meeting.category,
      knownAttendees: meeting.attendees ?? undefined,
      meetingName: meeting.name,
    });
    await applyAnalysisToMeeting(meetingId, result);
    // Write sales/pipeline fields and AI-enriched fields in a separate call
    // so a failure here doesn't roll back the core analysis.
    await applyPipelineFields(meetingId, {
      meetingType: result.meetingType,
      funnelStage: result.funnelStage,
      offerPitched: result.offerPitched,
      outcome: result.outcome,
      lossReason: result.lossReason,
      biggestOpportunity: result.biggestOpportunity,
      biggestRisk: result.biggestRisk,
      perSpeakerStats: result.perSpeakerStats,
      keyMoments: result.keyMoments,
    });
    revalidatePath("/");
    return { ok: true };
  } catch (e) {
    console.error("runAnalysisAction failed", e);
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Analysis failed.",
    };
  }
}

// ─── Regenerate follow-up email ──

export async function regenEmailAction(meetingId: string) {
  const meeting = await fetchMeeting(meetingId);
  if (!meeting.transcript || !meeting.summary) {
    return { ok: false, error: "Meeting must be analyzed first." };
  }
  try {
    const email = await regenerateFollowupEmail({
      transcript: meeting.transcript,
      summary: meeting.summary,
      nextSteps: meeting.nextSteps,
      meetingName: meeting.name,
    });
    await updateFollowupEmail(meetingId, email);
    revalidatePath("/");
    return { ok: true, email };
  } catch (e) {
    console.error("regenEmailAction failed", e);
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Regeneration failed.",
    };
  }
}

// ─── Apply manual correction ──

export async function applyCorrectionAction(args: {
  meetingId: string;
  field: string;
  newValue: unknown;
  fieldUpdate: Record<string, unknown>;
}) {
  const meeting = await fetchMeeting(args.meetingId);
  const currentValue = (meeting as unknown as Record<string, unknown>)[args.field];
  await applyHumanCorrection(
    meeting,
    {
      field: args.field,
      before: currentValue,
      after: args.newValue,
    },
    args.fieldUpdate,
  );
  revalidatePath("/");
  return { ok: true };
}

// ─── Status transition (Mark as Reviewed, etc.) ──

export async function setStatusAction(
  meetingId: string,
  status: "Not Analyzed" | "Complete" | "Needs Review",
) {
  await setPostMortemStatus(meetingId, status);
  revalidatePath("/");
  return { ok: true };
}

// ─── Promote a Next Step to a Goal ──

export async function promoteStepAction(args: {
  meetingId: string;
  step: NextStepItem;
  status?: GoalStatus;
  priority?: Priority;
}) {
  const goal = await promoteNextStepToGoal(args);
  revalidatePath("/");
  return { ok: true, goalId: goal.id };
}

// ─── Set related project ──

export async function setRelatedProjectAction(
  meetingId: string,
  projectId: string | null,
) {
  await setRelatedProject(meetingId, projectId);
  revalidatePath("/");
  return { ok: true };
}

// ─── Update Transcript ──

export async function updateTranscriptAction(
  meetingId: string,
  transcript: string,
) {
  try {
    await updateTranscript(meetingId, transcript);
    revalidatePath("/");
    return { ok: true };
  } catch (e) {
    console.error("updateTranscriptAction failed", e);
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Failed to update transcript.",
    };
  }
}

// ─── Create Meeting ──

export async function createMeetingAction(args: {
  name: string;
  category: Category;
  transcript: string;
  date: string;
}) {
  try {
    const record = await createMeeting(args.name, args.category, args.transcript, args.date);
    revalidatePath("/");
    return { ok: true, id: record.id };
  } catch (e) {
    console.error("createMeetingAction failed", e);
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Failed to create meeting.",
    };
  }
}

// ─── Update Category ──

export async function updateCategoryAction(meetingId: string, category: Category) {
  try {
    await updateCategory(meetingId, category);
    revalidatePath("/");
    return { ok: true };
  } catch (e) {
    console.error("updateCategoryAction failed", e);
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Failed to update category.",
    };
  }
}

// ─── Create Offer ──

export async function createOfferAction(args: {
  offerName: string;
  type: string;
  status?: string;
  company?: string;
  datePresented?: string;
  meetingId?: string;
}) {
  try {
    const offer = await createOffer(args);
    revalidatePath("/");
    revalidatePath("/goals");
    return { ok: true, offerId: offer.id };
  } catch (e) {
    console.error("createOfferAction failed", e);
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Failed to create offer.",
    };
  }
}

// ─── Update Offer Status ──

export async function updateOfferStatusAction(
  offerId: string,
  status: string,
  lossReason?: string,
) {
  try {
    await updateOfferStatus(offerId, status, lossReason);
    revalidatePath("/");
    revalidatePath("/goals");
    return { ok: true };
  } catch (e) {
    console.error("updateOfferStatusAction failed", e);
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Failed to update offer status.",
    };
  }
}
