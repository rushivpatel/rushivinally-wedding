import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";

const VALID_STATUSES = new Set(["attending", "not_attending", "undecided"]);

/** Saves one named slot's answer for one event. */
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const guestId = typeof body?.guestId === "string" ? body.guestId : null;
  const slotId = typeof body?.slotId === "string" ? body.slotId : null;
  const eventSlug = typeof body?.eventSlug === "string" ? body.eventSlug : null;
  const status = typeof body?.status === "string" ? body.status : null;

  if (!guestId || !slotId || !eventSlug || !status || !VALID_STATUSES.has(status)) {
    return NextResponse.json({ error: "Missing or invalid fields" }, { status: 400 });
  }

  const { data: guest, error: guestError } = await supabaseServer
    .from("guests")
    .select("lock_rsvp")
    .eq("id", guestId)
    .maybeSingle();

  if (guestError || !guest) {
    return NextResponse.json({ error: "Guest not found" }, { status: 404 });
  }
  if (guest.lock_rsvp) {
    return NextResponse.json({ error: "RSVPs are locked" }, { status: 403 });
  }

  // The slot must belong to this guest.
  const { data: slot } = await supabaseServer
    .from("guest_slots")
    .select("id")
    .eq("id", slotId)
    .eq("guest_id", guestId)
    .maybeSingle();

  if (!slot) {
    return NextResponse.json({ error: "Slot not found" }, { status: 404 });
  }

  const { data: event } = await supabaseServer
    .from("events")
    .select("id")
    .eq("slug", eventSlug)
    .maybeSingle();

  if (!event) {
    return NextResponse.json({ error: "Event not found" }, { status: 404 });
  }

  // Slots inherit the login guest's events — they can only answer for an
  // event that guest is actually invited to.
  const { data: invite } = await supabaseServer
    .from("guest_event_invites")
    .select("id")
    .eq("guest_id", guestId)
    .eq("event_id", event.id)
    .maybeSingle();

  if (!invite) {
    return NextResponse.json({ error: "Not invited to this event" }, { status: 403 });
  }

  const { error } = await supabaseServer.from("guest_slot_invites").upsert(
    {
      slot_id: slotId,
      event_id: event.id,
      status,
      responded_at: new Date().toISOString(),
    },
    { onConflict: "slot_id,event_id" }
  );

  if (error) {
    return NextResponse.json({ error: "Failed to save response" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
