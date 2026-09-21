import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const guestId = searchParams.get("guestId");

  if (!guestId) {
    return NextResponse.json({ error: "Missing guestId" }, { status: 400 });
  }

  const { data: self, error: selfError } = await supabaseServer
    .from("guests")
    .select("id, household_id, open_slots")
    .eq("id", guestId)
    .maybeSingle();

  if (selfError || !self) {
    return NextResponse.json({ error: "Guest not found" }, { status: 404 });
  }

  const householdQuery = self.household_id
    ? supabaseServer.from("guests").select("id, full_name, message, dietary_restrictions, in_memoriam").eq("household_id", self.household_id)
    : supabaseServer.from("guests").select("id, full_name, message, dietary_restrictions, in_memoriam").eq("id", guestId);

  const { data: householdGuests, error: guestsError } = await householdQuery;

  if (guestsError || !householdGuests) {
    return NextResponse.json({ error: "Failed to load household" }, { status: 500 });
  }

  const guestIds = householdGuests.map((g) => g.id);

  const { data: invites, error: invitesError } = await supabaseServer
    .from("guest_event_invites")
    .select("guest_id, status, events(slug)")
    .in("guest_id", guestIds);

  if (invitesError) {
    return NextResponse.json({ error: "Failed to load invites" }, { status: 500 });
  }

  // Open-invite guests (open_slots set) also get their named slots and each
  // slot's per-event answers.
  const openSlots: number | null = self.open_slots ?? null;
  let slots: { slotId: string; slotNumber: number; fullName: string }[] = [];
  let slotInvites: { slotId: string; eventSlug: string; status: string }[] = [];

  if (openSlots) {
    const { data: slotRows, error: slotsError } = await supabaseServer
      .from("guest_slots")
      .select("id, slot_number, full_name")
      .eq("guest_id", guestId)
      .order("slot_number");

    if (slotsError) {
      return NextResponse.json({ error: "Failed to load slots" }, { status: 500 });
    }

    slots = (slotRows ?? []).map((row) => ({
      slotId: row.id,
      slotNumber: row.slot_number,
      fullName: row.full_name,
    }));

    if (slots.length > 0) {
      const { data: slotInviteRows, error: slotInvitesError } = await supabaseServer
        .from("guest_slot_invites")
        .select("slot_id, status, events(slug)")
        .in("slot_id", slots.map((s) => s.slotId));

      if (slotInvitesError) {
        return NextResponse.json({ error: "Failed to load slot responses" }, { status: 500 });
      }

      slotInvites = (slotInviteRows ?? []).map((row) => ({
        slotId: row.slot_id,
        eventSlug: (row.events as unknown as { slug: string } | null)?.slug ?? "",
        status: row.status,
      }));
    }
  }

  return NextResponse.json({
    openSlots,
    slots,
    slotInvites,
    guests: householdGuests.map((g) => ({
      guestId: g.id,
      fullName: g.full_name,
      message: g.message,
      dietary: g.dietary_restrictions,
      inMemoriam: g.in_memoriam === true,
    })),
    invites: (invites ?? []).map((row) => ({
      guestId: row.guest_id,
      eventSlug: (row.events as unknown as { slug: string } | null)?.slug ?? "",
      status: row.status as "attending" | "not_attending" | "undecided" | null,
    })),
  });
}
