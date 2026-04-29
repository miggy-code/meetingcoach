import { NextResponse } from "next/server";
import { promoteStepAction } from "@/app/actions";
import type { NextStepItem } from "@/lib/types";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  if (
    !body ||
    typeof body.meetingId !== "string" ||
    !body.step ||
    typeof body.step.description !== "string"
  ) {
    return NextResponse.json(
      { ok: false, error: "meetingId and step required" },
      { status: 400 },
    );
  }
  const result = await promoteStepAction({
    meetingId: body.meetingId,
    step: body.step as NextStepItem,
    status: body.status,
    priority: body.priority,
  });
  return NextResponse.json(result);
}
