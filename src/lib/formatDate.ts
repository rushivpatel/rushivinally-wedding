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
