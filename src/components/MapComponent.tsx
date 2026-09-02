"use client";

import { useEffect, useRef, useState } from "react";
import Map, { Marker, NavigationControl, Popup, type MapRef } from "react-map-gl/maplibre";
import { setWorkerUrl } from "maplibre-gl";
import { Navigation } from "lucide-react";
import LocationIcon from "@/components/LocationIcon";
import { generateMapsLink } from "@/lib/generateMapsLink";
import type { Location } from "@/data/locations";
import "maplibre-gl/dist/maplibre-gl.css";

/**
 * MapLibre resolves its tile-parsing Web Worker from `import.meta.url` at
 * runtime, which Turbopack's dev bundler doesn't preserve as a fetchable
 * URL — the worker silently never loads, so tiles fetch fine but never
 * render. Pointing it at a static copy (public/vendor/, copied from
 * node_modules/maplibre-gl/dist/) works around it. Re-copy those two files
 * if maplibre-gl is ever upgraded.
 */
setWorkerUrl("/vendor/maplibre-gl-worker.mjs");

const MAP_STYLE = "https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json";
const DEFAULT_CENTER = { lat: 33.998899994825955, lng: -117.79774071544126 }; // DB Center

type MapComponentProps = {
  locations: Location[];
};

export default function MapComponent({ locations }: MapComponentProps) {
  const [selected, setSelected] = useState<Location | null>(null);
  const mapRef = useRef<MapRef>(null);
  const center = locations[0]?.coordinates ?? DEFAULT_CENTER;

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    // The map can measure its container as 0x0 on first mount (this page's
    // grid/liquid-glass wrapper layout settles a moment after the map
    // itself renders), which leaves the canvas frozen at a stale fallback
    // size and its tile source stuck "loading" forever — so `onLoad` isn't
    // a safe place to hook this, it may never fire. A ResizeObserver on
    // the map's own container catches the real size as soon as it's known.
    const container = map.getContainer();
    const observer = new ResizeObserver(() => map.resize());
    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  return (
    <Map
      ref={mapRef}
      initialViewState={{
        latitude: center.lat,
        longitude: center.lng,
        zoom: 9,
      }}
      mapStyle={MAP_STYLE}
      style={{ width: "100%", height: "100%" }}
      onError={(e) => console.error("[MapComponent] maplibre error:", e.error)}
      onClick={() => setSelected(null)}
    >
      <NavigationControl position="top-right" />

      {locations.map((location) => {
        const isSpecialCategory = ["airport", "hotel"].includes(
          location.category
        );
        const bgColor = isSpecialCategory
          ? "bg-secondary/60"
          : "bg-primary/60";
        const iconColor = isSpecialCategory ? "text-primary" : "text-tertiary";

        return (
          <Marker
            key={location.id}
            latitude={location.coordinates.lat}
            longitude={location.coordinates.lng}
            anchor="bottom"
            onClick={(event) => {
              event.originalEvent.stopPropagation();
              setSelected(selected?.id === location.id ? null : location);
            }}
          >
            <button
              type="button"
              aria-label={location.name}
              className={`${bgColor} flex h-9 w-9 items-center justify-center rounded-full shadow-lg hover:shadow-xl transition-all duration-300 ease-out hover:scale-125`}
              style={
                isSpecialCategory
                  ? {
                      boxShadow: `0 0 12px rgba(186, 186, 255, 0.4), 0 2px 4px rgba(0, 0, 0, 0.1), 0 8px 16px rgba(0, 0, 0, 0.15)`,
                    }
                  : {
                      boxShadow: `0 0 8px rgba(44, 62, 80, 0.2), 0 2px 4px rgba(0, 0, 0, 0.1), 0 8px 16px rgba(0, 0, 0, 0.15)`,
                    }
              }
            >
              <LocationIcon name={location.icon} size={18} className={iconColor} />
            </button>
          </Marker>
        );
      })}

      {selected && (
        <Popup
          latitude={selected.coordinates.lat}
          longitude={selected.coordinates.lng}
          anchor="top"
          onClose={() => setSelected(null)}
          closeOnClick={true}
        >
          <a
            href={generateMapsLink(selected.address)}
            target="_blank"
            rel="noopener noreferrer"
            className="block text-sm"
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="font-medium text-primary">{selected.name}</p>
                <p className="text-primary/70">{selected.address}</p>
              </div>
              <Navigation size={18} className="shrink-0 text-primary/70 mt-0.5" />
            </div>
          </a>
        </Popup>
      )}
    </Map>
  );
}
