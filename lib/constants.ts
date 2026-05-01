// ─────────────────────────────────────────────────────────────
// Single source of truth for enum values that exist in Airtable.
// Edit Airtable single-select options? Update these mirrors.
// ─────────────────────────────────────────────────────────────

export const CATEGORIES = [
  "Customer Call",
  "Presentation",
  "Planning",
  "Standup",
  "Retro",
] as const;
export type Category = (typeof CATEGORIES)[number];

export const POST_MORTEM_STATUSES = [
  "Not Analyzed",
  "Complete",
  "Needs Review",
] as const;
export type PostMortemStatus = (typeof POST_MORTEM_STATUSES)[number];

export const CONFIDENCE_LEVELS = ["High", "Medium", "Low"] as const;
export type Confidence = (typeof CONFIDENCE_LEVELS)[number];

export const OBJECTION_TYPES = [
  "Price",
  "Timing/Budget",
  "Competition",
  "Product Fit",
  "Authority",
  "Implementation Risk",
  "Status Quo Bias",
  "Other",
] as const;
export type ObjectionType = (typeof OBJECTION_TYPES)[number];

export const BUYING_SIGNAL_TYPES = [
  "Explicit Need",
  "Budget Authority",
  "Timeline/Urgency",
  "Pain Acknowledged",
  "Champion Identified",
  "Asked About Pricing",
  "Asked About Implementation",
  "Referenced Competitor",
] as const;
export type BuyingSignalType = (typeof BUYING_SIGNAL_TYPES)[number];

export const GOAL_STATUSES = [
  "Todo",
  "In progress",
  "Done",
  "Blocked",
] as const;
export type GoalStatus = (typeof GOAL_STATUSES)[number];

export const PRIORITIES = ["Low", "Medium", "High", "Critical"] as const;
export type Priority = (typeof PRIORITIES)[number];

export const PROJECT_STATUSES = [
  "Active",
  "Planning",
  "On hold",
  "Done",
  "Cancelled",
] as const;
export type ProjectStatus = (typeof PROJECT_STATUSES)[number];

// ─── Sales / pipeline enums ──

export const MEETING_TYPES = [
  "Discovery",
  "Workshop Pitch",
  "Integration Pitch",
  "Workshop Delivery",
  "Check-in",
  "Internal",
] as const;
export type MeetingType = (typeof MEETING_TYPES)[number];

export const FUNNEL_STAGES = [
  "Prospect",
  "Discovery",
  "Proposal",
  "Negotiation",
  "Closed Won",
  "Closed Lost",
] as const;
export type FunnelStage = (typeof FUNNEL_STAGES)[number];

export const MEETING_OUTCOMES = [
  "Positive",
  "Neutral",
  "Negative",
  "No Show",
] as const;
export type MeetingOutcome = (typeof MEETING_OUTCOMES)[number];

export const LOSS_REASONS = [
  "Price",
  "Timing",
  "Competition",
  "No Budget",
  "Not a Fit",
  "Went Dark",
] as const;
export type LossReason = (typeof LOSS_REASONS)[number];

export const OFFER_TYPES = [
  "Free AI Workshop – 30 min",
  "Free AI Workshop – 60 min",
  "AI Executive Workshop",
  "AI Transformation & Integration",
] as const;
export type OfferType = (typeof OFFER_TYPES)[number];

export const OFFER_STATUSES = [
  "Draft",
  "Presented",
  "Accepted",
  "Rejected",
  "Closed Won",
  "Closed Lost",
] as const;
export type OfferStatus = (typeof OFFER_STATUSES)[number];

export const MEETING_LEADS = ["Gabriel", "Miguel", "Both"] as const;
export type MeetingLead = (typeof MEETING_LEADS)[number];

// ─── Coaching skill dimensions ──
export const SKILL_DIMENSIONS = [
  "Discovery Questions",
  "Objection Handling",
  "Offer Clarity",
  "Talk Ratio",
  "Technical Jargon Control",
  "Closing / Next Step Commitment",
  "Listening & Responsiveness",
  "Energy & Presence",
] as const;
export type SkillDimension = (typeof SKILL_DIMENSIONS)[number];

// ─── Categories that hide signals/objections (per spec) ──
export const SIGNAL_HIDDEN_CATEGORIES: Category[] = [
  "Planning",
  "Standup",
  "Retro",
];

// ─── Categories that show Improvement Areas (per spec) ──
export const IMPROVEMENT_VISIBLE_CATEGORIES: Category[] = [
  "Planning",
  "Retro",
  "Customer Call",
];

// ─── Score component weights (max points) ──
export const SCORE_COMPONENTS = {
  nextStepsClarity: { label: "Next Steps Clarity", max: 3 },
  objectionsAddressed: { label: "Objections Addressed", max: 2 },
  participationBalance: { label: "Participation Balance", max: 2 },
  timeEfficiency: { label: "Time Efficiency", max: 2 },
  decisionQuality: { label: "Decision Quality", max: 1 },
} as const;

export type ScoreComponentKey = keyof typeof SCORE_COMPONENTS;

// ─── Score color thresholds ──
export function scoreColor(score: number | null | undefined): "green" | "amber" | "red" | "gray" {
  if (score == null) return "gray";
  if (score >= 8) return "green";
  if (score >= 6) return "amber";
  return "red";
}
