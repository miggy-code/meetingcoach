import { cn } from "@/lib/utils";
import type {
  Confidence,
  Category,
  PostMortemStatus,
  GoalStatus,
  Priority,
  ProjectStatus,
} from "@/lib/constants";
import { scoreColor } from "@/lib/constants";

// ─── Generic pill ──

export function Pill({
  children,
  tone = "neutral",
  size = "sm",
  className,
}: {
  children: React.ReactNode;
  tone?:
    | "neutral"
    | "accent"
    | "success"
    | "warn"
    | "danger"
    | "objection"
    | "signal";
  size?: "xs" | "sm";
  className?: string;
}) {
  const toneClasses: Record<string, string> = {
    neutral: "bg-surface-2 text-muted border-line",
    accent: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-900",
    success: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-900",
    warn: "bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-900",
    danger: "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-300 dark:border-red-900",
    objection: "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-900",
    signal: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-900",
  };
  const sizeClasses = {
    xs: "text-[10px] px-1.5 py-0.5",
    sm: "text-xs px-2 py-0.5",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border font-medium",
        toneClasses[tone],
        sizeClasses[size],
        className,
      )}
    >
      {children}
    </span>
  );
}

// ─── Confidence badge ──

export function ConfidenceBadge({
  confidence,
  size = "sm",
}: {
  confidence: Confidence | null | undefined;
  size?: "xs" | "sm";
}) {
  if (!confidence) return null;
  const tone =
    confidence === "High"
      ? "success"
      : confidence === "Medium"
        ? "warn"
        : "danger";
  return (
    <Pill tone={tone} size={size}>
      {confidence.toUpperCase()}
    </Pill>
  );
}

// ─── Category tag ──

export function CategoryTag({ category }: { category: Category | null }) {
  if (!category) return <Pill tone="neutral">Uncategorized</Pill>;
  const map: Record<Category, "accent" | "neutral" | "warn"> = {
    "Customer Call": "accent",
    Presentation: "accent",
    Planning: "neutral",
    Standup: "neutral",
    Retro: "warn",
  };
  return <Pill tone={map[category]}>{category}</Pill>;
}

// ─── Score badge (large or small) ──

export function ScoreBadge({
  score,
  size = "md",
}: {
  score: number | null | undefined;
  size?: "sm" | "md" | "xl";
}) {
  const color = scoreColor(score);
  const colorClasses: Record<typeof color, string> = {
    green: "text-emerald-600 dark:text-emerald-400",
    amber: "text-amber-600 dark:text-amber-400",
    red: "text-red-600 dark:text-red-400",
    gray: "text-subtle",
  };
  const sizeClasses = {
    sm: "text-sm font-semibold",
    md: "text-base font-semibold",
    xl: "text-5xl font-semibold tabular",
  };
  return (
    <span className={cn("tabular", colorClasses[color], sizeClasses[size])}>
      {score == null ? "—" : score}
    </span>
  );
}

// ─── Status icon for meeting feed ──

export function StatusIcon({ status }: { status: PostMortemStatus | null }) {
  if (status === "Complete") {
    return (
      <span
        title="Complete"
        className="inline-flex h-4 w-4 items-center justify-center rounded-sm bg-emerald-500 text-white"
      >
        <svg viewBox="0 0 16 16" className="h-3 w-3" fill="none">
          <path
            d="M3 8l3 3 7-7"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
    );
  }
  if (status === "Needs Review") {
    return (
      <span
        title="Needs Review"
        className="inline-flex h-4 w-4 items-center justify-center rounded-sm bg-amber-500 text-white"
      >
        <svg viewBox="0 0 16 16" className="h-2.5 w-2.5" fill="currentColor">
          <path d="M8 1l7 13H1L8 1zM8 6v4M8 11.5v.5" stroke="currentColor" strokeWidth="1.2" />
          <circle cx="8" cy="11.5" r="0.6" />
        </svg>
      </span>
    );
  }
  return (
    <span
      title="Not Analyzed"
      className="inline-block h-4 w-4 rounded-sm border border-line bg-surface-2"
    />
  );
}

// ─── Priority badge ──

export function PriorityBadge({ priority }: { priority: Priority | null }) {
  if (!priority) return null;
  const tone: Record<Priority, "neutral" | "accent" | "warn" | "danger"> = {
    Low: "neutral",
    Medium: "accent",
    High: "warn",
    Critical: "danger",
  };
  return (
    <Pill tone={tone[priority]} size="xs">
      {priority}
    </Pill>
  );
}

// ─── Goal status badge ──

export function GoalStatusBadge({ status }: { status: GoalStatus | null }) {
  if (!status) return null;
  const tone: Record<GoalStatus, "neutral" | "accent" | "success" | "warn"> = {
    Todo: "neutral",
    "In progress": "accent",
    Done: "success",
    Blocked: "warn",
  };
  return (
    <Pill tone={tone[status]} size="xs">
      {status}
    </Pill>
  );
}

// ─── Project status badge ──

export function ProjectStatusBadge({
  status,
}: {
  status: ProjectStatus | null;
}) {
  if (!status) return null;
  const tone: Record<ProjectStatus, "neutral" | "accent" | "success" | "warn"> = {
    Active: "success",
    Planning: "accent",
    "On hold": "warn",
    Done: "success",
    Cancelled: "neutral",
  };
  return (
    <Pill tone={tone[status]} size="xs">
      {status}
    </Pill>
  );
}
