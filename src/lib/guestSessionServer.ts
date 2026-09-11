import "server-only";
import { supabaseServer } from "@/lib/supabaseServer";

type GuestRow = {
  id: string;
  full_name: string;
  household_id: string | null;
  simple_invite: boolean;
  hide_rsvp: boolean;
  lock_rsvp: boolean;
};

export type SessionPayload = {
  guestId: string;
  householdId: string | null;
  guestName: string;
  invitedEventSlugs: string[];
  isSimpleInvite: boolean;
  hideRsvp: boolean;
  lockRsvp: boolean;
};

/** Shared by /api/login (initial lookup by name/email) and /api/session
 *  (silent refresh by guestId) so both return the exact same session shape. */
export async function buildSessionPayload(guest: GuestRow): Promise<SessionPayload> {
  const { data: invites } = await supabaseServer
    .from("guest_event_invites")
    .select("events(slug)")
    .eq("guest_id", guest.id);

  const invitedEventSlugs = (invites ?? [])
    .map((row) => (row.events as unknown as { slug: string } | null)?.slug)
    .filter((slug): slug is string => Boolean(slug));

  return {
    guestId: guest.id,
    householdId: guest.household_id,
    guestName: guest.full_name,
    invitedEventSlugs,
    isSimpleInvite: guest.simple_invite,
    hideRsvp: guest.hide_rsvp,
    lockRsvp: guest.lock_rsvp,
  };
}
