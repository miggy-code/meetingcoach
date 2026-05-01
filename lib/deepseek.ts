// ─────────────────────────────────────────────────────────────
// DeepSeek client. OpenAI-compatible API.
// Server-only — never import from a client component.
// ─────────────────────────────────────────────────────────────

import "server-only";
import OpenAI from "openai";
import { z } from "zod";
import {
  CATEGORIES,
  CONFIDENCE_LEVELS,
  OBJECTION_TYPES,
  BUYING_SIGNAL_TYPES,
  MEETING_TYPES,
  FUNNEL_STAGES,
  MEETING_OUTCOMES,
  LOSS_REASONS,
} from "./constants";
import type { AnalysisResult } from "./types";

function env(name: string, fallback?: string): string {
  const v = process.env[name] ?? fallback;
  if (!v) throw new Error(`Missing env var: ${name}`);
  return v;
}

export const deepseek = new OpenAI({
  apiKey: env("DEEPSEEK_API_KEY"),
  baseURL: env("DEEPSEEK_BASE_URL", "https://api.deepseek.com"),
});

export const DEEPSEEK_MODEL = () => env("DEEPSEEK_MODEL", "deepseek-chat");

// ─── Zod schemas for AI structured output ──

export const NextStepItemSchema = z.object({
  description: z.string().min(1),
  owner: z.string().nullable().optional(),
  confidence: z.enum(CONFIDENCE_LEVELS).optional(),
});

export const ScoreBreakdownSchema = z.object({
  nextStepsClarity: z.number().min(0).max(3),
  objectionsAddressed: z.number().min(0).max(2),
  participationBalance: z.number().min(0).max(2),
  timeEfficiency: z.number().min(0).max(2),
  decisionQuality: z.number().min(0).max(1),
});

export const AnalysisResultSchema = z.object({
  summary: z.string().min(1),
  meetingScore: z.number().min(0).max(10),
  scoreBreakdown: ScoreBreakdownSchema,
  analysisConfidence: z.enum(CONFIDENCE_LEVELS),
  nextSteps: z.array(NextStepItemSchema),
  improvementAreas: z.string(),
  objections: z.array(z.enum(OBJECTION_TYPES)),
  buyingSignals: z.array(z.enum(BUYING_SIGNAL_TYPES)),
  followupEmail: z.string().nullable(),
  attendees: z.string(),
  speakerMap: z.record(z.string(), z.string()),
  duration: z.number().optional(),
  // ─── Sales / pipeline fields ──
  meetingType: z.enum(MEETING_TYPES).nullable(),
  funnelStage: z.enum(FUNNEL_STAGES).nullable(),
  offerPitched: z.string().nullable(),
  outcome: z.enum(MEETING_OUTCOMES).nullable(),
  lossReason: z.enum(LOSS_REASONS).nullable(),
  biggestOpportunity: z.string().nullable(),
  biggestRisk: z.string().nullable(),
  // ─── AI-enriched fields ──
  perSpeakerStats: z.string().nullable(), // JSON string
  keyMoments: z.string().nullable(),      // JSON string
});

// ─── Prompts ──

