"use client";

import { useState } from "react";
import type { Offer } from "@/lib/types";
import { OFFER_TYPES, OFFER_STATUSES } from "@/lib/constants";
import { createOfferAction, updateOfferStatusAction } from "@/app/actions";

const STATUS_COLORS: Record<string, string> = {
  Draft: "bg-gray-100 text-gray-600 border-gray-200",
  Presented: "bg-blue-100 text-blue-700 border-blue-200",
  Accepted: "bg-yellow-100 text-yellow-700 border-yellow-200",
  Rejected: "bg-red-100 text-red-700 border-red-200",
  "Closed Won": "bg-green-100 text-green-700 border-green-200",
  "Closed Lost": "bg-red-200 text-red-800 border-red-300",
};

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
    });
    setSubmitting(false);
    setShowForm(false);
    setCompany("");
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
            <div
              key={offer.id}
              className="rounded-lg border bg-surface-2/40 p-3 space-y-2"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-medium text-foreground">{offer.offerName}</p>
                  {offer.company && (
                    <p className="text-xs text-muted">{offer.company}</p>
                  )}
                </div>
                <span
                  className={`shrink-0 rounded border px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[offer.status ?? "Draft"] ?? STATUS_COLORS.Draft}`}
                >
                  {offer.status ?? "Draft"}
                </span>
              </div>
              {/* Quick status update */}
              <div className="flex flex-wrap gap-1">
                {OFFER_STATUSES.filter((s) => s !== offer.status).map((s) => (
                  <button
                    key={s}
                    onClick={() => handleStatusChange(offer.id, s)}
                    className="rounded border px-2 py-0.5 text-xs text-muted hover:border-accent hover:text-accent transition-colors"
                  >
                    → {s}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
