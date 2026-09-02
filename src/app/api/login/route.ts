import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";

type GuestRow = {
  id: string;
  full_name: string;
  email: string | null;
  household_id: string;
};

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const query = typeof body?.query === "string" ? body.query.trim() : "";

  if (!query) {
    return NextResponse.json({ match: null });
  }

  const normalized = query.toLowerCase();

  const { data: guests, error } = await supabaseServer
    .from("guests")
    .select("id, full_name, email, household_id");

  if (error) {
    return NextResponse.json({ match: null }, { status: 500 });
  }

  const guest = (guests as GuestRow[] | null)?.find(
    (g) =>
      g.full_name.trim().toLowerCase() === normalized ||
      (g.email && g.email.trim().toLowerCase() === normalized)
  );

  if (!guest) {
    return NextResponse.json({ match: null });
  }

  const { data: invites } = await supabaseServer
    .from("guest_event_invites")
    .select("events(slug)")
    .eq("guest_id", guest.id);

  const invitedEventSlugs = (invites ?? [])
    .map((row) => (row.events as unknown as { slug: string } | null)?.slug)
    .filter((slug): slug is string => Boolean(slug));

  return NextResponse.json({
    match: {
      guestId: guest.id,
      householdId: guest.household_id,
      guestName: guest.full_name,
      invitedEventSlugs,
    },
  });
}
