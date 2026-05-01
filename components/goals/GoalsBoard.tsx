"use client";

import { useState, useTransition } from "react";
import { ChevronDown, Loader2 } from "lucide-react";
import type { Goal } from "@/lib/types";
import { GOAL_STATUSES, type GoalStatus } from "@/lib/constants";
import { updateGoalStatusAction } from "@/app/actions";
import { formatDate, cn } from "@/lib/utils";

// ─── Color maps ──

const PRIORITY_COLORS: Record<string, string> = {
  High: "text-red-600 dark:text-red-400 font-semibold",
  Medium: "text-amber-600 dark:text-amber-400",
  Low: "text-blue-500 dark:text-blue-400",
};

const CONFIDENCE_DOTS: Record<string, string> = {
  High: "bg-green-500",
  Medium: "bg-amber-400",
  Low: "bg-red-400",
};

const STATUS_HEADER_BG: Record<string, string> = {
  Todo: "bg-gray-50 border-gray-200 dark:bg-gray-900/30 dark:border-gray-700",
  "In progress": "bg-blue-50 border-blue-200 dark:bg-blue-950/30 dark:border-blue-800",
  Blocked: "bg-red-50 border-red-200 dark:bg-red-950/30 dark:border-red-800",
  Done: "bg-green-50 border-green-200 dark:bg-green-950/30 dark:border-green-800",
};

const STATUS_TEXT: Record<string, string> = {
  Todo: "text-gray-600 dark:text-gray-400",
  "In progress": "text-blue-600 dark:text-blue-400",
  Blocked: "text-red-600 dark:text-red-400",
  Done: "text-green-600 dark:text-green-400",
};

// ─── Goal card with inline status transition ──

function GoalCard({
  goal,
  onStatusChange,
}: {
  goal: Goal;
  onStatusChange: (goalId: string, newStatus: GoalStatus) => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  const currentStatus = goal.status ?? "Todo";
  const otherStatuses = GOAL_STATUSES.filter((s) => s !== currentStatus);

  function handleSelect(status: GoalStatus) {
    setOpen(false);
    startTransition(async () => {
      await onStatusChange(goal.id, status);
    });
  }

  return (
    <div className="relative rounded-lg border bg-surface px-4 py-3 shadow-sm hover:shadow-md transition-shadow">
      {/* Goal name */}
      <p className="text-sm font-medium leading-snug text-foreground mb-2">
        {goal.name}
      </p>

      {/* Meta row */}
      <div className="flex flex-wrap items-center gap-2 mb-3">
        {goal.priority && (
          <span className={cn("text-xs", PRIORITY_COLORS[goal.priority] ?? "text-muted")}>
            {goal.priority}
          </span>
        )}
        {goal.confidence && (
          <span className="flex items-center gap-1 text-xs text-muted">
            <span
              className={cn(
                "h-1.5 w-1.5 rounded-full",
                CONFIDENCE_DOTS[goal.confidence] ?? "bg-muted",
              )}
            />
            {goal.confidence}
          </span>
        )}
        {goal.dueDate && (
          <span className="text-xs text-muted">Due {formatDate(goal.dueDate)}</span>
        )}
      </div>

      {goal.notes && (
        <p className="mb-3 text-xs text-muted line-clamp-2">{goal.notes}</p>
      )}

      {/* Status transition dropdown */}
      <div className="relative">
        <button
          onClick={() => setOpen((v) => !v)}
          disabled={pending}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs font-medium transition-colors",
            STATUS_TEXT[currentStatus],
            "border-current/30 hover:bg-current/5",
            pending && "opacity-50 cursor-not-allowed",
          )}
        >
          {pending ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
            <ChevronDown className="h-3 w-3" />
          )}
          {currentStatus}
        </button>

        {open && (
          <>
            {/* Backdrop to close on outside click */}
            <div
              className="fixed inset-0 z-10"
              onClick={() => setOpen(false)}
            />
            <div className="absolute left-0 top-full z-20 mt-1 w-36 rounded-lg border bg-surface shadow-lg overflow-hidden">
              {otherStatuses.map((s) => (
                <button
                  key={s}
                  onClick={() => handleSelect(s)}
                  className={cn(
                    "w-full px-3 py-2 text-left text-xs font-medium hover:bg-surface-2 transition-colors",
                    STATUS_TEXT[s],
                  )}
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

// ─── Column ──

function Column({
  label,
  goals,
  onStatusChange,
}: {
  label: string;
  goals: Goal[];
  onStatusChange: (goalId: string, newStatus: GoalStatus) => Promise<void>;
}) {
  return (
    <div className="flex flex-col gap-3">
      <div
        className={cn(
          "flex items-center justify-between rounded-lg border px-3 py-2",
          STATUS_HEADER_BG[label] ?? "",
        )}
      >
        <span
          className={cn(
            "text-xs font-semibold uppercase tracking-wide",
            STATUS_TEXT[label],
          )}
        >
          {label}
        </span>
        <span className="rounded-full bg-surface px-2 py-0.5 text-xs tabular-nums text-muted">
          {goals.length}
        </span>
      </div>

      {goals.length === 0 ? (
        <p className="rounded-lg border border-dashed px-3 py-4 text-center text-xs text-subtle">
          Empty
        </p>
      ) : (
        goals.map((g) => (
          <GoalCard key={g.id} goal={g} onStatusChange={onStatusChange} />
        ))
      )}
    </div>
  );
}

// ─── Public board ──

interface Props {
  todo: Goal[];
  inProgress: Goal[];
  blocked: Goal[];
  done: Goal[];
}

export function GoalsBoard({ todo, inProgress, blocked, done }: Props) {
  const total = todo.length + inProgress.length + blocked.length + done.length;

  // Optimistic local overrides: apply immediately, revert on failure
  const [overrides, setOverrides] = useState<Record<string, GoalStatus>>({});

  async function handleStatusChange(goalId: string, newStatus: GoalStatus) {
    setOverrides((prev) => ({ ...prev, [goalId]: newStatus }));
    const result = await updateGoalStatusAction(goalId, newStatus);
    if (!result.ok) {
      setOverrides((prev) => {
        const next = { ...prev };
        delete next[goalId];
        return next;
      });
    }
  }

  if (total === 0) {
    return (
      <div className="rounded-xl border border-dashed px-6 py-12 text-center">
        <p className="text-sm text-muted">No goals yet.</p>
        <p className="mt-1 text-xs text-subtle">
          Promote next steps from meeting analyses to track them here.
        </p>
      </div>
    );
  }

  // Apply overrides and re-partition
  const allGoals = [...todo, ...inProgress, ...blocked, ...done].map((g) =>
    overrides[g.id] ? { ...g, status: overrides[g.id] } : g,
  );

  const partitioned: Record<GoalStatus, Goal[]> = {
    Todo: allGoals.filter((g) => (g.status ?? "Todo") === "Todo"),
    "In progress": allGoals.filter((g) => g.status === "In progress"),
    Blocked: allGoals.filter((g) => g.status === "Blocked"),
    Done: allGoals.filter((g) => g.status === "Done"),
  };

  const columns: GoalStatus[] = ["Todo", "In progress", "Blocked", "Done"];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {columns.map((label) => (
        <Column
          key={label}
          label={label}
          goals={partitioned[label]}
          onStatusChange={handleStatusChange}
        />
      ))}
    </div>
  );
}
