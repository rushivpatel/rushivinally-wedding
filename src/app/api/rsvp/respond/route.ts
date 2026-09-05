import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const guestId = typeof body?.guestId === "string" ? body.guestId : null;
  const eventSlug = typeof body?.eventSlug === "string" ? body.eventSlug : null;
  const attending = typeof body?.attending === "boolean" ? body.attending : null;

  if (!guestId || !eventSlug || attending === null) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  const { data: event, error: eventError } = await supabaseServer
    .from("events")
    .select("id")
    .eq("slug", eventSlug)
    .maybeSingle();

  if (eventError || !event) {
    return NextResponse.json({ error: "Event not found" }, { status: 404 });
  }

  const { error: upsertError } = await supabaseServer.from("guest_event_invites").upsert(
    {
      guest_id: guestId,
      event_id: event.id,
      attending,
      responded_at: new Date().toISOString(),
    },
    { onConflict: "guest_id,event_id" }
  );

  if (upsertError) {
    return NextResponse.json({ error: "Failed to save response" }, { status: 500 });
  }

  // Recompute this guest's overall status from their full set of responses —
  // confirmed if attending anything, declined only once every invite has
  // been answered "no". Otherwise leave status untouched (e.g. a manual
  // override in Table Editor shouldn't get clobbered back to "invited").
  const { data: allInvites } = await supabaseServer
    .from("guest_event_invites")
    .select("attending")
    .eq("guest_id", guestId);

  let status: "confirmed" | "declined" | null = null;
  if (allInvites?.some((row) => row.attending === true)) {
    status = "confirmed";
  } else if (allInvites && allInvites.length > 0 && allInvites.every((row) => row.attending === false)) {
    status = "declined";
  }

  if (status) {
    await supabaseServer.from("guests").update({ status }).eq("id", guestId);
  }

  return NextResponse.json({ success: true });
}
