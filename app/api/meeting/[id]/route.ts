import { NextResponse } from "next/server";
import {
  fetchMeeting,
  fetchGoalsByIds,
  fetchProjectsByIds,
  fetchOffersByIds,
} from "@/lib/queries";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/meeting/:id  →  full meeting + linked goals + linked project(s) + linked offers
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  try {
    const meeting = await fetchMeeting(id);
    const [goals, projects, offers] = await Promise.all([
      meeting.relatedGoalIds.length
        ? fetchGoalsByIds(meeting.relatedGoalIds)
        : Promise.resolve([]),
      meeting.relatedProjectIds.length
        ? fetchProjectsByIds(meeting.relatedProjectIds)
        : Promise.resolve([]),
      meeting.relatedOfferIds?.length
        ? fetchOffersByIds(meeting.relatedOfferIds)
        : Promise.resolve([]),
    ]);
    return NextResponse.json({ ok: true, meeting, goals, projects, offers });
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
