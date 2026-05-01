"use client";

import type { Offer } from "@/lib/types";
import { formatDate } from "@/lib/utils";

const STATUS_COLORS: Record<string, string> = {
  Draft: "bg-gray-100 text-gray-600 border-gray-200",
  Presented: "bg-blue-100 text-blue-700 border-blue-200",
  Accepted: "bg-yellow-100 text-yellow-700 border-yellow-200",
  Rejected: "bg-red-100 text-red-700 border-red-200",
  "Closed Won": "bg-green-100 text-green-700 border-green-200",
  "Closed Lost": "bg-red-200 text-red-800 border-red-300",
};

const TYPE_SHORT: Record<string, string> = {
  "Free AI Workshop – 30 min": "Workshop 30m",
  "Free AI Workshop – 60 min": "Workshop 60m",
  "AI Executive Workshop": "Exec Workshop",
  "AI Transformation & Integration": "Transformation",
};

interface Props {
  offers: Offer[];
}

export function OffersBoard({ offers }: Props) {
  if (offers.length === 0) {
    return (
      <div className="rounded-xl border bg-surface-2/30 px-6 py-8 text-center text-sm text-muted">
        No offers logged yet. Open a meeting and use the Offers panel to log
        your first offer.
      </div>
    );
  }

  // Group by status for a quick visual summary
  const byStatus = offers.reduce<Record<string, Offer[]>>((acc, o) => {
    const s = o.status ?? "Draft";
    if (!acc[s]) acc[s] = [];
    acc[s].push(o);
    return acc;
  }, {});

  const statusOrder = [
    "Presented",
    "Accepted",
    "Closed Won",
    "Closed Lost",
    "Rejected",
    "Draft",
  ];

  return (
    <div className="space-y-4">
      {statusOrder
        .filter((s) => byStatus[s]?.length)
        .map((status) => (
          <div key={status}>
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">
              {status}{" "}
              <span className="ml-1 font-normal text-subtle">
                ({byStatus[status].length})
              </span>
            </h3>
            <div className="space-y-1.5">
              {byStatus[status].map((offer) => (
                <div
                  key={offer.id}
                  className="flex items-center gap-3 rounded-lg border bg-surface-2/40 px-3 py-2"
                >
                  {/* Status badge */}
                  <span
                    className={`shrink-0 rounded border px-1.5 py-0.5 text-xs font-medium ${STATUS_COLORS[offer.status ?? "Draft"] ?? STATUS_COLORS.Draft}`}
                  >
                    {offer.status ?? "Draft"}
                  </span>

                  {/* Company */}
                  <span className="min-w-0 flex-1 truncate text-sm font-medium text-foreground">
                    {offer.company ?? "—"}
                  </span>

                  {/* Offer type */}
                  <span className="shrink-0 text-xs text-muted">
                    {TYPE_SHORT[offer.type ?? ""] ?? offer.type ?? "—"}
                  </span>

                  {/* Date */}
                  {offer.datePresented && (
                    <span className="shrink-0 text-xs text-subtle">
                      {formatDate(offer.datePresented)}
                    </span>
                  )}

                  {/* Loss reason */}
                  {offer.lossReason && (
                    <span className="shrink-0 text-xs text-red-500">
                      {offer.lossReason}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
    </div>
  );
}
