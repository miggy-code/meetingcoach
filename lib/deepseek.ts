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
});

// ─── Prompts ──

const ANALYZE_SYSTEM_PROMPT = `You are an expert meeting analyst. Given a transcript and a category, you produce a structured post-mortem.

You MUST output valid JSON matching this exact shape:

{
  "summary": "3-5 sentence executive summary",
  "meetingScore": <integer 0-10, equal to sum of scoreBreakdown values>,
  "scoreBreakdown": {
    "nextStepsClarity": <0-3>,        // Were action items concrete and assigned?
    "objectionsAddressed": <0-2>,      // Were objections handled? (0 if internal/no objections)
    "participationBalance": <0-2>,     // Did all attendees contribute?
    "timeEfficiency": <0-2>,           // Was time well-used, minimal looping?
    "decisionQuality": <0-1>           // Were decisions made and recorded?
  },
  "analysisConfidence": "High" | "Medium" | "Low",
  "nextSteps": [
    { "description": "...", "owner": "name or null", "confidence": "High" | "Medium" | "Low" }
  ],
  "improvementAreas": "Bullet list of process improvements (newline-separated). Empty string if not applicable.",
  "objections": [<from: ${OBJECTION_TYPES.join(", ")}>],
  "buyingSignals": [<from: ${BUYING_SIGNAL_TYPES.join(", ")}>],
  "followupEmail": "<draft email body>" | null,
  "attendees": "Comma-separated names",
  "speakerMap": { "Speaker 1": "Name", "Speaker 2": "Name" },
  "duration": <minutes, optional>
}

Rules by category:
- Customer Call / Presentation: include objections, buyingSignals, followupEmail. Score objectionsAddressed normally.
- Planning / Standup / Retro: objections=[], buyingSignals=[], followupEmail=null. objectionsAddressed=0.
- Standup: improvementAreas="" (do not analyze).
- Planning / Retro / Customer Call: include improvementAreas.

Confidence guidance:
- Low: transcript is short, garbled, missing speaker info, or the meeting type is ambiguous
- Medium: transcript is clear but you had to infer some details
- High: transcript is detailed, speakers are identified, and analysis is straightforward

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
