import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";
import { buildSessionPayload } from "@/lib/guestSessionServer";

/** Silent session refresh: re-reads a guest's current flags (hideRsvp,
 *  isSimpleInvite, invitedEventSlugs) by guestId, keyed off the id already
 *  cached client-side. Lets a change made in Supabase reach an already
 *  logged-in guest without them needing to log out or clear storage. */
export async function GET(request: Request) {
  const guestId = new URL(request.url).searchParams.get("guestId");

  if (!guestId) {
    return NextResponse.json({ match: null }, { status: 400 });
  }

  const { data: guest, error } = await supabaseServer
    .from("guests")
    .select("id, full_name, household_id, simple_invite, hide_rsvp, lock_rsvp")
    .eq("id", guestId)
    .maybeSingle();

  if (error || !guest) {
    return NextResponse.json({ match: null });
  }

  return NextResponse.json({ match: await buildSessionPayload(guest) });
}
