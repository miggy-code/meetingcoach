"use client";

import { useState, useTransition } from "react";
import { ChevronDown, Pencil, Check, X, Loader2 } from "lucide-react";
import type { Offer } from "@/lib/types";
import { OFFER_TYPES, OFFER_STATUSES } from "@/lib/constants";
import {
  createOfferAction,
  updateOfferStatusAction,
  updateOfferNotesAction,
} from "@/app/actions";
import { cn } from "@/lib/utils";

const STATUS_COLORS: Record<string, string> = {
  Draft: "bg-gray-100 text-gray-600 border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700",
  Presented: "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/40 dark:text-blue-400 dark:border-blue-800",
  Accepted: "bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-900/40 dark:text-yellow-400 dark:border-yellow-800",
  Rejected: "bg-red-100 text-red-700 border-red-200 dark:bg-red-900/40 dark:text-red-400 dark:border-red-800",
  "Closed Won": "bg-green-100 text-green-700 border-green-200 dark:bg-green-900/40 dark:text-green-400 dark:border-green-800",
  "Closed Lost": "bg-red-200 text-red-800 border-red-300 dark:bg-red-950/60 dark:text-red-300 dark:border-red-700",
};

// ─── Inline notes editor for a single offer ──

function OfferNotesEditor({
  offerId,
  initialNotes,
}: {
  offerId: string;
  initialNotes: string | null;
}) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(initialNotes ?? "");
  const [saved, setSaved] = useState(initialNotes ?? "");
  const [pending, startTransition] = useTransition();

  function handleSave() {
    startTransition(async () => {
      const result = await updateOfferNotesAction(offerId, value);
      if (result.ok) {
        setSaved(value);
        setEditing(false);
      }
    });
  }

  function handleCancel() {
    setValue(saved);
    setEditing(false);
  }

  if (!editing) {
    return (
      <div className="flex items-start gap-1.5 mt-2">
        {saved ? (
          <p className="flex-1 text-xs text-muted leading-relaxed">{saved}</p>
        ) : (
          <p className="flex-1 text-xs text-subtle italic">No notes</p>
        )}
        <button
          onClick={() => setEditing(true)}
          className="shrink-0 rounded p-0.5 text-muted hover:text-foreground hover:bg-surface-3 transition-colors"
          title="Edit notes"
        >
          <Pencil className="h-3 w-3" />
        </button>
      </div>
    );
  }

  return (
    <div className="mt-2 space-y-1.5">
      <textarea
        autoFocus
        value={value}
        onChange={(e) => setValue(e.target.value)}
        rows={3}
        placeholder="Add context, pricing notes, next steps…"
        className="w-full rounded border bg-surface-1 px-2 py-1.5 text-xs text-foreground placeholder:text-muted resize-none focus:outline-none focus:ring-1 focus:ring-accent"
      />
      <div className="flex items-center gap-1.5">
        <button
          onClick={handleSave}
          disabled={pending}
          className="inline-flex items-center gap-1 rounded bg-accent px-2.5 py-1 text-xs font-medium text-white hover:bg-accent/90 disabled:opacity-50 transition-colors"
        >
          {pending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
          Save
        </button>
        <button
          onClick={handleCancel}
          className="inline-flex items-center gap-1 rounded border px-2.5 py-1 text-xs text-muted hover:text-foreground transition-colors"
        >
          <X className="h-3 w-3" />
          Cancel
        </button>
      </div>
    </div>
  );
}

// ─── Single offer card ──

