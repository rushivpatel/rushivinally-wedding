"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { Navigation } from "lucide-react";
import type { Location, LocationCategory } from "@/data/locations";
import LocationIcon from "@/components/LocationIcon";
import { generateMapsLink } from "@/lib/generateMapsLink";

const MapComponent = dynamic(() => import("@/components/MapComponent"), {
  ssr: false,
});

const CATEGORY_LABELS: Record<LocationCategory, string> = {
  hotel: "Hotel",
  airport: "Airport",
  restaurant: "Restaurant",
  coffee: "Coffee",
  sightseeing: "Sightseeing",
};

const EXCLUDED_CATEGORIES = ["airport", "hotel"];
const CATEGORIES = (
  Object.keys(CATEGORY_LABELS) as LocationCategory[]
).filter((cat) => !EXCLUDED_CATEGORIES.includes(cat));

type CategoryFilter = LocationCategory | "all";

type ThingsToDoClientProps = {
  locations: Location[];
};

export default function ThingsToDoClient({ locations }: ThingsToDoClientProps) {
  const [activeCategory, setActiveCategory] = useState<CategoryFilter>("all");

  const mapLocations = locations;

  const filteredLocations =
    activeCategory === "all"
      ? locations.filter(
          (loc) => !EXCLUDED_CATEGORIES.includes(loc.category)
        )
      : locations.filter((location) => location.category === activeCategory);

  return (
    <div className="flex flex-1 flex-col px-6 py-4 sm:py-6">
      <h1 className="font-primary text-4xl text-primary sm:text-5xl mb-8">
        Things to Do
      </h1>
      <div className="grid flex-1 grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="liquid-glass-lite-frame h-full overflow-hidden rounded-3xl lg:col-span-2">
          <MapComponent locations={mapLocations} />
        </div>

        <div className="flex h-full flex-col lg:col-span-1">
          <div className="mb-4 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setActiveCategory("all")}
              className={`rounded-full px-3 py-1.5 text-sm tracking-wide transition-all duration-300 ease-out ${
                activeCategory === "all"
                  ? "bg-primary text-tertiary shadow-lg hover:shadow-xl"
                  : "border border-quaternary text-primary hover:bg-quaternary hover:shadow-md"
              }`}
            >
              All
            </button>
            {CATEGORIES.map((category) => (
              <button
                key={category}
                type="button"
                onClick={() => setActiveCategory(category)}
                className={`rounded-full px-3 py-1.5 text-sm tracking-wide transition-all duration-300 ease-out ${
                  activeCategory === category
                    ? "bg-primary text-tertiary shadow-lg hover:shadow-xl"
                    : "border border-quaternary text-primary hover:bg-quaternary hover:shadow-md"
                }`}
              >
                {CATEGORY_LABELS[category]}
              </button>
            ))}
          </div>

          <div className="flex-1 space-y-4 overflow-y-auto pr-2">
            {filteredLocations.map((location) => (
              <div
                key={location.id}
                className="liquid-glass-lite-static rounded-2xl p-4 text-left"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <LocationIcon
                      name={location.icon}
                      size={18}
                      className="shrink-0 text-quinary"
                    />
                    <h3 className="font-primary text-lg text-primary">
                      {location.name}
                    </h3>
                  </div>
                  <span className="shrink-0 rounded-full bg-quinary/20 px-2 py-0.5 text-xs uppercase tracking-wide text-quinary">
                    {CATEGORY_LABELS[location.category]}
                  </span>
                </div>
                <p className="mt-1 text-sm text-primary/70">
                  {location.address}
                </p>
                <div className="mt-2 flex items-center justify-between gap-2">
                  <div className="flex-1">
                    {location.description && (
                      <p className="text-sm text-primary/70">
                        {location.description}
                      </p>
                    )}
                  </div>
                  <a
                    href={generateMapsLink(location.address)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="shrink-0 text-primary/70 hover:text-primary transition-colors"
                    aria-label={`Navigate to ${location.name}`}
                  >
                    <Navigation size={20} />
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
