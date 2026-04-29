import type { Project } from "@/lib/types";
import {
  PriorityBadge,
  ProjectStatusBadge,
} from "@/components/ui/Badges";

export function RelatedProjectCard({ project }: { project: Project | null }) {
  return (
    <div className="rounded-xl border bg-surface p-5">
      <h3 className="mb-3 text-xs font-medium uppercase tracking-wider text-subtle">
        Related project
      </h3>
      {!project ? (
        <p className="text-sm text-muted">No project linked.</p>
      ) : (
        <div className="rounded-lg border bg-surface-2/40 p-3">
          <p className="font-medium">{project.name}</p>
          {project.notes && (
            <p className="mt-1 line-clamp-2 text-xs text-muted">
              {project.notes}
            </p>
          )}
          <div className="mt-2 flex gap-1.5">
            <ProjectStatusBadge status={project.status} />
            <PriorityBadge priority={project.priority} />
          </div>
        </div>
      )}
    </div>
  );
}