function OfferCard({
  offer,
  onStatusChange,
}: {
  offer: Offer;
  onStatusChange: (offerId: string, status: string) => Promise<void>;
}) {
  const [statusOpen, setStatusOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  const otherStatuses = OFFER_STATUSES.filter((s) => s !== offer.status);

  function handleStatus(s: string) {
    setStatusOpen(false);
    startTransition(async () => {
      await onStatusChange(offer.id, s);
    });
  }

  return (
    <div className="rounded-lg border bg-surface-2/40 p-3 space-y-2">
      {/* Header row */}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-sm font-medium text-foreground truncate">{offer.offerName}</p>
          {offer.company && (
            <p className="text-xs text-muted">{offer.company}</p>
          )}
        </div>
        <span
          className={cn(
            "shrink-0 rounded border px-2 py-0.5 text-xs font-medium",
            STATUS_COLORS[offer.status ?? "Draft"] ?? STATUS_COLORS.Draft,
          )}
        >
          {offer.status ?? "Draft"}
        </span>
      </div>

      {/* Notes editor */}
      <OfferNotesEditor offerId={offer.id} initialNotes={offer.notes ?? null} />

      {/* Status transition row */}
      <div className="relative pt-1 border-t">
        <button
          onClick={() => setStatusOpen((v) => !v)}
          disabled={pending}
          className="inline-flex items-center gap-1 text-xs text-muted hover:text-foreground transition-colors disabled:opacity-50"
        >
          {pending ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
            <ChevronDown className="h-3 w-3" />
          )}
          Move to…
        </button>

        {statusOpen && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setStatusOpen(false)} />
            <div className="absolute left-0 top-full z-20 mt-1 w-40 rounded-lg border bg-surface shadow-lg overflow-hidden">
              {otherStatuses.map((s) => (
                <button
                  key={s}
                  onClick={() => handleStatus(s)}
                  className="w-full px-3 py-2 text-left text-xs text-muted hover:bg-surface-2 hover:text-foreground transition-colors"
                >
                  → {s}
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ─── Main panel ──

interface Props {
  offers: Offer[];
  meetingId: string;
  meetingDate: string | null;
  onRefresh: () => void;
}

export function OffersPanel({ offers, meetingId, meetingDate, onRefresh }: Props) {
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [offerType, setOfferType] = useState<string>(OFFER_TYPES[0]);
  const [company, setCompany] = useState("");
  const [formNotes, setFormNotes] = useState("");

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    await createOfferAction({
      offerName: `${offerType} — ${company || "Unknown Company"}`,
      type: offerType,
      status: "Presented",
      company: company || undefined,
      datePresented: meetingDate ?? undefined,
      meetingId,
      notes: formNotes || undefined,
    });
    setSubmitting(false);
    setShowForm(false);
    setCompany("");
    setFormNotes("");
    onRefresh();
  }

  async function handleStatusChange(offerId: string, status: string) {
    await updateOfferStatusAction(offerId, status);
    onRefresh();
  }

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-muted">
          Offers
        </h3>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="rounded px-2 py-0.5 text-xs font-medium text-accent hover:bg-surface-3 transition-colors"
        >
          {showForm ? "Cancel" : "+ Log Offer"}
        </button>
      </div>

      {/* Create form */}
      {showForm && (
        <form
          onSubmit={handleCreate}
          className="mb-3 rounded-lg border bg-surface-2/60 p-3 space-y-2"
        >
          <div>
            <label className="block text-xs text-muted mb-1">Offer Type</label>
            <select
              value={offerType}
              onChange={(e) => setOfferType(e.target.value)}
              className="w-full rounded border bg-surface-1 px-2 py-1.5 text-sm text-foreground"
            >
              {OFFER_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-muted mb-1">Company</label>
            <input
              type="text"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              placeholder="e.g. Acme Corp"
              className="w-full rounded border bg-surface-1 px-2 py-1.5 text-sm text-foreground placeholder:text-muted"
            />
          </div>
          <div>
            <label className="block text-xs text-muted mb-1">
              Notes <span className="text-subtle">(optional)</span>
            </label>
            <textarea
              value={formNotes}
              onChange={(e) => setFormNotes(e.target.value)}
              rows={2}
              placeholder="Context, pricing, key considerations…"
              className="w-full rounded border bg-surface-1 px-2 py-1.5 text-sm text-foreground placeholder:text-muted resize-none focus:outline-none focus:ring-1 focus:ring-accent"
            />
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded bg-accent px-3 py-1.5 text-xs font-semibold text-white hover:bg-accent/90 disabled:opacity-50 transition-colors"
          >
            {submitting ? "Saving…" : "Log Offer"}
          </button>
        </form>
      )}

      {/* Offer list */}
      {offers.length === 0 && !showForm ? (
        <p className="text-xs text-muted">No offers logged for this meeting.</p>
      ) : (
        <div className="space-y-2">
          {offers.map((offer) => (
            <OfferCard
              key={offer.id}
              offer={offer}
              onStatusChange={handleStatusChange}
            />
          ))}
        </div>
      )}
    </div>
  );
}
