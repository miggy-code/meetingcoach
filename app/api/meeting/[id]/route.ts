import { NextResponse } from "next/server";
import {
  fetchMeeting,
  fetchGoalsByIds,
  fetchProjectsByIds,
} from "@/lib/queries";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/meeting/:id  →  full meeting + linked goals + linked project(s)
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  try {
    const meeting = await fetchMeeting(id);
    const [goals, projects] = await Promise.all([
      meeting.relatedGoalIds.length
        ? fetchGoalsByIds(meeting.relatedGoalIds)
        : Promise.resolve([]),
      meeting.relatedProjectIds.length
        ? fetchProjectsByIds(meeting.relatedProjectIds)
        : Promise.resolve([]),
    ]);
    return NextResponse.json({ ok: true, meeting, goals, projects });
  } catch (e) {
    console.error("GET /api/meeting/[id] failed", e);
    return NextResponse.json(
      {
        ok: false,
        error: e instanceof Error ? e.message : "Failed to load meeting.",
      },
      { status: 500 },
    );
  }
}
