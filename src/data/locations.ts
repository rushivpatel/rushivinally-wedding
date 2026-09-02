import "server-only";
import { supabaseServer } from "@/lib/supabaseServer";

/**
 * ============================================================
 * LOCATIONS — "things to do" reference data (hotels, airports,
 * restaurants, sightseeing) shown on the Travel and Things to Do
 * pages, tagged by category. Backed by the Supabase `locations`
 * table — add/edit rows there directly, no code change needed.
 * Wedding venues live on each row in the `events` table instead,
 * since a venue is only ever needed alongside its event.
 * ============================================================
 */

export type LocationCategory =
  | "hotel"
  | "airport"
  | "restaurant"
  | "coffee"
  | "sightseeing";

export type Location = {
  id: string;
  name: string;
  category: LocationCategory;
  address: string;
  coordinates: { lat: number; lng: number };
  description?: string;
  icon: string;
  detail1?: string;
  detail2?: string;
  detail3?: string;
};

type LocationRow = {
  id: string;
  name: string;
  category: LocationCategory;
  address: string;
  lat: number;
  lng: number;
  description: string | null;
  icon: string;
  detail1: string | null;
  detail2: string | null;
  detail3: string | null;
};

export async function getLocations(): Promise<Location[]> {
  const { data, error } = await supabaseServer.from("locations").select("*");
  if (error) throw error;

  return (data as LocationRow[]).map((row) => ({
    id: row.id,
    name: row.name,
    category: row.category,
    address: row.address,
    coordinates: { lat: row.lat, lng: row.lng },
    description: row.description ?? undefined,
    icon: row.icon,
    detail1: row.detail1 ?? undefined,
    detail2: row.detail2 ?? undefined,
    detail3: row.detail3 ?? undefined,
  }));
}
