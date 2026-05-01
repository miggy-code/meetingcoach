// ─────────────────────────────────────────────────────────────
// POST /api/webhooks/fathom
//
// Receives the Fathom "newMeeting" webhook, verifies the
// signature, converts the structured transcript to plain text,
// and creates a new Meeting Notes record in Airtable.
//
// Fathom docs: https://developers.fathom.ai/webhooks
// Payload:     https://developers.fathom.ai/api-reference/webhook-payloads/new-meeting-content-ready
//
// Required env vars:
//   FATHOM_WEBHOOK_SECRET  — the whsec_... secret shown when you create the webhook
// ─────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { createRecord, tables } from "@/lib/airtable";

// ─── Fathom payload types ──

interface FathomSpeaker {
  display_name: string;
  matched_calendar_invitee_email?: string | null;
}

interface FathomTranscriptLine {
  speaker: FathomSpeaker;
  text: string;
  timestamp: string; // "HH:MM:SS"
}

interface FathomCalendarInvitee {
  name: string;
  email: string;
  is_external: boolean;
  matched_speaker_display_name?: string | null;
}

interface FathomPayload {
  title: string;
  meeting_title: string | null;
  recording_id: number;
  url: string;
  share_url: string;
  created_at: string;
  scheduled_start_time: string;
  scheduled_end_time: string;
  recording_start_time: string;
  recording_end_time: string;
  calendar_invitees_domains_type: "only_internal" | "one_or_more_external";
  transcript_language: string;
  calendar_invitees: FathomCalendarInvitee[];
  recorded_by: { name: string; email: string };
  transcript: FathomTranscriptLine[] | null;
  default_summary?: {
    template_name: string;
    markdown_formatted: string;
  };
  action_items?: {
    description: string;
    assignee?: { name: string; email: string } | null;
    recording_timestamp?: string;
  }[] | null;
}

// ─── Signature verification ──

function verifyFathomSignature(
  secret: string,
  headers: Headers,
  rawBody: string,
): boolean {
  const webhookId = headers.get("webhook-id");
  const webhookTimestamp = headers.get("webhook-timestamp");
  const webhookSignature = headers.get("webhook-signature");

  if (!webhookId || !webhookTimestamp || !webhookSignature) return false;

  // Replay attack guard: reject if timestamp is > 5 minutes old
  const timestamp = parseInt(webhookTimestamp, 10);
  const now = Math.floor(Date.now() / 1000);
  if (Math.abs(now - timestamp) > 300) return false;

  // Build signed content: id.timestamp.body
  const signedContent = `${webhookId}.${webhookTimestamp}.${rawBody}`;

  // Decode the secret (strip the "whsec_" prefix)
  const secretBytes = Buffer.from(secret.replace(/^whsec_/, ""), "base64");

  // HMAC-SHA256 → base64
  const expected = crypto
    .createHmac("sha256", secretBytes)
    .update(signedContent)
    .digest("base64");

  // The header may contain multiple space-delimited signatures (e.g. "v1,abc v1,def")
  const signatures = webhookSignature.split(" ").map((s) => {
    const parts = s.split(",");
    return parts.length > 1 ? parts[1] : parts[0];
  });

  return signatures.some((sig) => {
    try {
      return crypto.timingSafeEqual(
        Buffer.from(expected),
        Buffer.from(sig),
      );
    } catch {
      return false;
    }
  });
}

// ─── Helpers ──

/** Convert Fathom's structured transcript array to a readable plain-text string. */
function transcriptToText(lines: FathomTranscriptLine[]): string {
  return lines
    .map((l) => `[${l.timestamp}] ${l.speaker.display_name}: ${l.text}`)
    .join("\n");
}

/** Infer meeting duration in minutes from start/end timestamps. */
function durationMinutes(start: string, end: string): number {
  const diff = new Date(end).getTime() - new Date(start).getTime();
  return Math.round(diff / 60_000);
}

/** Extract the YYYY-MM-DD date from an ISO datetime string. */
function toDate(iso: string): string {
  return iso.split("T")[0];
}

/**
 * Guess the Category from the meeting title.
 * Falls back to "Customer Call" for external meetings.
 */
function inferCategory(
  title: string,
  domainsType: FathomPayload["calendar_invitees_domains_type"],
): string {
  const t = title.toLowerCase();
  if (t.includes("standup") || t.includes("stand-up") || t.includes("daily")) return "Standup";
  if (t.includes("retro") || t.includes("retrospective")) return "Retro";
  if (t.includes("planning") || t.includes("sprint") || t.includes("roadmap")) return "Planning";
  if (t.includes("workshop") || t.includes("presentation") || t.includes("demo")) return "Presentation";
  if (domainsType === "only_internal") return "Planning";
  return "Customer Call";
}

// ─── Route handler ──

export async function POST(req: NextRequest): Promise<NextResponse> {
  const secret = process.env.FATHOM_WEBHOOK_SECRET;

  // Read raw body first (needed for signature verification)
  const rawBody = await req.text();

  // Verify signature if secret is configured (skip in dev if not set)
  if (secret) {
    const valid = verifyFathomSignature(secret, req.headers, rawBody);
    if (!valid) {
      console.warn("[fathom-webhook] Signature verification failed");
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }
  } else {
    console.warn("[fathom-webhook] FATHOM_WEBHOOK_SECRET not set — skipping signature verification");
  }

  let payload: FathomPayload;
  try {
    payload = JSON.parse(rawBody) as FathomPayload;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  // Build the plain-text transcript
  const transcriptText = payload.transcript
    ? transcriptToText(payload.transcript)
    : null;

  // Build the attendees string from calendar_invitees
  const attendees = payload.calendar_invitees
    .map((i) => `${i.name} <${i.email}>`)
    .join(", ");

  // Infer category from title
  const meetingTitle = payload.meeting_title ?? payload.title;
  const category = inferCategory(
    meetingTitle,
    payload.calendar_invitees_domains_type,
  );

  // Calculate duration
  const duration = durationMinutes(
    payload.recording_start_time,
    payload.recording_end_time,
  );

  // Build a short context note from Fathom's default summary (if available)
  const fathomSummaryNote = payload.default_summary?.markdown_formatted
    ? `[Fathom summary]\n${payload.default_summary.markdown_formatted}`
    : null;

  // Create the Meeting Notes record in ThrottlInternal
  const record = await createRecord(tables.meetingNotes(), {
    Name: meetingTitle,
    Transcript: transcriptText ?? "",
    Date: toDate(payload.recording_start_time),
    Category: category,
    "Post-Mortem Status": "Not Analyzed",
    Attendees: attendees,
    Duration: duration,
    // Store the Fathom recording URL in the Summary field as a placeholder
    // until the AI analysis runs. This gives the team a quick link back.
    Summary: fathomSummaryNote ?? `Fathom recording: ${payload.share_url}`,
  });

  console.log(`[fathom-webhook] Created Meeting Notes record ${record.id} for "${meetingTitle}"`);

  // Fathom expects any 2xx response to acknowledge receipt
  return NextResponse.json({ received: true, recordId: record.id }, { status: 200 });
}
