/**
 * ============================================================
 * LOCATIONS — every physical place referenced anywhere on the
 * site (wedding venues, hotels, airports, restaurants, sights)
 * lives here, tagged by category. Other data files
 * (weddingDetails.ts, and later hotels.ts / localSpots.ts)
 * reference a location by its `id` instead of repeating
 * name/address/coordinates in multiple places.
 * ============================================================
 *
 * To add a new location:
 *   1. Copy the "NEW LOCATION" block at the bottom.
 *   2. Give it a unique `id` — lowercase, hyphens, no spaces
 *      (e.g. "the-ritz-carlton").
 *   3. Set `category` to one of: "venue" | "hotel" | "airport" |
 *      "restaurant" | "coffee" | "sightseeing" | "transit"
 *   4. Fill in name, address, and coordinates.
 *   5. Reference it elsewhere via that `id` (e.g. a
 *      WeddingEvent's `locationId`).
 *
 * coordinates (lat/lng):
 *   Right-click the location's pin in Google Maps and click the
 *   top entry — it copies "lat, lng". Paste the two numbers in.
 *
 * icon:
 *   Any icon name from lucide.dev/icons, in PascalCase (e.g. "Heart",
 *   "Bed", "Plane", "Utensils", "Coffee", "Camera", "Building2"). Used
 *   on map pins and sidebar cards. Optional — falls back to a plain
 *   pin icon if omitted or if the name doesn't match a real icon.
 */

export type LocationCategory =
  | "venue"
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

export const locations: Location[] = [
  {
    id: "fullerton-community-center",
    name: "Fullerton Community Center",
    category: "venue",
    address: "340 W Commonwealth Ave, Fullerton, CA 92832",
    coordinates: { lat: 33.86941135258817, lng: -117.930842408641 },
    description: "Grah Shanti/Haldo Venue",
    icon: "Heart",
  },

  {
    id: "diamond-bar-community-center",
    name: "Diamond Bar Community Center",
    category: "venue",
    address: "1600 Grand Ave, Diamond Bar, CA 91765",
    coordinates: { lat: 33.9988911000908, lng: -117.79766561341545 },
    description: "Wedding & Reception Venue",
    icon: "Heart",
  },

  {
    id: "lax-airport",
    name: "Los Angeles Airport (LAX)",
    category: "airport",
    address: "1 World Wy, Los Angeles, CA 90045",
    coordinates: { lat: 33.94275466594506, lng: -118.40362489189816 },
    description: "Los Angeles's Primary Gateway",
    icon: "Plane",
    detail1: "Drive Time: ~1 Hour",
    detail2: "Distance to Venue: ~50 Miles",
    detail3: "Direct flights from most domestic and international locations",
  },

  {
    id: "sna-airport",
    name: "Orange County (John Wayne) Airport (SNA)",
    category: "airport",
    address: "18601 Airport Way, Santa Ana, CA 92707",
    coordinates: { lat: 33.674995496901, lng: -117.86916664031813 },
    description: "Alternate Airport",
    icon: "Plane",
    detail1: "Drive Time: ~30 Mins",
    detail2: "Distance to Venue: ~30 Miles",
    detail3: "Airport has direct flights from Dallas and most medium/large US Cities",
  },

  {
    id: "ont-airport",
    name: "Ontario Airport (ONT)",
    category: "airport",
    address: "2900 E. Airport Drive, Ontario, CA 91761",
    coordinates: { lat: 34.05623754276412, lng: -117.59810292167565 },
    description: "Alternate Airport",
    icon: "Plane",
    detail1: "Drive Time: ~25 Mins",
    detail2: "Distance to Venue: ~20 Miles",
    detail3: "Airport has direct flights from Dallas and most medium/large US Cities",
  },

  {
    id: "lgb-airport",
    name: "Long Beach Airport (LGB)",
    category: "airport",
    address: "4100 Donald Douglas Dr, Long Beach, CA 90808",
    coordinates: { lat: 33.816159828092374, lng: -118.15119142523577 },
    description: "Alternate Airport",
    icon: "Plane",
    detail1: "Drive Time: ~1 Hour",
    detail2: "Distance to Venue: ~50 Miles",
    detail3: "Airport operates Southwest only flights",
  },

  {
    id: "holiday-inn-diamond-bar",
    name: "Holiday Inn Diamond Bar - Pomona by IHG",
    category: "hotel",
    address: "21725 Gateway Center Dr, Diamond Bar, CA 91765",
    coordinates: { lat: 34.00104267991714, lng: -117.8336538606396 },
    description: "Primary Hotel Option",
    icon: "Bed",
  },

  {
    id: "jay-bharat",
    name: "Jay Bharat",
    category: "restaurant",
    address: "18701 Pioneer Blvd, Artesia, CA 90701",
    coordinates: { lat: 33.861361083953085, lng: -118.08230945385903 },
    description: "Indian Restaurant",
    icon: "Utensils",
  },

  {
    id: "reborn-coffee",
    name: "Reborn Coffee",
    category: "coffee",
    address: "1138 S Diamond Bar Blvd, Diamond Bar, CA 91765",
    coordinates: { lat: 34.00270525631017, lng: -117.80979724551105 },
    icon: "Coffee",
  },


];

export function getLocationById(id: string): Location {
  const location = locations.find((loc) => loc.id === id);
  if (!location) {
    throw new Error(`Unknown location id: "${id}". Check src/data/locations.ts`);
  }
  return location;
}
