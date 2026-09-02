type CalendarEventInput = {
  name: string;
  dateTime: string;
  locationName: string;
  locationAddress: string;
  attireType?: string;
  attireColors?: string;
  durationHours?: number;
};

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

function buildIcsContent({
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

  const descriptionParts: string[] = [];
  if (attireType) descriptionParts.push(`Dress Code: ${attireType}`);
  if (attireColors) descriptionParts.push(`Colors: ${attireColors}`);

  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Vinally & Rushi Wedding//EN",
    "BEGIN:VEVENT",
    `UID:${crypto.randomUUID()}@vinallyandrushi.wedding`,
    `DTSTAMP:${formatIcsDate(new Date())}`,
    `DTSTART:${formatIcsDate(start)}`,
    `DTEND:${formatIcsDate(end)}`,
    `SUMMARY:${escapeIcsText(name)}`,
    `LOCATION:${escapeIcsText(`${locationName}, ${locationAddress}`)}`,
    ...(descriptionParts.length
      ? [`DESCRIPTION:${escapeIcsText(descriptionParts.join(" · "))}`]
      : []),
    "END:VEVENT",
    "END:VCALENDAR",
  ];

  return lines.join("\r\n");
}

/** Triggers a native "Add to Calendar" flow via a downloaded .ics file.
 *  Uses a Blob object URL rather than a data: URI + download attribute —
 *  Safari (including iOS) doesn't reliably honor `download` on data:
 *  URIs, but handles Blob URLs correctly. */
export function downloadIcsFile(input: CalendarEventInput): void {
  const icsContent = buildIcsContent(input);
  const blob = new Blob([icsContent], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = `${input.name.replace(/[^a-z0-9]+/gi, "-")}.ics`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
