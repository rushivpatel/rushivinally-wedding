const STORAGE_KEY = "vr-wedding-guest";

export type GuestSession = {
  guestId: string;
  householdId: string;
  guestName: string;
  invitedEventSlugs: string[];
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
}
