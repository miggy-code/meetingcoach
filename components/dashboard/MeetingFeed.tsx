"use client";

import { useState } from "react";
import type { MeetingNote } from "@/lib/types";
import { MeetingRow } from "./MeetingRow";

export function MeetingFeed({
  meetings,
  allMeetings,
}: {
  meetings: MeetingNote[];
  allMeetings: MeetingNote[];
}) {
  const [showAll, setShowAll] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const list = showAll ? allMeetings : meetings;

  return (
    <div className="rounded-xl border bg-surface">
      {list.length === 0 ? (
        <div className="px-6 py-12 text-center text-sm text-muted">
          {showAll
            ? "No meetings in Airtable yet."
            : "No meetings in the last 14 days. Toggle View All to see everything."}
        </div>
      ) : (
        <ul className="divide-y">
          {list.map((m, i) => (
            <MeetingRow
              key={m.id}
              meeting={m}
              isExpanded={expandedId === m.id}
              onToggle={() =>
                setExpandedId((prev) => (prev === m.id ? null : m.id))
              }
              isAlt={i % 2 === 1}
            />
          ))}
        </ul>
      )}
      <button
        type="button"
        onClick={() => {
          setShowAll((v) => !v);
          setExpandedId(null);
        }}
        className="block w-full border-t px-6 py-3 text-center text-xs font-medium text-muted hover:bg-surface-2 hover:text-text"
      >
        {showAll
          ? `← Show only last 14 days (${meetings.length})`
          : `View all meetings (${allMeetings.length}) →`}
      </button>
    </div>
  );
}
