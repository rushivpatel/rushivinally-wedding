import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const guestId = typeof body?.guestId === "string" ? body.guestId : null;
  const message = typeof body?.message === "string" ? body.message : null;

  if (!guestId || message === null) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  const { error } = await supabaseServer.from("guests").update({ message }).eq("id", guestId);

  if (error) {
    return NextResponse.json({ error: "Failed to save message" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