const ANALYZE_SYSTEM_PROMPT = `You are an elite, rigorous sales coach and meeting analyst for Throttl, an AI advisory firm. You analyze transcripts with a critical eye, looking for missed opportunities, weak framing, and poor objection handling. You do not sugarcoat.

You MUST output valid JSON matching this exact shape:

{
  "summary": "3-5 sentence executive summary. Focus on business outcomes, not just a play-by-play.",
  "meetingScore": <integer 0-10, equal to sum of scoreBreakdown values>,
  "scoreBreakdown": {
    "nextStepsClarity": <0-3>,        // Were action items concrete, assigned, and time-bound? Be strict.
    "objectionsAddressed": <0-2>,      // Were objections handled effectively? (0 if internal/no objections)
    "participationBalance": <0-2>,     // Did the prospect speak enough? Did Throttl talk too much?
    "timeEfficiency": <0-2>,           // Was time well-used, minimal looping?
    "decisionQuality": <0-1>           // Were decisions made and recorded?
  },
  "analysisConfidence": "High" | "Medium" | "Low",
  "nextSteps": [
    { "description": "...", "owner": "name or null", "confidence": "High" | "Medium" | "Low" }
  ],
  "improvementAreas": "Bullet list of rigorous coaching feedback. Point out specific moments where the pitch was weak, jargon was used, or discovery questions were missed. Be highly critical.",
  "objections": [<from: ${OBJECTION_TYPES.join(", ")}>],
  "buyingSignals": [<from: ${BUYING_SIGNAL_TYPES.join(", ")}>],
  "followupEmail": "<draft email body>" | null,
  "attendees": "Comma-separated names",
  "speakerMap": { "Speaker 1": "Name", "Speaker 2": "Name" },
  "duration": <minutes, optional>,
  
  // Sales / Pipeline Fields
  "meetingType": <from: ${MEETING_TYPES.join(", ")} or null>,
  "funnelStage": <from: ${FUNNEL_STAGES.join(", ")} or null>,
  "offerPitched": "Name of the offer pitched (e.g., 'Free AI Workshop - 60 min', 'AI Executive Workshop') or null",
  "outcome": <from: ${MEETING_OUTCOMES.join(", ")} or null>,
  "lossReason": <from: ${LOSS_REASONS.join(", ")} or null if not lost>,
  "biggestOpportunity": "1-2 sentences on the clearest path to revenue or expansion.",
  "biggestRisk": "1-2 sentences on the biggest threat to the deal (e.g., 'No access to economic buyer', 'Status quo bias').",
  
  // AI-Enriched Fields (Must be stringified JSON)
  "perSpeakerStats": "[{\\"speaker\\": \\"Name\\", \\"talkPercentage\\": 45, \\"longestMonologue\\": \\"2m 15s\\", \\"questionsAsked\\": 3}]",
  "keyMoments": "[{\\"timestamp\\": \\"12:30\\", \\"description\\": \\"Prospect revealed budget constraint\\", \\"type\\": \\"Objection\\"}]"
}

Rules by category:
- Customer Call / Presentation: include objections, buyingSignals, followupEmail, sales/pipeline fields. Score objectionsAddressed normally.
- Planning / Standup / Retro: objections=[], buyingSignals=[], followupEmail=null, sales fields=null. objectionsAddressed=0.
- Standup: improvementAreas="" (do not analyze).
- Planning / Retro / Customer Call: include improvementAreas.

Coaching Rigor:
- Throttl's ICP hates technical jargon. If the transcript contains "LLM", "neural networks", or "machine learning" from the Throttl side, penalize the score and call it out in improvementAreas.
- If the prospect spoke less than 40% of the time on a Discovery call, penalize participationBalance heavily.
- If next steps are vague (e.g., "We will touch base next week"), score nextStepsClarity as 0 or 1.

Output ONLY the JSON object. No commentary.`;

// ─── Public: analyze ──

export async function analyzeTranscript(args: {
  transcript: string;
  category: (typeof CATEGORIES)[number];
  knownAttendees?: string;
  meetingName: string;
}): Promise<AnalysisResult> {
  const userPrompt = [
    `Meeting: ${args.meetingName}`,
    `Category: ${args.category}`,
    args.knownAttendees ? `Known attendees: ${args.knownAttendees}` : null,
    "",
    "Transcript:",
    args.transcript,
  ]
    .filter(Boolean)
    .join("\n");

  const completion = await deepseek.chat.completions.create({
    model: DEEPSEEK_MODEL(),
    messages: [
      { role: "system", content: ANALYZE_SYSTEM_PROMPT },
      { role: "user", content: userPrompt },
    ],
    response_format: { type: "json_object" },
    temperature: 0.2,
  });

  const raw = completion.choices[0]?.message?.content ?? "{}";
  const parsed = JSON.parse(raw);
  const validated = AnalysisResultSchema.parse(parsed);
  return validated;
}

// ─── Public: regenerate follow-up email ──

export async function regenerateFollowupEmail(args: {
  transcript: string;
  summary: string;
  nextSteps: { description: string; owner?: string | null }[];
  meetingName: string;
}): Promise<string> {
  const system = `You write concise, warm, professional follow-up emails for sales calls. 4-6 short paragraphs. Reference specific moments. Restate next steps. Sign off with a clear ask.`;
  const user = [
    `Meeting: ${args.meetingName}`,
    `Summary: ${args.summary}`,
    `Next steps:`,
    ...args.nextSteps.map(
      (s, i) =>
        `${i + 1}. ${s.description}${s.owner ? ` (owner: ${s.owner})` : ""}`,
    ),
    "",
    "Transcript context (last portion):",
    args.transcript.slice(-3000),
  ].join("\n");

  const completion = await deepseek.chat.completions.create({
    model: DEEPSEEK_MODEL(),
    messages: [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
    temperature: 0.5,
  });

  return completion.choices[0]?.message?.content ?? "";
}
