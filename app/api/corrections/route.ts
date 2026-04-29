import { NextResponse } from "next/server";
import { applyCorrectionAction } from "@/app/actions";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  if (
    !body ||
    typeof body.meetingId !== "string" ||
    typeof body.field !== "string" ||
    typeof body.fieldUpdate !== "object"
  ) {
    return NextResponse.json(
      { ok: false, error: "meetingId, field, fieldUpdate required" },
      { status: 400 },
    );
  }
  const result = await applyCorrectionAction({
    meetingId: body.meetingId,
    field: body.field,
    newValue: body.newValue,
    fieldUpdate: body.fieldUpdate as Record<string, unknown>,
  });
  return NextResponse.json(result);
}
