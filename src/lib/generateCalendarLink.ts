type CalendarEventInput = {
  name: string;
  dateTime: string;
  locationName: string;
  locationAddress: string;
  attireType?: string;
  attireColors?: string;
  durationHours?: number;
};

const WEDDING_SITE_URL = "https://vinallyandrushi.com";

/** DTSTART/DTEND/DTSTAMP want UTC in the form YYYYMMDDTHHMMSSZ. The
 *  source dateTime already carries the correct Pacific offset, so
 *  converting to UTC here preserves the real moment in time — every
 *  calendar app then displays it correctly in the viewer's own
 *  timezone, which is the standard way calendar invites behave. */
function formatIcsDate(date: Date): string {
  return date.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
}

function escapeIcsText(text: string): string {
  return text.replace(/([,;])/g, "\\$1").replace(/\n/g, "\\n");
}

/** Builds one VEVENT block (no VCALENDAR wrapper) — a .ics file can hold
 *  several of these under one VCALENDAR, which every major calendar app
 *  imports as separate entries. */
function buildVeventBlock({
  name,
  dateTime,
  locationName,
  locationAddress,
  attireType,
  attireColors,
  durationHours = 2,
}: CalendarEventInput): string {
  const start = new Date(dateTime);
  const end = new Date(start.getTime() + durationHours * 60 * 60 * 1000);

  const descriptionLines = [`Wedding Site: ${WEDDING_SITE_URL}`];
  if (attireType) descriptionLines.push(`Attire | ${attireType}`);
  if (attireColors) descriptionLines.push(attireColors);

  const lines = [
    "BEGIN:VEVENT",
    `UID:${crypto.randomUUID()}@vinallyandrushi.wedding`,
    `DTSTAMP:${formatIcsDate(new Date())}`,
    `DTSTART:${formatIcsDate(start)}`,
    `DTEND:${formatIcsDate(end)}`,
    `SUMMARY:${escapeIcsText(name)}`,
    `LOCATION:${escapeIcsText(`${locationName}, ${locationAddress}`)}`,
    `DESCRIPTION:${escapeIcsText(descriptionLines.join("\n"))}`,
    "END:VEVENT",
  ];

  return lines.join("\r\n");
}

function buildVcalendar(veventBlocks: string[]): string {
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Vinally & Rushi Wedding//EN",
    ...veventBlocks,
    "END:VCALENDAR",
  ].join("\r\n");
}

/** Triggers a file download via a Blob object URL rather than a data:
 *  URI + download attribute — Safari (including iOS) doesn't reliably
 *  honor `download` on data: URIs, but handles Blob URLs correctly. */
function downloadIcsBlob(icsContent: string, filename: string): void {
  const blob = new Blob([icsContent], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/** Triggers a native "Add to Calendar" flow for several events at once,
 *  bundled into a single .ics file — every major calendar app imports
 *  each VEVENT inside it as its own separate entry. */
export function downloadIcsFileForEvents(inputs: CalendarEventInput[]): void {
  const icsContent = buildVcalendar(inputs.map(buildVeventBlock));
  downloadIcsBlob(icsContent, "Vinally-and-Rushi-Wedding-Events.ics");
}
