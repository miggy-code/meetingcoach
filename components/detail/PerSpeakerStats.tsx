"use client";

import type { SpeakerStat } from "@/lib/types";
import { tryParseJSON } from "@/lib/utils";

interface Props {
  perSpeakerStatsJson: string | null;
}

export function PerSpeakerStats({ perSpeakerStatsJson }: Props) {
  const stats = tryParseJSON<SpeakerStat[]>(perSpeakerStatsJson, []);
  if (!stats || stats.length === 0) return null;

  return (
    <div>
      <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted">
        Speaker Breakdown
      </h3>
      <div className="space-y-3">
        {stats.map((s) => (
          <div key={s.speaker} className="rounded-lg border bg-surface-2/40 p-3">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-sm font-medium text-foreground">{s.speaker}</span>
              <span className="text-xs font-semibold text-accent">
                {s.talkPercentage}%
              </span>
            </div>
            {/* Talk-time bar */}
            <div className="mb-2 h-1.5 w-full overflow-hidden rounded-full bg-surface-3">
              <div
                className="h-full rounded-full bg-accent transition-all"
                style={{ width: `${Math.min(s.talkPercentage, 100)}%` }}
              />
            </div>
            <div className="flex gap-4 text-xs text-muted">
              <span>Longest mono: {s.longestMonologue}</span>
              <span>·</span>
              <span>Questions: {s.questionsAsked}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
