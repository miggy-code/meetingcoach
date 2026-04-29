// ─────────────────────────────────────────────────────────────
// Server-side data-fetching helpers.
// All functions return domain types (lib/types.ts), not raw Airtable shapes.
// ─────────────────────────────────────────────────────────────

import "server-only";
import { listRecords, getRecord, tables, type AirtableRecord } from "./airtable";
import {
  type MeetingNote,
  type Goal,
  type Project,
  type DashboardData,
  type NextStepItem,
  type ScoreBreakdown,
  type SpeakerMap,
  type HumanCorrection,
  type AirtableCollaborator,
  type AirtableAttachment,
} from "./types";
import {
  type Category,
  type PostMortemStatus,
  type Confidence,
  type ObjectionType,
  type BuyingSignalType,
  type GoalStatus,
  type Priority,
  type ProjectStatus,
  OBJECTION_TYPES,
  BUYING_SIGNAL_TYPES,
} from "./constants";
import { tryParseJSON, thisWeekRange, thisMonthRange, isInRange, last14DaysRange } from "./utils";

// ─── Raw field shapes (what Airtable returns) ──

interface MeetingNotesFields {
  Name?: string;
  Transcript?: string;
  Date?: string;
  Category?: Category;
  "Post-Mortem Status"?: PostMortemStatus;
  "Analysis Confidence"?: Confidence;
  Summary?: string;
  "Next Steps"?: string;
  "Improvement Areas"?: string;
  "Follow-up Email"?: string;
  Attendees?: string;
  "Speaker Map"?: string;
  Objections?: ObjectionType[];
  "Buying Signals"?: BuyingSignalType[];
  "Meeting Score"?: number;
  "Score Breakdown"?: string;
  Duration?: number;
  "Last Analyzed At"?: string;
  "Human Corrections"?: string;
  "Related Goals"?: string[];
  "Related Project"?: string[];
  Assignee?: AirtableCollaborator;
  Status?: string;
  Attachments?: AirtableAttachment[];
}

interface GoalFields {
  "Goal name"?: string;
  Status?: GoalStatus;
  Priority?: Priority;
  Owner?: AirtableCollaborator;
  "Source Meeting"?: string[];
  Confidence?: Confidence;
  Notes?: string;
  "Due Date"?: string;
}

interface ProjectFields {
  "Project name"?: string;
  Status?: ProjectStatus;
  Priority?: Priority;
  Owner?: AirtableCollaborator;
  "Related Meetings"?: string[];
  Notes?: string;
}

// ─── Normalizers ──

function normalizeMeeting(r: AirtableRecord<MeetingNotesFields>): MeetingNote {
  const f = r.fields;
  return {
    id: r.id,
    name: f.Name ?? "(untitled)",
    transcript: f.Transcript ?? null,
    date: f.Date ?? null,
    category: f.Category ?? null,
    postMortemStatus: f["Post-Mortem Status"] ?? null,
    analysisConfidence: f["Analysis Confidence"] ?? null,
    summary: f.Summary ?? null,
    nextSteps: tryParseJSON<NextStepItem[]>(f["Next Steps"], []),
    improvementAreas: f["Improvement Areas"] ?? null,
    followupEmail: f["Follow-up Email"] ?? null,
    attendees: f.Attendees ?? null,
    speakerMap: tryParseJSON<SpeakerMap>(f["Speaker Map"], {}),
    objections: f.Objections ?? [],
    buyingSignals: f["Buying Signals"] ?? [],
    meetingScore: f["Meeting Score"] ?? null,
    scoreBreakdown: tryParseJSON<ScoreBreakdown | null>(f["Score Breakdown"], null),
    duration: f.Duration ?? null,
    lastAnalyzedAt: f["Last Analyzed At"] ?? null,
    humanCorrections: tryParseJSON<HumanCorrection[]>(f["Human Corrections"], []),
    relatedGoalIds: f["Related Goals"] ?? [],
    relatedProjectIds: f["Related Project"] ?? [],
    assignee: f.Assignee ?? null,
    status: f.Status ?? null,
    attachments: f.Attachments ?? [],
  };
}

function normalizeGoal(r: AirtableRecord<GoalFields>): Goal {
  const f = r.fields;
  return {
    id: r.id,
    name: f["Goal name"] ?? "(untitled)",
    status: f.Status ?? null,
    priority: f.Priority ?? null,
    owner: f.Owner ?? null,
    sourceMeetingIds: f["Source Meeting"] ?? [],
    confidence: f.Confidence ?? null,
    notes: f.Notes ?? null,
    dueDate: f["Due Date"] ?? null,
  };
}

