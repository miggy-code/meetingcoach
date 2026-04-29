import type { Goal } from "@/lib/types";
import { GoalStatusBadge, PriorityBadge } from "@/components/ui/Badges";

export function LinkedGoalsList({ goals }: { goals: Goal[] }) {
  return (
    <div className="rounded-xl border bg-surface p-5">
      <h3 className="mb-3 text-xs font-medium uppercase tracking-wider text-subtle">
        Linked goals
      </h3>
      {goals.length === 0 ? (
        <p className="text-sm text-muted">No goals linked yet.</p>
      ) : (
        <ul className="space-y-2.5">
          {goals.map((g) => (
            <li
              key={g.id}
              className="flex items-start justify-between gap-3 rounded-lg border bg-surface-2/40 p-3 text-sm"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{g.name}</p>
                {g.owner && (
                  <p className="mt-0.5 text-xs text-subtle">
                    {g.owner.name}
                  </p>
                )}
              </div>
              <div className="flex shrink-0 flex-col items-end gap-1">
                <GoalStatusBadge status={g.status} />
                <PriorityBadge priority={g.priority} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
