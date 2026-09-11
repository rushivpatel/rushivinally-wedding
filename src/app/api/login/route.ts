import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";
import { buildSessionPayload } from "@/lib/guestSessionServer";

type GuestRow = {
  id: string;
  full_name: string;
  email: string | null;
  household_id: string | null;
  simple_invite: boolean;
  hide_rsvp: boolean;
  lock_rsvp: boolean;
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
    .select("id, full_name, email, household_id, simple_invite, hide_rsvp, lock_rsvp");

  if (error) {
    return NextResponse.json({ match: null }, { status: 500 });
  }

  const matches = (guests as GuestRow[] | null)?.filter(
    (g) =>
      g.full_name.trim().toLowerCase() === normalized ||
      (g.email && g.email.trim().toLowerCase() === normalized)
  ) ?? [];

  if (matches.length > 1) {
    return NextResponse.json({ match: null, ambiguous: true });
  }

  const guest = matches[0];

  if (!guest) {
    return NextResponse.json({ match: null });
  }

  return NextResponse.json({ match: await buildSessionPayload(guest) });
}
