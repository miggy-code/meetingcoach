"use client";

import { useState } from "react";
import { Plus, X, Upload, Building2, User, Clock } from "lucide-react";
import { CATEGORIES, MEETING_LEADS, type Category, type MeetingLead } from "@/lib/constants";
import { createMeetingAction } from "@/app/actions";

const LEAD_COLORS: Record<string, string> = {
  Gabriel: "border-blue-400 bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  Miguel: "border-violet-400 bg-violet-50 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300",
  Both: "border-teal-400 bg-teal-50 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300",
};

export function NewMeetingDialog() {
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState("");
  const [category, setCategory] = useState<Category | "">("");
  const [meetingLead, setMeetingLead] = useState<MeetingLead | "">("");
  const [company, setCompany] = useState("");
  const [contactName, setContactName] = useState("");
  const [meetingTime, setMeetingTime] = useState("");
  const [contextNotes, setContextNotes] = useState("");
  const [transcript, setTranscript] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function reset() {
    setName("");
    setCategory("");
    setMeetingLead("");
    setCompany("");
    setContactName("");
    setMeetingTime("");
    setContextNotes("");
    setTranscript("");
    setError(null);
  }

  function close() {
    setIsOpen(false);
    reset();
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !category || !meetingLead || !transcript.trim()) return;

    setSaving(true);
    setError(null);
    try {
      const res = await createMeetingAction({
        name,
        category: category as Category,
        transcript,
        date: new Date().toISOString().split("T")[0],
        meetingLead: meetingLead as MeetingLead,
        company: company || undefined,
        contactName: contactName || undefined,
        meetingTime: meetingTime || undefined,
        contextNotes: contextNotes || undefined,
      });
      if (!res.ok) {
        setError(res.error ?? "Failed to create meeting.");
        return;
      }
      close();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Network error.");
    } finally {
      setSaving(false);
    }
  }

  const isCustomerFacing =
    category === "Customer Call" || category === "Presentation";

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center gap-1.5 rounded-md bg-accent px-3 py-1.5 text-xs font-medium text-accent-fg hover:opacity-90"
      >
        <Plus className="h-3.5 w-3.5" />
        New Meeting
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-4 bg-background/80 backdrop-blur-sm">
          <div className="my-8 w-full max-w-xl overflow-hidden rounded-xl border bg-surface shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between border-b px-6 py-4">
              <h2 className="text-base font-semibold tracking-tight">
                Upload Transcript
              </h2>
              <button
                onClick={close}
                className="rounded text-muted hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-5">
              {/* ─── Meeting Name ── */}
              <div>
                <label className="mb-1 block text-sm font-medium">
                  Meeting Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Acme Corp — Discovery Call"
                  className="w-full rounded-md border bg-surface-2 px-3 py-2 text-sm outline-none placeholder:text-muted focus:ring-2 focus:ring-accent/50"
                />
              </div>

              {/* ─── Category + Meeting Lead ── */}
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium">
                    Category <span className="text-red-500">*</span>
                  </label>
                  <select
                    required
                    value={category}
                    onChange={(e) => setCategory(e.target.value as Category)}
                    className="w-full rounded-md border bg-surface-2 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-accent/50"
                  >
                    <option value="" disabled>
                      Select…
                    </option>
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium">
                    Meeting Lead <span className="text-red-500">*</span>
                  </label>
                  <div className="flex gap-1.5">
                    {MEETING_LEADS.map((lead) => (
                      <button
                        key={lead}
                        type="button"
                        onClick={() => setMeetingLead(lead)}
                        className={`flex-1 rounded-md border px-2 py-2 text-xs font-semibold transition-all ${
                          meetingLead === lead
                            ? LEAD_COLORS[lead]
                            : "border-line bg-surface-2 text-muted hover:border-muted"
                        }`}
                      >
                        {lead}
                      </button>
                    ))}
                  </div>
                  {!meetingLead && (
                    <p className="mt-1 text-xs text-muted">Required</p>
                  )}
                </div>
              </div>

              {/* ─── Company + Contact (customer-facing only) ── */}
              {isCustomerFacing && (
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 flex items-center gap-1.5 text-sm font-medium">
                      <Building2 className="h-3.5 w-3.5 text-muted" />
                      Company
                    </label>
                    <input
                      type="text"
                      value={company}
                      onChange={(e) => setCompany(e.target.value)}
                      placeholder="Acme Corp"
                      className="w-full rounded-md border bg-surface-2 px-3 py-2 text-sm outline-none placeholder:text-muted focus:ring-2 focus:ring-accent/50"
                    />
                  </div>
                  <div>
                    <label className="mb-1 flex items-center gap-1.5 text-sm font-medium">
                      <User className="h-3.5 w-3.5 text-muted" />
                      Contact Name
                    </label>
                    <input
                      type="text"
                      value={contactName}
                      onChange={(e) => setContactName(e.target.value)}
                      placeholder="Jane Smith"
                      className="w-full rounded-md border bg-surface-2 px-3 py-2 text-sm outline-none placeholder:text-muted focus:ring-2 focus:ring-accent/50"
                    />
                  </div>
                </div>
              )}

              {/* ─── Date + Time ── */}
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium">
                    Date
                  </label>
                  <input
                    type="date"
                    defaultValue={new Date().toISOString().split("T")[0]}
                    className="w-full rounded-md border bg-surface-2 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-accent/50"
                    id="meeting-date-input"
                  />
                </div>
                <div>
                  <label className="mb-1 flex items-center gap-1.5 text-sm font-medium">
                    <Clock className="h-3.5 w-3.5 text-muted" />
                    Time (optional)
                  </label>
                  <input
                    type="time"
                    value={meetingTime}
                    onChange={(e) => setMeetingTime(e.target.value)}
                    className="w-full rounded-md border bg-surface-2 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-accent/50"
                  />
                </div>
              </div>

              {/* ─── Context Notes ── */}
              <div>
                <label className="mb-1 block text-sm font-medium">
                  Context Notes{" "}
                  <span className="font-normal text-muted">(optional — seen by AI during analysis)</span>
                </label>
                <textarea
                  value={contextNotes}
                  onChange={(e) => setContextNotes(e.target.value)}
                  placeholder="e.g. This is a follow-up to our workshop. The prospect seemed hesitant about pricing. Flag: we may have gone too technical."
                  rows={2}
                  className="w-full resize-none rounded-md border bg-surface-2 px-3 py-2 text-sm outline-none placeholder:text-muted focus:ring-2 focus:ring-accent/50"
                />
              </div>

              {/* ─── Transcript ── */}
              <div>
                <label className="mb-1 block text-sm font-medium">
                  Transcript <span className="text-red-500">*</span>
                </label>
                <textarea
                  required
                  value={transcript}
                  onChange={(e) => setTranscript(e.target.value)}
                  placeholder="Paste the raw transcript here…"
                  rows={7}
                  className="w-full resize-none rounded-md border bg-surface-2 px-3 py-2 text-sm outline-none placeholder:text-muted focus:ring-2 focus:ring-accent/50"
                />
              </div>

              {error && (
                <p className="rounded-md bg-red-50 px-3 py-2 text-xs text-red-700 dark:bg-red-950/40 dark:text-red-400">
                  {error}
                </p>
              )}

              <div className="flex justify-end gap-3 pt-1">
                <button
                  type="button"
                  onClick={close}
                  className="rounded-md px-4 py-2 text-sm font-medium text-muted hover:text-foreground"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={
                    saving ||
                    !name.trim() ||
                    !category ||
                    !meetingLead ||
                    !transcript.trim()
                  }
                  className="inline-flex items-center gap-1.5 rounded-md bg-accent px-4 py-2 text-sm font-medium text-accent-fg hover:opacity-90 disabled:opacity-50"
                >
                  <Upload className="h-4 w-4" />
                  {saving ? "Saving…" : "Create Meeting"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
