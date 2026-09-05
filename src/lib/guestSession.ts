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
