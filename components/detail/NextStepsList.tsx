"use client";

import { useState } from "react";
import { ArrowRight, Plus } from "lucide-react";
import type { NextStepItem } from "@/lib/types";
import { ConfidenceBadge } from "@/components/ui/Badges";

export function NextStepsList({
  steps,
  relatedGoalIds,
  meetingId,
  onRefresh,
}: {
  steps: NextStepItem[];
  relatedGoalIds: string[];
  meetingId: string;
  onRefresh: () => void;
}) {
  const [promoting, setPromoting] = useState<number | null>(null);

  async function promote(idx: number, step: NextStepItem) {
    setPromoting(idx);
    try {
      const res = await fetch(`/api/promote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ meetingId, step }),
      });
      if (!res.ok) throw new Error("Promote failed");
      onRefresh();
    } catch (e) {
      console.error(e);
      alert("Failed to promote to Goals Tracker.");
    } finally {
      setPromoting(null);
    }
  }

  if (steps.length === 0) {
    return (
      <div className="rounded-xl border bg-surface p-5">
        <h3 className="mb-2 text-xs font-medium uppercase tracking-wider text-subtle">
          Next steps
        </h3>
        <p className="text-sm text-muted">
          No action items extracted from this meeting.
        </p>
      </div>
    );
  }
  return (
    <div className="rounded-xl border bg-surface p-5">
      <h3 className="mb-4 text-xs font-medium uppercase tracking-wider text-subtle">
        Next steps
      </h3>
      <ol className="space-y-3">
        {steps.map((step, i) => {
          const isPromoted = !!step.goalId;
          return (
            <li key={i} className="flex gap-3 text-sm">
              <span className="tabular mt-0.5 w-5 shrink-0 text-subtle">
                {i + 1}.
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-text">{step.description}</p>
                <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-subtle">
                  {step.owner && (
                    <span>
                      Owner: <span className="text-muted">{step.owner}</span>
                    </span>
                  )}
                  <ConfidenceBadge confidence={step.confidence} size="xs" />
                  {isPromoted ? (
                    <a
                      href="#"
                      className="inline-flex items-center gap-1 text-accent hover:underline"
                    >
                      View in Goals Tracker <ArrowRight className="h-3 w-3" />
                    </a>
                  ) : (
                    <button
                      type="button"
                      disabled={promoting === i}
                      onClick={() => promote(i, step)}
                      className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider hover:bg-surface-2 disabled:opacity-50"
                    >
                      {promoting === i ? "Adding…" : <>
                        <Plus className="h-3 w-3" /> Promote to goal
                      </>}
                    </button>
                  )}
                </div>
              </div>
            </li>
          );
        })}
      </ol>
      {relatedGoalIds.length > 0 && (
        <p className="mt-4 border-t pt-3 text-xs text-subtle">
          {relatedGoalIds.length}{" "}
          {relatedGoalIds.length === 1 ? "goal is" : "goals are"} linked to this
          meeting in Goals Tracker.
        </p>
      )}
    </div>
  );
}
