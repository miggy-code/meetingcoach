import { NextResponse } from "next/server";
import { regenEmailAction } from "@/app/actions";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const meetingId = body?.meetingId;
  if (typeof meetingId !== "string") {
    return NextResponse.json(
      { ok: false, error: "meetingId required" },
      { status: 400 },
    );
  }
  const result = await regenEmailAction(meetingId);
  return NextResponse.json(result, { status: result.ok ? 200 : 400 });
}
