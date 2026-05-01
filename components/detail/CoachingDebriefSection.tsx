"use client";

import type { PersonSkillScores } from "@/lib/types";
import { SKILL_DIMENSIONS } from "@/lib/constants";
import { tryParseJSON } from "@/lib/utils";
import { cn } from "@/lib/utils";

// ─── Skill score bar ──

function SkillBar({ label, score }: { label: string; score: number }) {
  const pct = (score / 10) * 100;
  const color =
    score >= 8 ? "bg-green-500" : score >= 6 ? "bg-amber-400" : "bg-red-400";

  return (
    <div className="flex items-center gap-2">
      <span className="w-44 shrink-0 text-xs text-muted text-right leading-tight">
        {label}
      </span>
      <div className="flex-1 h-1.5 rounded-full bg-surface-3 overflow-hidden">
        <div
          className={cn("h-full rounded-full transition-all", color)}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span
        className={cn(
          "w-6 shrink-0 text-xs tabular-nums font-medium",
          score >= 8
            ? "text-green-600"
            : score >= 6
              ? "text-amber-500"
              : "text-red-500",
        )}
      >
        {score}
      </span>
    </div>
  );
}

// ─── Single person debrief ──

function PersonDebrief({
  name,
  debrief,
  skillScores,
  color,
}: {
  name: string;
  debrief: string | null;
  skillScores: PersonSkillScores | null;
  color: string;
}) {
  if (!debrief && !skillScores) return null;

  return (
    <div className="rounded-xl border bg-surface-2/40 overflow-hidden">
      {/* Header */}
      <div className={cn("px-5 py-3 border-b", color)}>
        <h3 className="text-sm font-semibold">{name} — Coaching Debrief</h3>
      </div>

      <div className="p-5 space-y-5">
        {/* Skill scores */}
        {skillScores && Object.keys(skillScores.scores).length > 0 && (
          <div>
            <p className="mb-3 text-xs font-medium uppercase tracking-wide text-muted">
              Skill Scores
            </p>
            <div className="space-y-2">
              {SKILL_DIMENSIONS.map((dim) => {
                const score = skillScores.scores[dim];
                if (score == null) return null;
                return <SkillBar key={dim} label={dim} score={score} />;
              })}
            </div>
          </div>
        )}

        {/* Debrief text */}
        {debrief && (
          <div>
            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted">
              Coaching Notes
            </p>
            <div className="prose prose-sm max-w-none text-sm text-foreground leading-relaxed whitespace-pre-line">
              {debrief}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Public component ──

interface Props {
  gabrielDebrief: string | null;
  miguelDebrief: string | null;
  skillScoresJson: string | null;
  meetingLead: string | null;
}

export function CoachingDebriefSection({
  gabrielDebrief,
  miguelDebrief,
  skillScoresJson,
  meetingLead,
}: Props) {
  const allScores = tryParseJSON<PersonSkillScores[]>(skillScoresJson, []);
  const gabrielScores = allScores.find((s) => s.person === "Gabriel") ?? null;
  const miguelScores = allScores.find((s) => s.person === "Miguel") ?? null;

  const showGabriel =
    !!(gabrielDebrief || gabrielScores) &&
    (meetingLead === "Gabriel" || meetingLead === "Both");
  const showMiguel =
    !!(miguelDebrief || miguelScores) &&
    (meetingLead === "Miguel" || meetingLead === "Both");

  if (!showGabriel && !showMiguel) return null;

  return (
    <div className="space-y-4">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">
        Coaching Debriefs
      </h2>
      <div className={cn("grid gap-4", showGabriel && showMiguel ? "lg:grid-cols-2" : "")}>
        {showGabriel && (
          <PersonDebrief
            name="Gabriel"
            debrief={gabrielDebrief}
            skillScores={gabrielScores}
            color="bg-blue-50 dark:bg-blue-950/30"
          />
        )}
        {showMiguel && (
          <PersonDebrief
            name="Miguel"
            debrief={miguelDebrief}
            skillScores={miguelScores}
            color="bg-violet-50 dark:bg-violet-950/30"
          />
        )}
      </div>
    </div>
  );
}
