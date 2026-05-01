"use client";

import type { Goal } from "@/lib/types";
import { formatDate } from "@/lib/utils";

const PRIORITY_COLORS: Record<string, string> = {
  Critical: "text-red-600 font-semibold",
  High: "text-orange-600 font-semibold",
  Medium: "text-yellow-600",
  Low: "text-gray-500",
};

const CONFIDENCE_DOTS: Record<string, string> = {
  High: "bg-green-400",
  Medium: "bg-yellow-400",
  Low: "bg-red-400",
};

function GoalCard({ goal }: { goal: Goal }) {
  return (
    <div className="rounded-lg border bg-surface-2/50 p-3 space-y-1.5">
      <p className="text-sm font-medium text-foreground leading-snug">
        {goal.name}
      </p>
      <div className="flex flex-wrap items-center gap-2 text-xs">
        {goal.priority && (
          <span className={PRIORITY_COLORS[goal.priority] ?? "text-gray-500"}>
            {goal.priority}
          </span>
        )}
        {goal.confidence && (
          <span className="flex items-center gap-1 text-muted">
            <span
              className={`inline-block h-1.5 w-1.5 rounded-full ${CONFIDENCE_DOTS[goal.confidence] ?? "bg-gray-300"}`}
            />
            {goal.confidence} confidence
          </span>
        )}
        {goal.dueDate && (
          <span className="text-muted">Due {formatDate(goal.dueDate)}</span>
        )}
      </div>
      {goal.notes && (
        <p className="text-xs text-muted line-clamp-2">{goal.notes}</p>
      )}
    </div>
  );
}

interface Column {
  label: string;
  goals: Goal[];
  headerClass: string;
}

interface Props {
  todo: Goal[];
  inProgress: Goal[];
  blocked: Goal[];
  done: Goal[];
}

export function GoalsBoard({ todo, inProgress, blocked, done }: Props) {
  const columns: Column[] = [
    {
      label: "To Do",
      goals: todo,
      headerClass: "text-gray-600 border-gray-200",
    },
    {
      label: "In Progress",
      goals: inProgress,
      headerClass: "text-blue-600 border-blue-200",
    },
    {
      label: "Blocked",
      goals: blocked,
      headerClass: "text-red-600 border-red-200",
    },
    {
      label: "Done",
      goals: done,
      headerClass: "text-green-600 border-green-200",
    },
  ];

  const total = todo.length + inProgress.length + blocked.length + done.length;

  if (total === 0) {
    return (
      <div className="rounded-xl border bg-surface-2/30 px-6 py-10 text-center text-sm text-muted">
        No goals yet. Promote a next step from a meeting to create your first
        goal.
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {columns.map((col) => (
        <div key={col.label} className="space-y-2">
          <div
            className={`flex items-center justify-between border-b pb-2 ${col.headerClass}`}
          >
            <span className="text-xs font-semibold uppercase tracking-wide">
              {col.label}
            </span>
            <span className="rounded-full bg-surface-3 px-2 py-0.5 text-xs font-medium text-muted">
              {col.goals.length}
            </span>
          </div>
          {col.goals.length === 0 ? (
            <p className="text-xs text-subtle py-2">—</p>
          ) : (
            col.goals.map((g) => <GoalCard key={g.id} goal={g} />)
          )}
        </div>
      ))}
    </div>
  );
}
