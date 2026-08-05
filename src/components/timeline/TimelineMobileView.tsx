"use client";

import { useRef } from "react";
import type { TimelineEventConfig } from "./Timeline";
import { getSvgIconUrl, getSvgFallbackUrl } from "@/lib/loadSvgIcon";
import { useTimelinePath } from "./useTimelinePath";
import "./timeline-mobile.css";

type TimelineMobileViewProps = {
  svgMarkup: string;
  events: TimelineEventConfig[];
};

export default function TimelineMobileView({ svgMarkup, events }: TimelineMobileViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  const percents = events.map((event) => event.percent);
  const { positions } = useTimelinePath(containerRef, percents, true);

  return (
    <div className="timeline-mobile-root">
      {/* SVG Path with Circular Badge Nodes */}
      <div ref={containerRef} className="timeline-mobile-svg">
        <div
          className="timeline-svg-wrapper"
          aria-hidden="true"
          dangerouslySetInnerHTML={{ __html: svgMarkup }}
        />

        {/* Circular badges at each node */}
        {positions &&
          events.map((event, index) => {
            const position = positions[index];
            if (!position) return null;

            return (
              <div
                key={index}
                className="timeline-mobile-badge"
                style={{
                  left: `${position.xPercent}%`,
                  top: `${position.yPercent}%`,
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={getSvgIconUrl(event.eventId)}
                  alt=""
                  className="timeline-mobile-badge__icon"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = getSvgFallbackUrl();
                  }}
                />
              </div>
            );
          })}
      </div>
    </div>
  );
}
