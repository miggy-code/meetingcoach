"use client";

import { useState } from "react";
import { Sparkles, Upload, Tag, AlertTriangle, CheckCircle2 } from "lucide-react";
import type { MeetingNote } from "@/lib/types";
import { CATEGORIES, MEETING_LEADS, type Category, type MeetingLead } from "@/lib/constants";
import {
  updateTranscriptAction,
  updateCategoryAction,
  updateMeetingMetaAction,
} from "@/app/actions";
import { cn } from "@/lib/utils";

const LEAD_COLORS: Record<string, string> = {
  Gabriel: "border-blue-400 bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  Miguel: "border-violet-400 bg-violet-50 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300",
  Both: "border-teal-400 bg-teal-50 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300",
};

export function RunAnalysisPrompt({
  meeting,
  onRefresh,
}: {
  meeting: MeetingNote;
  onRefresh: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const [savingTranscript, setSavingTranscript] = useState(false);
  const [transcriptInput, setTranscriptInput] = useState("");
  const [savingCategory, setSavingCategory] = useState(false);
  const [categoryInput, setCategoryInput] = useState<Category | "">("");
  const [savingLead, setSavingLead] = useState(false);
  const [leadInput, setLeadInput] = useState<MeetingLead | "">(meeting.meetingLead ?? "");
  const [error, setError] = useState<string | null>(null);

  const missingTranscript = !meeting.transcript;
  const missingCategory = !meeting.category;
  const missingLead = !meeting.meetingLead;
  const ready = !missingTranscript && !missingCategory && !missingLead;

  async function run() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ meetingId: meeting.id }),
      });
      const data = await res.json();
      if (!data.ok) {
        setError(data.error ?? "Analysis failed.");
        return;
      }
      onRefresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Network error.");
    } finally {
      setBusy(false);
    }
  }

  async function saveTranscript() {
    if (!transcriptInput.trim()) return;
    setSavingTranscript(true);
    setError(null);
    try {
      const res = await updateTranscriptAction(meeting.id, transcriptInput);
      if (!res.ok) { setError(res.error ?? "Failed to save transcript."); return; }
      onRefresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Network error.");
    } finally {
      setSavingTranscript(false);
    }
  }

  async function saveCategory() {
    if (!categoryInput) return;
    setSavingCategory(true);
    setError(null);
    try {
      const res = await updateCategoryAction(meeting.id, categoryInput as Category);
      if (!res.ok) { setError(res.error ?? "Failed to save category."); return; }
      onRefresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Network error.");
    } finally {
      setSavingCategory(false);
    }
  }

  async function saveLead() {
    if (!leadInput) return;
    setSavingLead(true);
    setError(null);
    try {
      const res = await updateMeetingMetaAction(meeting.id, { meetingLead: leadInput as MeetingLead });
      if (!res.ok) { setError(res.error ?? "Failed to save lead."); return; }
      onRefresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Network error.");
    } finally {
      setSavingLead(false);
    }
  }

  // Checklist items
  const checks = [
    { label: "Transcript", done: !missingTranscript },
    { label: "Category", done: !missingCategory },
    { label: "Meeting Lead", done: !missingLead },
    { label: "Context Notes", done: !!meeting.contextNotes, optional: true },
  ];

  return (
    <div className="rounded-xl border bg-surface p-5">
      <div className="flex items-start gap-3">
        <Sparkles className="mt-0.5 h-5 w-5 shrink-0 text-accent" />
        <div className="flex-1 space-y-4">
          <div>
            <h3 className="text-sm font-semibold">
              {ready ? "Ready for AI Analysis" : "Complete setup before running analysis"}
            </h3>
            <p className="mt-0.5 text-xs text-muted">
              {ready
                ? "All required fields are set. Add context notes above for more targeted coaching, then run analysis."
                : "Fill in the required fields below to enable analysis."}
            </p>
          </div>

          {/* Checklist */}
          <div className="flex flex-wrap gap-2">
            {checks.map(({ label, done, optional }) => (
              <span
                key={label}
                className={cn(
                  "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium",
                  done
                    ? "border-green-200 bg-green-50 text-green-700 dark:border-green-800 dark:bg-green-950/30 dark:text-green-400"
                    : optional
                      ? "border-amber-200 bg-amber-50 text-amber-600 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-400"
                      : "border-red-200 bg-red-50 text-red-600 dark:border-red-800 dark:bg-red-950/30 dark:text-red-400",
                )}
              >
                {done ? (
                  <CheckCircle2 className="h-3 w-3" />
                ) : (
                  <AlertTriangle className="h-3 w-3" />
                )}
                {label}
                {optional && !done && " (optional)"}
              </span>
            ))}
          </div>

          {error && (
            <p className="rounded-md bg-red-50 px-3 py-2 text-xs text-red-700 dark:bg-red-950/40 dark:text-red-400">
              {error}
            </p>
          )}

          {/* Transcript input */}
          {missingTranscript && (
            <div className="rounded-lg border bg-surface-2 p-3">
              <p className="mb-2 text-xs font-medium text-muted">Paste Transcript</p>
              <textarea
                className="w-full resize-none rounded bg-transparent p-2 text-sm outline-none placeholder:text-muted focus:ring-2 focus:ring-accent/50"
                placeholder="Paste transcript text here…"
                rows={5}
                value={transcriptInput}
                onChange={(e) => setTranscriptInput(e.target.value)}
              />
              <div className="mt-2 flex justify-end">
                <button
                  type="button"
                  onClick={saveTranscript}
                  disabled={savingTranscript || !transcriptInput.trim()}
                  className="inline-flex items-center gap-1.5 rounded-md bg-accent px-3 py-1.5 text-xs font-medium text-accent-fg hover:opacity-90 disabled:opacity-50"
                >
                  <Upload className="h-3.5 w-3.5" />
                  {savingTranscript ? "Saving…" : "Save transcript"}
                </button>
              </div>
            </div>
          )}

          {/* Category picker */}
          {missingCategory && (
            <div className="flex items-center gap-2 rounded-lg border bg-surface-2 p-3">
              <select
                value={categoryInput}
                onChange={(e) => setCategoryInput(e.target.value as Category)}
                className="flex-1 rounded border bg-surface px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-accent/50"
              >
                <option value="" disabled>Select category…</option>
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
              <button
                type="button"
                onClick={saveCategory}
                disabled={savingCategory || !categoryInput}
                className="inline-flex items-center gap-1.5 rounded-md bg-accent px-3 py-1.5 text-xs font-medium text-accent-fg hover:opacity-90 disabled:opacity-50"
              >
                <Tag className="h-3.5 w-3.5" />
                {savingCategory ? "Saving…" : "Set"}
              </button>
            </div>
          )}

          {/* Meeting Lead picker */}
          {missingLead && (
            <div className="rounded-lg border bg-surface-2 p-3">
              <p className="mb-2 text-xs font-medium text-muted">Who led this meeting?</p>
              <div className="flex gap-2">
                {MEETING_LEADS.map((lead) => (
                  <button
                    key={lead}
                    type="button"
                    onClick={() => setLeadInput(lead)}
                    className={cn(
                      "flex-1 rounded-md border px-3 py-2 text-xs font-semibold transition-all",
                      leadInput === lead
                        ? LEAD_COLORS[lead]
                        : "border-line bg-surface text-muted hover:border-muted",
                    )}
                  >
                    {lead}
                  </button>
                ))}
              </div>
              {leadInput && (
                <div className="mt-2 flex justify-end">
                  <button
                    type="button"
                    onClick={saveLead}
                    disabled={savingLead}
                    className="inline-flex items-center gap-1.5 rounded-md bg-accent px-3 py-1.5 text-xs font-medium text-accent-fg hover:opacity-90 disabled:opacity-50"
                  >
                    {savingLead ? "Saving…" : "Set Lead"}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Run button */}
          <button
            type="button"
            onClick={run}
            disabled={busy || !ready}
            className="inline-flex items-center gap-1.5 rounded-md bg-accent px-4 py-2 text-sm font-medium text-accent-fg hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Sparkles className="h-4 w-4" />
            {busy ? "Analyzing… (this takes ~20s)" : "Run AI Analysis"}
          </button>
        </div>
      </div>
    </div>
  );
}
