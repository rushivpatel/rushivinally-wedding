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
    .select("id, household_id")
    .eq("id", guestId)
    .maybeSingle();

  if (selfError || !self) {
    return NextResponse.json({ error: "Guest not found" }, { status: 404 });
  }

  const householdQuery = self.household_id
    ? supabaseServer.from("guests").select("id, full_name, message").eq("household_id", self.household_id)
    : supabaseServer.from("guests").select("id, full_name, message").eq("id", guestId);

  const { data: householdGuests, error: guestsError } = await householdQuery;

  if (guestsError || !householdGuests) {
    return NextResponse.json({ error: "Failed to load household" }, { status: 500 });
  }

  const guestIds = householdGuests.map((g) => g.id);

  const { data: invites, error: invitesError } = await supabaseServer
    .from("guest_event_invites")
    .select("guest_id, attending, events(slug)")
    .in("guest_id", guestIds);

  if (invitesError) {
    return NextResponse.json({ error: "Failed to load invites" }, { status: 500 });
  }

  return NextResponse.json({
    guests: householdGuests.map((g) => ({
      guestId: g.id,
      fullName: g.full_name,
      message: g.message,
    })),
    invites: (invites ?? []).map((row) => ({
      guestId: row.guest_id,
      eventSlug: (row.events as unknown as { slug: string } | null)?.slug ?? "",
      attending: row.attending as boolean | null,
    })),
  });
}
