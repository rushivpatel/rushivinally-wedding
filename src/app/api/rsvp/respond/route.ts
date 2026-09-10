import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";

const VALID_STATUSES = new Set(["attending", "not_attending", "undecided"]);

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const guestId = typeof body?.guestId === "string" ? body.guestId : null;
  const eventSlug = typeof body?.eventSlug === "string" ? body.eventSlug : null;
  const status = typeof body?.status === "string" ? body.status : null;

  if (!guestId || !eventSlug || !status || !VALID_STATUSES.has(status)) {
    return NextResponse.json({ error: "Missing or invalid fields" }, { status: 400 });
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
      status,
      responded_at: new Date().toISOString(),
    },
    { onConflict: "guest_id,event_id" }
  );

  if (upsertError) {
    return NextResponse.json({ error: "Failed to save response" }, { status: 500 });
  }

  // Recompute this guest's overall status from their full set of responses —
  // confirmed if attending anything, declined only once every invite has
  // been answered "not_attending". A mix (including any pending/undecided)
  // leaves status untouched, so a manual override in Table Editor doesn't
  // get clobbered back to "invited" just because not everything's answered.
  const { data: allInvites } = await supabaseServer
    .from("guest_event_invites")
    .select("status")
    .eq("guest_id", guestId);

  let guestStatus: "confirmed" | "declined" | null = null;
  if (allInvites?.some((row) => row.status === "attending")) {
    guestStatus = "confirmed";
  } else if (allInvites && allInvites.length > 0 && allInvites.every((row) => row.status === "not_attending")) {
    guestStatus = "declined";
  }

  if (guestStatus) {
    await supabaseServer.from("guests").update({ status: guestStatus }).eq("id", guestId);
  }

  return NextResponse.json({ success: true });
}
