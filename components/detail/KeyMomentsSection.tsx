"use client";

import type { KeyMoment } from "@/lib/types";
import { tryParseJSON } from "@/lib/utils";

const TYPE_COLORS: Record<KeyMoment["type"], string> = {
  Objection: "bg-red-100 text-red-700 border-red-200",
  "Buying Signal": "bg-green-100 text-green-700 border-green-200",
  Decision: "bg-blue-100 text-blue-700 border-blue-200",
  Risk: "bg-orange-100 text-orange-700 border-orange-200",
  Opportunity: "bg-teal-100 text-teal-700 border-teal-200",
  Other: "bg-gray-100 text-gray-600 border-gray-200",
};

interface Props {
  keyMomentsJson: string | null;
}

export function KeyMomentsSection({ keyMomentsJson }: Props) {
  const moments = tryParseJSON<KeyMoment[]>(keyMomentsJson, []);
  if (!moments || moments.length === 0) return null;

  return (
    <div>
      <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted">
        Key Moments
      </h3>
      <div className="space-y-2">
        {moments.map((m, i) => (
          <div
            key={i}
            className="flex items-start gap-3 rounded-lg border bg-surface-2/40 p-3"
          >
            <span className="mt-0.5 shrink-0 font-mono text-xs text-muted">
              {m.timestamp}
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm text-foreground">{m.description}</p>
            </div>
            <span
              className={`shrink-0 rounded border px-1.5 py-0.5 text-xs font-medium ${TYPE_COLORS[m.type] ?? TYPE_COLORS.Other}`}
            >
              {m.type}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
