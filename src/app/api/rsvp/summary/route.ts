import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";

/** The one household allowed to see the all-guests RSVP summary. */
const MASTER_HOUSEHOLD = "master";

type Status = "attending" | "not_attending" | "undecided" | null;

/** Everything the master RSVP summary needs, gated server-side on the
 *  requesting guest actually belonging to the master household (the client
 *  check is only for choosing what to render). Deliberately leaves out
 *  emails, phone numbers and addresses — this is a response tracker. */
export async function GET(request: Request) {
  const guestId = new URL(request.url).searchParams.get("guestId");
  if (!guestId) {
    return NextResponse.json({ error: "Missing guestId" }, { status: 400 });
  }

  const { data: self } = await supabaseServer
    .from("guests")
    .select("household_id")
    .eq("id", guestId)
    .maybeSingle();

  if (!self || self.household_id !== MASTER_HOUSEHOLD) {
    return NextResponse.json({ error: "Not allowed" }, { status: 403 });
  }

  const [guestsRes, invitesRes, slotsRes, slotInvitesRes] = await Promise.all([
    supabaseServer
      .from("guests")
      .select(
        "id, household_id, full_name, side, relation_label, is_child, in_memoriam, dietary_restrictions, message, open_slots, digital_save_the_date_sent, physical_save_the_date_sent, invite_sent"
      )
      .or(`household_id.is.null,household_id.neq.${MASTER_HOUSEHOLD}`),
    supabaseServer.from("guest_event_invites").select("guest_id, status, events(slug)"),
    supabaseServer.from("guest_slots").select("id, guest_id, slot_number, full_name"),
    supabaseServer.from("guest_slot_invites").select("slot_id, status, events(slug)"),
  ]);

  if (guestsRes.error || invitesRes.error || slotsRes.error || slotInvitesRes.error) {
    return NextResponse.json({ error: "Failed to load summary" }, { status: 500 });
  }

  const slug = (row: { events: unknown }) => (row.events as { slug: string } | null)?.slug ?? "";
  const guestIds = new Set((guestsRes.data ?? []).map((g) => g.id));

  return NextResponse.json({
    guests: (guestsRes.data ?? []).map((g) => ({
      guestId: g.id,
      householdId: g.household_id as string | null,
      fullName: g.full_name,
      side: g.side as string | null,
      relationLabel: g.relation_label as string | null,
      isChild: g.is_child as boolean,
      inMemoriam: g.in_memoriam === true,
      dietary: g.dietary_restrictions as string | null,
      message: g.message as string | null,
      openSlots: g.open_slots as number | null,
      digitalSent: g.digital_save_the_date_sent as boolean,
      physicalSent: g.physical_save_the_date_sent as boolean,
      inviteSent: g.invite_sent as boolean,
    })),
    invites: (invitesRes.data ?? [])
      .filter((r) => guestIds.has(r.guest_id))
      .map((r) => ({ guestId: r.guest_id, eventSlug: slug(r), status: r.status as Status })),
    slots: (slotsRes.data ?? [])
      .filter((s) => guestIds.has(s.guest_id))
      .map((s) => ({
        slotId: s.id,
        guestId: s.guest_id,
        slotNumber: s.slot_number,
        fullName: s.full_name,
      })),
    slotInvites: (slotInvitesRes.data ?? []).map((r) => ({
      slotId: r.slot_id,
      eventSlug: slug(r),
      status: r.status as Status,
    })),
  });
}
