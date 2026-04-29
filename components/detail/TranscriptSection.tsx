"use client";

import { FileText } from "lucide-react";
import { Collapsible } from "@/components/ui/Collapsible";

export function TranscriptSection({ transcript }: { transcript: string | null }) {
  if (!transcript) return null;
  return (
    <Collapsible
      icon={<FileText className="h-4 w-4 text-subtle" />}
      label={`Full transcript (${transcript.length.toLocaleString()} chars)`}
      defaultOpen={false}
    >
      <pre className="scroll-pane max-h-96 overflow-auto whitespace-pre-wrap rounded-lg border bg-surface-2 p-4 font-mono text-xs leading-relaxed text-muted">
        {transcript}
      </pre>
    </Collapsible>
  );
}
