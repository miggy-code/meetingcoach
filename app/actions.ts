"use server";

import { revalidatePath } from "next/cache";
import { fetchMeeting } from "@/lib/queries";
import {
  applyAnalysisToMeeting,
  applyHumanCorrection,
  promoteNextStepToGoal,
  setPostMortemStatus,
  setRelatedProject,
  updateFollowupEmail,
  updateTranscript,
  updateContextNotes,
  createMeeting,
  updateCategory,
  updateMeetingMeta,
  createOffer,
  updateOfferStatus,
} from "@/lib/mutations";
import { analyzeTranscript, regenerateFollowupEmail } from "@/lib/deepseek";
import type { NextStepItem } from "@/lib/types";
import type { Category, GoalStatus, Priority, MeetingLead } from "@/lib/constants";

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
      meetingLead: meeting.meetingLead ?? undefined,
      contextNotes: meeting.contextNotes ?? undefined,
      company: meeting.company ?? undefined,
      contactName: meeting.contactName ?? undefined,
    });
    // applyAnalysisToMeeting now writes ALL fields including pipeline + debriefs
    await applyAnalysisToMeeting(meetingId, result);
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

// ─── Status transition ──

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

// ─── Update Context Notes ──

export async function updateContextNotesAction(
  meetingId: string,
  notes: string,
) {
  try {
    await updateContextNotes(meetingId, notes);
    revalidatePath("/");
    return { ok: true };
  } catch (e) {
    console.error("updateContextNotesAction failed", e);
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Failed to save context notes.",
    };
  }
}

// ─── Create Meeting ──

export async function createMeetingAction(args: {
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
  try {
    const record = await createMeeting(args);
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

// ─── Update Meeting Metadata ──

export async function updateMeetingMetaAction(
  meetingId: string,
  meta: {
    meetingLead?: MeetingLead;
    company?: string;
    contactName?: string;
    meetingTime?: string;
  },
) {
  try {
    await updateMeetingMeta(meetingId, meta);
    revalidatePath("/");
    return { ok: true };
  } catch (e) {
    console.error("updateMeetingMetaAction failed", e);
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Failed to update meeting.",
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
