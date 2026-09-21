import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";

const MAX_LENGTH = 300;

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const guestId = typeof body?.guestId === "string" ? body.guestId : null;
  const dietary = typeof body?.dietary === "string" ? body.dietary.trim() : null;

  if (!guestId || dietary === null || dietary.length > MAX_LENGTH) {
    return NextResponse.json({ error: "Missing or invalid fields" }, { status: 400 });
  }

  const { error } = await supabaseServer
    .from("guests")
    .update({ dietary_restrictions: dietary === "" ? null : dietary })
    .eq("id", guestId);

  if (error) {
    return NextResponse.json({ error: "Failed to save dietary restrictions" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
