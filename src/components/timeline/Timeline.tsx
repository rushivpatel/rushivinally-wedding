"use client";

import { Fragment, useMemo, useRef } from "react";
import { useTimelinePath } from "./useTimelinePath";
import { useTimelineReveal } from "./useTimelineReveal";
import TimelineMarker from "./TimelineMarker";
import "./timeline.css";

export type TimelineEventConfig = {
  /** 0 = start of the path, 1 = end, 0.5 = midpoint, etc. */
  percent: number;
  eventId: string;
  title: string;
  date: string; // mm.dd.yyyy format
  /** Where to position the text relative to the marker point */
  position: "above" | "below" | "left" | "right";
};

type TimelineProps = {
  /** Raw <svg>...</svg> markup — must be inlined (not an <img src>) so its
   * path is DOM-accessible for getTotalLength()/getPointAtLength(). */
  svgMarkup: string;
  events: TimelineEventConfig[];
};

export default function Timeline({ svgMarkup, events }: TimelineProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  const percents = useMemo(() => events.map((event) => event.percent), [events]);

  const { started, revealed } = useTimelineReveal(containerRef, percents);
  const { positions } = useTimelinePath(containerRef, percents, started);

  return (
    <div ref={containerRef} className="timeline-root">
      <div
        className="timeline-svg-wrapper"
        aria-hidden="true"
        dangerouslySetInnerHTML={{ __html: svgMarkup }}
      />

      {positions &&
        events.map((event, index) => {
          const position = positions[index];
          if (!position) return null;
          const isRevealed = revealed[index] ?? false;

          return (
            <Fragment key={index}>
              <div
                className="timeline-marker-wrap"
                style={{ left: `${position.xPercent}%`, top: `${position.yPercent}%` }}
              >
                <TimelineMarker
                  eventId={event.eventId}
                  revealed={isRevealed}
                />
              </div>

              <div
                className={`timeline-label timeline-label--${event.position}`}
                style={{ left: `${position.xPercent}%`, top: `${position.yPercent}%` }}
              >
                <div className={`timeline-label__content${isRevealed ? " is-revealed" : ""}`}>
                  <p className="timeline-label__title">{event.title}</p>
                  <p className="timeline-label__date">{event.date}</p>
                </div>
              </div>
            </Fragment>
          );
        })}
    </div>
  );
}
