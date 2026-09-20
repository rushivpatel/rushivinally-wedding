import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";

const MAX_NAME_LENGTH = 100;

/** Names (or renames, or clears) one open-invite slot. A blank name deletes
 *  the slot, which cascades away its per-event responses. */
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const guestId = typeof body?.guestId === "string" ? body.guestId : null;
  const slotNumber = Number.isInteger(body?.slotNumber) ? (body.slotNumber as number) : null;
  const fullName = typeof body?.fullName === "string" ? body.fullName.trim() : null;

  if (!guestId || slotNumber === null || fullName === null || fullName.length > MAX_NAME_LENGTH) {
    return NextResponse.json({ error: "Missing or invalid fields" }, { status: 400 });
  }

  const { data: guest, error: guestError } = await supabaseServer
    .from("guests")
    .select("open_slots, lock_rsvp")
    .eq("id", guestId)
    .maybeSingle();

  if (guestError || !guest) {
    return NextResponse.json({ error: "Guest not found" }, { status: 404 });
  }
  if (guest.lock_rsvp) {
    return NextResponse.json({ error: "RSVPs are locked" }, { status: 403 });
  }
  if (!guest.open_slots || slotNumber < 1 || slotNumber > guest.open_slots) {
    return NextResponse.json({ error: "Invalid slot" }, { status: 400 });
  }

  if (fullName === "") {
    const { error } = await supabaseServer
      .from("guest_slots")
      .delete()
      .eq("guest_id", guestId)
      .eq("slot_number", slotNumber);
    if (error) return NextResponse.json({ error: "Failed to clear slot" }, { status: 500 });
    return NextResponse.json({ slot: null });
  }

  const { data: slot, error } = await supabaseServer
    .from("guest_slots")
    .upsert(
      {
        guest_id: guestId,
        slot_number: slotNumber,
        full_name: fullName,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "guest_id,slot_number" }
    )
    .select("id, slot_number, full_name")
    .single();

  if (error || !slot) {
    return NextResponse.json({ error: "Failed to save name" }, { status: 500 });
  }

  return NextResponse.json({
    slot: { slotId: slot.id, slotNumber: slot.slot_number, fullName: slot.full_name },
  });
}