function normalizeProject(r: AirtableRecord<ProjectFields>): Project {
  const f = r.fields;
  return {
    id: r.id,
    name: f["Project name"] ?? "(untitled)",
    status: f.Status ?? null,
    priority: f.Priority ?? null,
    owner: f.Owner ?? null,
    relatedMeetingIds: f["Related Meetings"] ?? [],
    notes: f.Notes ?? null,
  };
}

// ─── Public queries ──

export async function fetchAllMeetings(): Promise<MeetingNote[]> {
  const records = await listRecords<MeetingNotesFields>(tables.meetingNotes(), {
    sort: [{ field: "Date", direction: "desc" }],
  });
  return records.map(normalizeMeeting);
}

export async function fetchMeeting(id: string): Promise<MeetingNote> {
  const r = await getRecord<MeetingNotesFields>(tables.meetingNotes(), id);
  return normalizeMeeting(r);
}

// NOTE: We don't filter goals by linked-record formula because Airtable's
// {LinkedField} returns primary-field text, not record IDs. Use the meeting's
// `relatedGoalIds` array (already populated by Airtable) and call fetchGoalsByIds.

export async function fetchGoalsByIds(ids: string[]): Promise<Goal[]> {
  if (ids.length === 0) return [];
  const formula = `OR(${ids.map((id) => `RECORD_ID()='${id}'`).join(",")})`;
  const records = await listRecords<GoalFields>(tables.goalsTracker(), {
    filterByFormula: formula,
  });
  return records.map(normalizeGoal);
}

export async function fetchProjectsByIds(ids: string[]): Promise<Project[]> {
  if (ids.length === 0) return [];
  const formula = `OR(${ids.map((id) => `RECORD_ID()='${id}'`).join(",")})`;
  const records = await listRecords<ProjectFields>(tables.projects(), {
    filterByFormula: formula,
  });
  return records.map(normalizeProject);
}

// ─── Dashboard aggregation ──

export async function fetchDashboardData(): Promise<DashboardData> {
  const all = await fetchAllMeetings();
  const week = thisWeekRange();
  const month = thisMonthRange();
  const last14 = last14DaysRange();

  const inLast14 = all.filter((m) => isInRange(m.date, last14));

  // Sort: Pending (Not Analyzed with transcript) first, then by Date desc
  inLast14.sort((a, b) => {
    const aPending =
      a.postMortemStatus === "Not Analyzed" && !!a.transcript ? 0 : 1;
    const bPending =
      b.postMortemStatus === "Not Analyzed" && !!b.transcript ? 0 : 1;
    if (aPending !== bPending) return aPending - bPending;
    return (b.date ?? "").localeCompare(a.date ?? "");
  });

  const meetingsThisWeek = all.filter((m) => isInRange(m.date, week));
  const analyzedThisWeek = meetingsThisWeek.filter(
    (m) => m.postMortemStatus === "Complete",
  );
  const pending = all.filter(
    (m) => m.postMortemStatus === "Not Analyzed" && !!m.transcript,
  );
  const analyzedScores = analyzedThisWeek
    .map((m) => m.meetingScore)
    .filter((s): s is number => typeof s === "number");
  const avgScore =
    analyzedScores.length > 0
      ? analyzedScores.reduce((a, b) => a + b, 0) / analyzedScores.length
      : null;

  // Monthly trends
  const inMonth = all.filter((m) => isInRange(m.date, month));
  const objections = Object.fromEntries(
    OBJECTION_TYPES.map((o) => [o, 0]),
  ) as Record<ObjectionType, number>;
  const buyingSignals = Object.fromEntries(
    BUYING_SIGNAL_TYPES.map((s) => [s, 0]),
  ) as Record<BuyingSignalType, number>;
  for (const m of inMonth) {
    for (const o of m.objections) objections[o] = (objections[o] ?? 0) + 1;
    for (const s of m.buyingSignals)
      buyingSignals[s] = (buyingSignals[s] ?? 0) + 1;
  }

  const reviewQueueCount = all.filter(
    (m) =>
      m.analysisConfidence === "Low" || m.postMortemStatus === "Needs Review",
  ).length;

  return {
    meetings: inLast14,
    allMeetings: all,
    weekStats: {
      meetingsThisWeek: meetingsThisWeek.length,
      analyzed: analyzedThisWeek.length,
      pending: pending.length,
      avgScore,
    },
    monthlyTrends: { objections, buyingSignals },
    reviewQueueCount,
  };
}
