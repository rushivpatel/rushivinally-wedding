import "server-only";
import { supabaseServer } from "@/lib/supabaseServer";

/**
 * ============================================================
 * WEDDING EVENTS — backed by the Supabase `events` table. Add,
 * edit, or reorder events (via `sort_order`) directly in Supabase,
 * no code change needed. Exactly one row should have
 * `is_primary_event = true` — the homepage countdown targets it.
 *
 * An event can carry `segments` (from `event_segments`) — purely
 * descriptive sub-times shown on the Schedule page under the
 * event's heading (e.g. Wedding -> Baraat, Wedding Ceremony).
 * Segments aren't individually invitable; guests are invited to
 * the parent event as a whole.
 * ============================================================
 */

export const weddingLocation = {
  city: "Diamond Bar",
  state: "California",
};

export type EventSegment = {
  name: string;
  dateTime: string;
};

export type WeddingEvent = {
  eventid: string;
  name: string;
  locationName: string;
  locationAddress: string;
  coordinates: { lat: number; lng: number };
  dateTime: string;
  attireColors: string;
  attireType: string;
  isPrimaryEvent: boolean;
  segments: EventSegment[];
};

type EventRow = {
  slug: string;
  name: string;
  location_name: string;
  location_address: string;
  location_lat: number;
  location_lng: number;
  event_datetime: string;
  attire_colors: string | null;
  attire_type: string | null;
  is_primary_event: boolean;
  sort_order: number;
  event_segments: {
    name: string;
    segment_datetime: string;
    sort_order: number;
  }[];
};

export async function getWeddingEvents(): Promise<WeddingEvent[]> {
  const { data, error } = await supabaseServer
    .from("events")
    .select("*, event_segments(name, segment_datetime, sort_order)")
    .order("sort_order", { ascending: true });
  if (error) throw error;

  return (data as EventRow[]).map((row) => ({
    eventid: row.slug,
    name: row.name,
    locationName: row.location_name,
    locationAddress: row.location_address,
    coordinates: { lat: row.location_lat, lng: row.location_lng },
    dateTime: row.event_datetime,
    attireColors: row.attire_colors ?? "",
    attireType: row.attire_type ?? "",
    isPrimaryEvent: row.is_primary_event,
    segments: (row.event_segments ?? [])
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((segment) => ({ name: segment.name, dateTime: segment.segment_datetime })),
  }));
}

export async function getPrimaryEvent(): Promise<WeddingEvent> {
  const events = await getWeddingEvents();
  return events.find((event) => event.isPrimaryEvent) ?? events[0];
}
