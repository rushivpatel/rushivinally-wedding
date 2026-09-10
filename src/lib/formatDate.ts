/**
 * e.g. "02.19.2027" — computed against Pacific time regardless of the
 * viewer's (or server's) own timezone.
 */
export function formatDateShort(dateTime: string): string {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Los_Angeles",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date(dateTime));

  const lookup = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${lookup.month}.${lookup.day}.${lookup.year}`;
}

const DEFAULT_TIME_ZONE = "America/Los_Angeles";

/**
 * e.g. "Saturday, February 20, 2027 · 10:00 AM" — computed in the given
 * IANA timezone (defaults to Pacific). Each event carries its own
 * timezone rather than everything being converted to Pacific, since a
 * guest attending an out-of-town event should see that event's own
 * local time, not a Pacific-converted equivalent.
 */
export function formatEventDateTime(dateTime: string, timeZone: string = DEFAULT_TIME_ZONE): string {
  const date = new Date(dateTime);

  const datePart = new Intl.DateTimeFormat("en-US", {
    timeZone,
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(date);

  const timePart = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hour: "numeric",
    minute: "2-digit",
  }).format(date);

  return `${datePart} · ${timePart}`;
}

/** e.g. "Saturday, February 20, 2027" — date only, no time, in the
 *  given IANA timezone (defaults to Pacific). */
export function formatEventDate(dateTime: string, timeZone: string = DEFAULT_TIME_ZONE): string {
  return new Intl.DateTimeFormat("en-US", {
    timeZone,
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(new Date(dateTime));
}

/** e.g. "10:00 AM" — time only, no date, in the given IANA timezone
 *  (defaults to Pacific). */
export function formatEventTime(dateTime: string, timeZone: string = DEFAULT_TIME_ZONE): string {
  return new Intl.DateTimeFormat("en-US", {
    timeZone,
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(dateTime));
}

/** e.g. "2027-02-19" — a sortable/comparable calendar-day key in the
 *  given IANA timezone (defaults to Pacific), for grouping events that
 *  fall on the same day. */
export function getEventDateKey(dateTime: string, timeZone: string = DEFAULT_TIME_ZONE): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(dateTime));
}
