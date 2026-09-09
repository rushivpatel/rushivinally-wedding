"use client";

import { useEffect, useSyncExternalStore } from "react";

/** A custom Google My Maps map replaces the old MapLibre-built one —
 *  desktop embeds it directly; mobile redirects out to the Google Maps
 *  app/site instead, since the embed doesn't work well on small screens. */
const DESKTOP_EMBED_URL =
  "https://www.google.com/maps/d/embed?mid=1pG1sDin-rBX-EBCfRE5ZBCWwQF9ghmo&hl=en&ehbc=2E312F";
const MOBILE_REDIRECT_URL =
  "https://www.google.com/maps/d/u/3/edit?mid=1pG1sDin-rBX-EBCfRE5ZBCWwQF9ghmo&usp=sharing";

const MOBILE_BREAKPOINT = 768;

function subscribeToResize(callback: () => void) {
  window.addEventListener("resize", callback);
  return () => window.removeEventListener("resize", callback);
}

function getIsMobileSnapshot() {
  return window.innerWidth < MOBILE_BREAKPOINT;
}

function getIsMobileServerSnapshot() {
  return false; // assume desktop during SSR, corrected immediately on the client
}

export default function ThingsToDoPage() {
  const isMobile = useSyncExternalStore(
    subscribeToResize,
    getIsMobileSnapshot,
    getIsMobileServerSnapshot
  );

  useEffect(() => {
    if (isMobile) {
      window.location.href = MOBILE_REDIRECT_URL;
    }
  }, [isMobile]);

  if (isMobile) {
    return null;
  }

  return (
    <div className="flex flex-1 flex-col py-4 sm:py-6">
      <div className="mx-auto w-full max-w-4xl px-6">
        <h1 className="font-primary text-4xl text-primary sm:text-5xl mb-8">Things to Do</h1>
        <div className="liquid-glass-lite-frame overflow-hidden rounded-3xl">
          <iframe
            src={DESKTOP_EMBED_URL}
            className="h-[600px] w-full"
            style={{ border: 0 }}
            loading="lazy"
            title="Things to Do Map"
          />
        </div>
      </div>
    </div>
  );
}
