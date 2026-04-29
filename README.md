# Meeting Intelligence

A Next.js 16 dashboard that turns Airtable into the AI brain of your business. Reads meeting transcripts from Airtable, runs DeepSeek analysis (scoring, signals, objections, next steps, follow-up emails), and writes results back. Built to be the first of several frontend interaction layers on top of an Airtable knowledge base.

## What it does

**Layer 1 — Dashboard (always visible):**
- Hero stats: Meetings This Week / Analyzed / Pending / Avg Score
- 14-day Meeting Feed with status icons, score color-coding, action-item counts, View All toggle
- This-month Trend Panels (objections + buying signals bar charts)
- Review Queue callout for low-confidence meetings

**Layer 2 — Detail (inline expand on click):**
- Score Sheet with component breakdown (Next Steps Clarity / Objections Addressed / Participation Balance / Time Efficiency / Decision Quality)
- Executive summary + confidence badge
- Next Steps with one-click "Promote to Goal"
- Improvement Areas (category-aware)
- Linked Goals + Related Project (live from Airtable)
- Objections + Buying Signals pills (hidden for Planning/Standup/Retro)
- Follow-up Email draft with copy + regenerate (Customer Calls only)
- Transcript collapsible
- Confidence + corrections footer

## Stack

- Next.js 16 (App Router, React 19, Turbopack)
- TypeScript, Tailwind CSS v4
- Airtable REST API (server-only client)
- DeepSeek API via OpenAI-compatible SDK
- SWR for client refresh after mutations
- Zod for AI response validation

## Setup

### 1. Install

```bash
npm install
```

### 2. Configure environment

Copy the template and fill in real values:

```bash
cp .env.example .env.local
```

Required keys:

| Variable | Where to get it |
|---|---|
| `AIRTABLE_API_KEY` | https://airtable.com/create/tokens — needs `data.records:read`, `data.records:write`, `schema.bases:read` |
| `AIRTABLE_BASE_ID` | Already set: `appfS9ODVKZ2XEATW` (ThrottlInternal). Change if you fork. |
| `AIRTABLE_TABLE_MEETING_NOTES` | Pre-filled: `tbluVFyMX5uocgfJ6` |
| `AIRTABLE_TABLE_GOALS_TRACKER` | Pre-filled: `tblPrGNhmdui0U8xt` |
| `AIRTABLE_TABLE_PROJECTS` | Pre-filled: `tblFuc49lUWQOLkfm` |
| `DEEPSEEK_API_KEY` | https://platform.deepseek.com/api_keys |
| `DEEPSEEK_BASE_URL` | `https://api.deepseek.com` (default) |
| `DEEPSEEK_MODEL` | `deepseek-chat` (default; `deepseek-reasoner` for harder cases) |

### 3. Run

```bash
npm run dev
```

Visit http://localhost:3000.

## Deploy to Vercel

```bash
vercel
```

Then set the same env vars in your Vercel project settings (Settings → Environment Variables). Production deploy is one click after that.

The serverless functions for `/api/analyze` and `/api/email` need at least 60s execution time — Vercel Pro is recommended for production. The Hobby tier limits to 10s which may be tight for long transcripts.

## Architecture

```
app/
├── page.tsx                          Dashboard (Server Component)
├── layout.tsx                        Root layout, font, metadata
├── globals.css                       Tailwind v4 + design tokens
├── actions.ts                        Server Actions (write paths)
└── api/
    ├── analyze/route.ts              POST { meetingId } → run AI analysis
    ├── email/route.ts                POST { meetingId } → regenerate email
    ├── corrections/route.ts          POST { meetingId, field, ... } → log correction
    ├── promote/route.ts              POST { meetingId, step } → create Goal
    └── meeting/[id]/route.ts         GET → full meeting + linked goals + project

components/
├── dashboard/                        Layer 1 (HeroStats, MeetingFeed, MeetingRow, TrendPanels, ReviewQueue)
├── detail/                           Layer 2 (DetailPanel + 11 sub-components)
└── ui/                               Primitives (Badges, ProgressBar, Collapsible)

lib/
├── airtable.ts                       Server-only REST client (list/get/update/create)
├── deepseek.ts                       DeepSeek client + Zod schema for AI output + prompts
├── queries.ts                        Read helpers, returns domain types
├── mutations.ts                      Write helpers (analysis apply, corrections, promotion)
├── types.ts                          TypeScript domain types
├── constants.ts                      Enums, score components, color thresholds
└── utils.ts                          Date math, formatting, JSON parse helpers
```

## Airtable schema

This project assumes the following schema in `appfS9ODVKZ2XEATW`. If you fork to a different base, run the migration steps documented in the working doc.

**`Meeting Notes`** — Name, Transcript, Date, Category, Post-Mortem Status, Analysis Confidence, Summary, Next Steps (JSON), Improvement Areas, Follow-up Email, Attendees, Speaker Map (JSON), Objections, Buying Signals, Meeting Score, Score Breakdown (JSON), Duration, Last Analyzed At, Human Corrections (JSON), Related Goals → Goals Tracker, Related Project → Projects, plus the original Assignee/Status/Attachments/Attachment Summary.

**`Goals Tracker`** — Goal name, Status, Priority, Owner, Source Meeting → Meeting Notes, Confidence, Notes, Due Date.

**`Projects`** — Project name, Status, Priority, Owner, Related Meetings → Meeting Notes, Notes.

## How analysis works

1. User clicks an unanalyzed meeting in the feed.
2. Detail panel shows a "Run Analysis" prompt (requires Transcript + Category set).
3. Click triggers `POST /api/analyze`.
4. Server fetches the meeting, sends transcript + category to DeepSeek with a strict JSON schema prompt.
5. DeepSeek returns structured JSON; Zod validates it.
6. Server writes Summary, Meeting Score, Score Breakdown, Confidence, Next Steps, Objections, Buying Signals, Improvement Areas, Attendees, Speaker Map, Follow-up Email (Customer Calls only) back to Airtable.
7. Post-Mortem Status flips to `Complete` (or `Needs Review` if confidence is Low).
8. SWR re-fetches and the dashboard updates.

## Caching

- Dashboard reads use Next.js cache with `revalidate: 60`.
- Detail panel uses SWR with no focus-revalidation; manual refetch on mutations.
- All write operations call `revalidatePath("/")` to invalidate the page cache.

## Known limitations / v1 scope

- Single-user (Airtable PAT in env). Add NextAuth for multi-user.
- No transcript ingestion from Otter/Fathom — transcripts must be pasted into the Transcript field manually.
- Manual corrections UI is partial; the API and logging are wired but the inline-edit UX is not built yet (the schema and route exist).
- "View in Goals Tracker" link is placeholder (`#`); replace with a Goals Tracker URL once you build that page.
- Corrections column shows count only; a viewer for the JSON log is not built.
- No notifications / Slack integration.
