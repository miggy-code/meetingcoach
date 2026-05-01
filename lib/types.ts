// ─────────────────────────────────────────────────────────────
// TypeScript types mirroring the Airtable schema.
// Verified 2026-04-30 against ThrottlInternal base appZBVnpJImiNvIHM.
// ─────────────────────────────────────────────────────────────

import type {
  Category,
  PostMortemStatus,
  Confidence,
  ObjectionType,
  BuyingSignalType,
  GoalStatus,
  Priority,
  ProjectStatus,
  ScoreComponentKey,
  MeetingType,
  FunnelStage,
  MeetingOutcome,
  LossReason,
} from "./constants";

// ─── Airtable raw shapes (after our normalization layer) ──

export type AirtableCollaborator = {
  id: string;
  email: string;
  name: string;
};

export type AirtableAttachment = {
  id: string;
  url: string;
  filename: string;
  size: number;
  type: string;
};

// ─── Domain types ──

export interface NextStepItem {
  description: string;
  owner?: string | null;
  confidence?: Confidence;
  goalId?: string | null; // populated if promoted to Goals Tracker
}

export interface ScoreBreakdown {
  nextStepsClarity: number;
  objectionsAddressed: number;
  participationBalance: number;
  timeEfficiency: number;
  decisionQuality: number;
}

export interface SpeakerMap {
  [speakerLabel: string]: string;
}

export interface HumanCorrection {
  field: string;
  before: unknown;
  after: unknown;
  by?: string;
  at: string; // ISO timestamp
}

// ─── Meeting Notes record ──

export interface MeetingNote {
  id: string;
  name: string;
  transcript: string | null;
  date: string | null; // YYYY-MM-DD
  category: Category | null;
  postMortemStatus: PostMortemStatus | null;
  analysisConfidence: Confidence | null;
  summary: string | null;
  nextSteps: NextStepItem[]; // parsed from JSON
  improvementAreas: string | null;
  followupEmail: string | null;
  attendees: string | null;
  speakerMap: SpeakerMap;
  objections: ObjectionType[];
  buyingSignals: BuyingSignalType[];
  meetingScore: number | null;
  scoreBreakdown: ScoreBreakdown | null;
  duration: number | null;
  lastAnalyzedAt: string | null;
  humanCorrections: HumanCorrection[];
  relatedGoalIds: string[];
  relatedProjectIds: string[];
  assignee: AirtableCollaborator | null;
  status: string | null; // existing Todo/In progress/Done
  attachments: AirtableAttachment[];
  // ─── Sales / pipeline fields ──
  meetingType: MeetingType | null;
  funnelStage: FunnelStage | null;
  offerPitched: string | null;
  outcome: MeetingOutcome | null;
  lossReason: LossReason | null;
  biggestOpportunity: string | null;
  biggestRisk: string | null;
  // ─── AI-enriched fields ──
  perSpeakerStats: string | null; // JSON string — parsed downstream if needed
  keyMoments: string | null;      // JSON string — parsed downstream if needed
}

// ─── Goal record ──

export interface Goal {
  id: string;
  name: string;
  status: GoalStatus | null;
  priority: Priority | null;
  owner: AirtableCollaborator | null;
  sourceMeetingIds: string[];
  confidence: Confidence | null;
  notes: string | null;
  dueDate: string | null;
}

// ─── Project record ──

export interface Project {
  id: string;
  name: string;
  status: ProjectStatus | null;
  priority: Priority | null;
  owner: AirtableCollaborator | null;
  relatedMeetingIds: string[];
  notes: string | null;
}

// ─── AI analysis result (the structured output of /api/analyze) ──

export interface AnalysisResult {
  summary: string;
  meetingScore: number;
  scoreBreakdown: ScoreBreakdown;
  analysisConfidence: Confidence;
  nextSteps: NextStepItem[];
  improvementAreas: string;
  objections: ObjectionType[];
  buyingSignals: BuyingSignalType[];
  followupEmail: string | null; // null when category != Customer Call
  attendees: string;
  speakerMap: SpeakerMap;
  duration?: number; // estimated from transcript if not set
}

// ─── Dashboard data (aggregated for the page) ──

export interface DashboardData {
  meetings: MeetingNote[]; // last 14 days
  allMeetings: MeetingNote[]; // full set, lazy-loaded
  weekStats: {
    meetingsThisWeek: number;
    analyzed: number;
    pending: number;
    avgScore: number | null;
  };
  monthlyTrends: {
    objections: Record<ObjectionType, number>;
    buyingSignals: Record<BuyingSignalType, number>;
  };
  reviewQueueCount: number;
}

// ─── Score component utility ──

export type ComponentScore = {
  key: ScoreComponentKey;
  label: string;
  score: number;
  max: number;
};
