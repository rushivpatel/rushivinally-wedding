const STORAGE_KEY = "vr-wedding-guest";

/** Dispatched right after login writes a session, so already-mounted
 *  components (e.g. ScheduleClient, mounted behind the gate before
 *  login happens) can react without needing a page reload. */
export const GUEST_SESSION_EVENT = "vr-guest-session-updated";

export type GuestSession = {
  guestId: string;
  householdId: string;
  guestName: string;
  invitedEventSlugs: string[];
  isSimpleInvite: boolean;
  hideRsvp: boolean;
  lockRsvp: boolean;
};

export function getGuestSession(): GuestSession | null {
  if (typeof window === "undefined") return null;

  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed.guestId === "string") {
      return parsed as GuestSession;
    }
    return null;
  } catch {
    return null;
  }
}

export function setGuestSession(session: GuestSession): void {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
  window.dispatchEvent(new Event(GUEST_SESSION_EVENT));
}

/** Silently re-fetches the current guest's flags from Supabase and
 *  overwrites the cached session, so a change made in Supabase (e.g.
 *  flipping hideRsvp) reaches an already-logged-in guest without them
 *  needing to log out or clear storage. No-op if not logged in, or if
 *  the guest row can no longer be found (leaves the cached session as-is
 *  rather than logging them out over a transient error). */
export async function refreshGuestSession(): Promise<void> {
  const current = getGuestSession();
  if (!current) return;

  try {
    const response = await fetch(`/api/session?guestId=${current.guestId}`);
    const { match } = await response.json();
    if (match) {
      setGuestSession(match);
    }
  } catch {
    // Offline or transient failure — keep the existing cached session.
  }
}
