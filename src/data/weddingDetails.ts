/**
 * ============================================================
 * WEDDING DETAILS RUBRIC — fill in every REPLACE_... value below
 * and save. The Welcome page reads directly from this file, so
 * changes show up as soon as you save (refresh the browser).
 * ============================================================
 *
 * DATE/TIME FORMAT (dateTime field):
 *   "YYYY-MM-DDTHH:MM:SS±HH:MM"  (24-hour clock, Pacific Time)
 *
 *   Use offset -07:00 if the event falls between mid-March and
 *   early November (Pacific Daylight Time).
 *   Use offset -08:00 if the event falls between early November
 *   and mid-March (Pacific Standard Time).
 *
 *   Example — 4:00 PM on June 12, 2027 (PDT):
 *     "2027-06-12T16:00:00-07:00"
 *
 * isPrimaryEvent:
 *   Set this to `true` on exactly ONE of the three events below —
 *   the homepage countdown timer counts down to that event. It's
 *   currently set on Event 2 (typically the Ceremony); move it if
 *   a different event should be the countdown target.
 *
 * locationId:
 *   Points at an entry in src/data/locations.ts instead of storing
 *   the venue's name/address/coordinates here directly. If the venue
 *   isn't in that file yet, add it there first (see the rubric at
 *   the top of locations.ts), then reference its `id` here.
 */

export const weddingLocation = {
  city: "Diamond Bar", // e.g. "Napa"
  state: "California", // e.g. "California"
};

export type WeddingEvent = {
  eventid: string;
  name: string;
  locationId: string;
  dateTime: string;
  attireColors: string;
  attireType: string;
  isPrimaryEvent?: boolean;
};

export const weddingEvents: WeddingEvent[] = [
  {
    // ---- EVENT 1a ----
    eventid: "vinally-grah-shanti",
    name: "Vinally's Grah Shanti",
    locationId: "fullerton-community-center",
    dateTime: "2027-02-14T09:30:00-08:00",
    attireColors: "REPLACE_EVENT_1_COLORS", // e.g. "Navy, sage green, warm neutrals"
    attireType: "Indian", // e.g. "Cocktail attire"
  },
  {
    // ---- EVENT 1b ----
    eventid: "rushi-grah-shanti",
    name: "Rushi's Grah Shanti", // e.g. "Welcome Drinks"
    locationId: "fullerton-community-center",
    dateTime: "2027-02-19T09:30:00-08:00",
    attireColors: "REPLACE_EVENT_1_COLORS", // e.g. "Navy, sage green, warm neutrals"
    attireType: "Indian", // e.g. "Cocktail attire"
  },
  {
    // ---- EVENT 1c ----
    eventid: "haldi-pithi",
    name: "Haldi & Pithi", // e.g. "Welcome Drinks"
    locationId: "fullerton-community-center",
    dateTime: "2027-02-19T09:30:00-08:00",
    attireColors: "REPLACE_EVENT_1_COLORS", // e.g. "Navy, sage green, warm neutrals"
    attireType: "Indian", // e.g. "Cocktail attire"
  },
  {
    // ---- EVENT 2 ----
    eventid: "wedding",
    name: "Wedding", // e.g. "Ceremony"
    locationId: "diamond-bar-community-center",
    dateTime: "2027-02-20T10:00:00-08:00",
    attireColors: "REPLACE_EVENT_2_COLORS",
    attireType: "Indian",
    isPrimaryEvent: true,
  },
  {
    // ---- EVENT 3 ----
    eventid: "reception-garba",
    name: "Reception & Garba", // e.g. "Reception"
    locationId: "diamond-bar-community-center",
    dateTime: "2027-02-20T17:00:00-08:00",
    attireColors: "REPLACE_EVENT_3_COLORS",
    attireType: "Indian/Indo-Western/Western Formal",
  },
];

export function getPrimaryEvent(): WeddingEvent {
  return weddingEvents.find((event) => event.isPrimaryEvent) ?? weddingEvents[0];
}
