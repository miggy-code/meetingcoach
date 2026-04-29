"use client";

import { Collapsible } from "@/components/ui/Collapsible";

export function ImprovementAreas({ areas }: { areas: string | null }) {
  if (!areas || !areas.trim()) return null;
  const lines = areas
    .split(/\r?\n/)
    .map((l) => l.replace(/^[-*•]\s*/, "").trim())
    .filter(Boolean);
  return (
    <Collapsible label="Improvement areas" defaultOpen={false}>
      <ul className="list-disc space-y-1.5 pl-5 text-sm text-muted">
        {lines.map((line, i) => (
          <li key={i}>{line}</li>
        ))}
      </ul>
    </Collapsible>
  );
}
