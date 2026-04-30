"use client";

import { useState } from "react";
import { Sparkles, Upload } from "lucide-react";
import type { MeetingNote } from "@/lib/types";
import { updateTranscriptAction } from "@/app/actions";

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
  const [error, setError] = useState<string | null>(null);

  const missingTranscript = !meeting.transcript;
  const missingCategory = !meeting.category;
  const ready = !missingTranscript && !missingCategory;

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
      if (!res.ok) {
        setError(res.error ?? "Failed to save transcript.");
        return;
      }
      onRefresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Network error.");
    } finally {
      setSavingTranscript(false);
    }
  }

  return (
    <div className="mb-4 rounded-xl border bg-surface p-6">
      <div className="flex items-start gap-3">
        <Sparkles className="mt-0.5 h-5 w-5 text-accent" />
        <div className="flex-1">
          <h3 className="text-sm font-medium">
            {ready ? "Ready for analysis" : "Setup required"}
          </h3>
          <p className="mt-1 text-xs text-muted">
            {ready
              ? "Transcript is uploaded. Run AI analysis to generate summary, score, signals, and next steps."
              : missingTranscript
                ? "Upload or paste a transcript to run analysis."
                : "Set a Category in Airtable before running analysis."}
          </p>
          
          {error && (
            <p className="mt-2 rounded-md bg-red-50 px-2 py-1.5 text-xs text-red-700 dark:bg-red-950/40 dark:text-red-400">
              {error}
            </p>
          )}

          {missingTranscript && (
            <div className="mt-4 rounded-lg border bg-surface-2 p-3">
              <textarea
                className="w-full resize-none rounded bg-transparent p-2 text-sm outline-none placeholder:text-muted focus:ring-2 focus:ring-accent/50"
                placeholder="Paste transcript text here..."
                rows={4}
                value={transcriptInput}
                onChange={(e) => setTranscriptInput(e.target.value)}
              />
              <div className="mt-2 flex justify-end">
                <button
                  type="button"
                  onClick={saveTranscript}
                  disabled={savingTranscript || !transcriptInput.trim()}
                  className="inline-flex items-center gap-1.5 rounded-md bg-accent px-3 py-1.5 text-xs font-medium text-accent-fg hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Upload className="h-3.5 w-3.5" />
                  {savingTranscript ? "Saving…" : "Save transcript"}
                </button>
              </div>
            </div>
          )}

          <button
            type="button"
            onClick={run}
            disabled={busy || !ready}
            className="mt-4 inline-flex items-center gap-1.5 rounded-md bg-accent px-3 py-1.5 text-xs font-medium text-accent-fg hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Sparkles className="h-3.5 w-3.5" />
            {busy ? "Analyzing…" : "Run analysis"}
          </button>
        </div>
      </div>
    </div>
  );
}
