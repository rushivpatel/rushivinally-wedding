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

/**
 * e.g. "Saturday, February 20, 2027 · 10:00 AM" — computed against
 * Pacific time regardless of the viewer's (or server's) own timezone.
 */
export function formatEventDateTime(dateTime: string): string {
  const date = new Date(dateTime);

  const datePart = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Los_Angeles",
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(date);

  const timePart = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Los_Angeles",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);

  return `${datePart} · ${timePart}`;
}

/** e.g. "Saturday, February 20, 2027" — date only, no time. */
export function formatEventDate(dateTime: string): string {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Los_Angeles",
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(new Date(dateTime));
}

/** e.g. "10:00 AM" — time only, no date. */
export function formatEventTime(dateTime: string): string {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Los_Angeles",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(dateTime));
}

/** e.g. "2027-02-19" — a sortable/comparable calendar-day key in
 *  Pacific time, for grouping events that fall on the same day. */
export function getEventDateKey(dateTime: string): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Los_Angeles",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(dateTime));
}
