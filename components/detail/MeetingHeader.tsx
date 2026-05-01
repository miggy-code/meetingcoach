"use client";

import { useState } from "react";
import { Building2, User, Clock, Edit2, Check, X } from "lucide-react";
import type { MeetingNote } from "@/lib/types";
import { CategoryTag } from "@/components/ui/Badges";
import { formatDate, formatDuration } from "@/lib/utils";
import { MEETING_LEADS, type MeetingLead } from "@/lib/constants";
import { updateContextNotesAction, updateMeetingMetaAction } from "@/app/actions";

const LEAD_COLORS: Record<string, string> = {
  Gabriel: "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/40 dark:text-blue-300",
  Miguel: "bg-violet-100 text-violet-700 border-violet-200 dark:bg-violet-900/40 dark:text-violet-300",
  Both: "bg-teal-100 text-teal-700 border-teal-200 dark:bg-teal-900/40 dark:text-teal-300",
};

interface Props {
  meeting: MeetingNote;
  onRefresh: () => void;
}

export function MeetingHeader({ meeting, onRefresh }: Props) {
  const [editingContext, setEditingContext] = useState(false);
  const [contextDraft, setContextDraft] = useState(meeting.contextNotes ?? "");
  const [savingContext, setSavingContext] = useState(false);

  const [editingMeta, setEditingMeta] = useState(false);
  const [leadDraft, setLeadDraft] = useState<MeetingLead | "">(meeting.meetingLead ?? "");
  const [companyDraft, setCompanyDraft] = useState(meeting.company ?? "");
  const [contactDraft, setContactDraft] = useState(meeting.contactName ?? "");
  const [timeDraft, setTimeDraft] = useState(meeting.meetingTime ?? "");
  const [savingMeta, setSavingMeta] = useState(false);

  async function saveContext() {
    setSavingContext(true);
    try {
      await updateContextNotesAction(meeting.id, contextDraft);
      setEditingContext(false);
      onRefresh();
    } finally {
      setSavingContext(false);
    }
  }

  async function saveMeta() {
    setSavingMeta(true);
    try {
      await updateMeetingMetaAction(meeting.id, {
        meetingLead: leadDraft || undefined,
        company: companyDraft || undefined,
        contactName: contactDraft || undefined,
        meetingTime: timeDraft || undefined,
      });
      setEditingMeta(false);
      onRefresh();
    } finally {
      setSavingMeta(false);
    }
  }

  const leadColor = meeting.meetingLead ? (LEAD_COLORS[meeting.meetingLead] ?? "") : "";

  return (
    <div className="mb-6 space-y-4">
      {/* ─── Metadata row ── */}
      <div className="flex flex-wrap items-center gap-2">
        <CategoryTag category={meeting.category} />

        {meeting.meetingLead && !editingMeta && (
          <span className={`rounded border px-2 py-0.5 text-xs font-semibold ${leadColor}`}>
            {meeting.meetingLead}
          </span>
        )}

        <span className="text-xs text-muted">{formatDate(meeting.date)}</span>

        {meeting.meetingTime && !editingMeta && (
          <span className="flex items-center gap-1 text-xs text-muted">
            <Clock className="h-3 w-3" />
            {meeting.meetingTime}
          </span>
        )}

        {meeting.duration && (
          <span className="text-xs text-muted">{formatDuration(meeting.duration)}</span>
        )}

        {!editingMeta && (
          <button
            onClick={() => setEditingMeta(true)}
            className="ml-1 rounded p-0.5 text-subtle hover:text-muted"
            title="Edit meeting info"
          >
            <Edit2 className="h-3 w-3" />
          </button>
        )}
      </div>

      {/* ─── Company / Contact row ── */}
      {!editingMeta && (meeting.company || meeting.contactName) && (
        <div className="flex flex-wrap items-center gap-3 text-sm">
          {meeting.company && (
            <span className="flex items-center gap-1.5 font-medium text-foreground">
              <Building2 className="h-3.5 w-3.5 text-muted" />
              {meeting.company}
            </span>
          )}
          {meeting.contactName && (
            <span className="flex items-center gap-1.5 text-muted">
              <User className="h-3.5 w-3.5" />
              {meeting.contactName}
            </span>
          )}
        </div>
      )}

      {/* ─── Inline meta editor ── */}
      {editingMeta && (
        <div className="rounded-xl border bg-surface-2/60 p-4 space-y-3">
          <p className="text-xs font-medium text-muted uppercase tracking-wide">Edit Meeting Info</p>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs text-muted">Meeting Lead</label>
              <select
                value={leadDraft}
                onChange={(e) => setLeadDraft(e.target.value as MeetingLead)}
                className="w-full rounded-md border bg-surface px-2.5 py-1.5 text-sm outline-none focus:ring-2 focus:ring-accent/50"
              >
                <option value="">— Not set —</option>
                {MEETING_LEADS.map((l) => (
                  <option key={l} value={l}>{l}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs text-muted">Meeting Time (HH:MM)</label>
              <input
                type="text"
                value={timeDraft}
                onChange={(e) => setTimeDraft(e.target.value)}
                placeholder="e.g. 14:00"
                className="w-full rounded-md border bg-surface px-2.5 py-1.5 text-sm outline-none focus:ring-2 focus:ring-accent/50"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-muted">Company</label>
              <input
                type="text"
                value={companyDraft}
                onChange={(e) => setCompanyDraft(e.target.value)}
                placeholder="Acme Corp"
                className="w-full rounded-md border bg-surface px-2.5 py-1.5 text-sm outline-none focus:ring-2 focus:ring-accent/50"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-muted">Contact Name</label>
              <input
                type="text"
                value={contactDraft}
                onChange={(e) => setContactDraft(e.target.value)}
                placeholder="Jane Smith"
                className="w-full rounded-md border bg-surface px-2.5 py-1.5 text-sm outline-none focus:ring-2 focus:ring-accent/50"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={saveMeta}
              disabled={savingMeta}
              className="inline-flex items-center gap-1.5 rounded-md bg-accent px-3 py-1.5 text-xs font-medium text-accent-fg hover:opacity-90 disabled:opacity-50"
            >
              <Check className="h-3.5 w-3.5" />
              {savingMeta ? "Saving…" : "Save"}
            </button>
            <button
              onClick={() => setEditingMeta(false)}
              className="rounded-md px-3 py-1.5 text-xs text-muted hover:text-foreground"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* ─── Context Notes ── */}
      <div className="rounded-xl border bg-amber-50/60 dark:bg-amber-950/20 px-4 py-3">
        <div className="flex items-center justify-between mb-1.5">
          <p className="text-xs font-semibold uppercase tracking-wide text-amber-700 dark:text-amber-400">
            Context Notes
          </p>
          {!editingContext && (
            <button
              onClick={() => {
                setContextDraft(meeting.contextNotes ?? "");
                setEditingContext(true);
              }}
              className="text-xs text-amber-600 hover:text-amber-800 dark:text-amber-400 dark:hover:text-amber-200 underline"
            >
              {meeting.contextNotes ? "Edit" : "Add notes"}
            </button>
          )}
        </div>

        {editingContext ? (
          <div className="space-y-2">
            <textarea
              value={contextDraft}
              onChange={(e) => setContextDraft(e.target.value)}
              rows={3}
              placeholder="Add context for the AI: e.g. 'This is a follow-up to our workshop. The prospect seemed hesitant about pricing. Gabriel led this one.'"
              className="w-full resize-none rounded-md border border-amber-200 bg-white/80 dark:bg-surface px-3 py-2 text-sm outline-none placeholder:text-muted focus:ring-2 focus:ring-amber-400/50"
            />
            <div className="flex gap-2">
              <button
                onClick={saveContext}
                disabled={savingContext}
                className="inline-flex items-center gap-1.5 rounded-md bg-amber-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-amber-700 disabled:opacity-50"
              >
                <Check className="h-3.5 w-3.5" />
                {savingContext ? "Saving…" : "Save"}
              </button>
              <button
                onClick={() => setEditingContext(false)}
                className="rounded-md px-3 py-1.5 text-xs text-muted hover:text-foreground"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : meeting.contextNotes ? (
          <p className="text-sm text-amber-800 dark:text-amber-300 whitespace-pre-line leading-relaxed">
            {meeting.contextNotes}
          </p>
        ) : (
          <p className="text-xs text-amber-600/70 dark:text-amber-500/60 italic">
            No context notes yet. Add notes to give the AI more background before analysis.
          </p>
        )}
      </div>
    </div>
  );
}
