"use client";

import { useEffect, useRef, useState, type RefObject } from "react";
import { DRAW_DURATION_MS } from "./constants";

/**
 * Starts the timeline's draw animation once it scrolls into view (once —
 * it doesn't replay if you scroll away and back), then reveals each marker
 * at the moment the draw reaches that marker's percent along the path.
 * Assumes a linear stroke-dashoffset transition of DRAW_DURATION_MS, so a
 * marker at percent 0.5 reveals at DRAW_DURATION_MS * 0.5.
 */
export function useTimelineReveal(
  containerRef: RefObject<HTMLDivElement | null>,
  percents: number[],
) {
  const [started, setStarted] = useState(false);
  const [revealed, setRevealed] = useState<boolean[]>(() => percents.map(() => false));
  const timeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    if (typeof IntersectionObserver === "undefined") {
      // Extremely old browsers: defer to a callback rather than setting
      // state synchronously in the effect body.
      const frame = requestAnimationFrame(() => setStarted(true));
      return () => cancelAnimationFrame(frame);
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setStarted(true);
          observer.disconnect();
        }
      },
      { threshold: 0.3 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [containerRef]);

  useEffect(() => {
    if (!started) return;

    timeoutsRef.current.forEach(clearTimeout);
    timeoutsRef.current = percents.map((percent, index) =>
      setTimeout(
        () => {
          setRevealed((prev) => {
            if (prev[index]) return prev;
            const next = [...prev];
            next[index] = true;
            return next;
          });
        },
        percent * DRAW_DURATION_MS,
      ),
    );

    return () => {
      timeoutsRef.current.forEach(clearTimeout);
    };
    // percents is expected to be stable for the lifetime of a given timeline;
    // re-running this per render would restart every marker's reveal timer.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [started]);

  return { started, revealed };
}
