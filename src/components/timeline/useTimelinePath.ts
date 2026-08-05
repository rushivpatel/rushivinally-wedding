"use client";

import { useEffect, useRef, useState, type RefObject } from "react";
import { findTimelinePath, getPercentPoint, getViewBoxSize } from "./timelinePath";
import { DRAW_DURATION_MS } from "./constants";

export type MarkerPosition = { xPercent: number; yPercent: number };

const RESIZE_DEBOUNCE_MS = 150;

/**
 * Finds the timeline path inside an inlined SVG (rendered via
 * dangerouslySetInnerHTML into containerRef) and computes each requested
 * percent-along-the-path as a {xPercent, yPercent} position — expressed as
 * a percentage of the SVG's own viewBox, not rendered pixels, which is what
 * makes it inherently resize/scale-proof — and drives the path's
 * stroke-dasharray draw animation once `started` flips true.
 *
 * The path element itself is kept in a ref (not exposed) rather than
 * returned to the caller: it's a raw DOM node from injected markup, not a
 * React-owned value, so all direct style mutation happens here, in the
 * hook that found it.
 */
export function useTimelinePath(
  containerRef: RefObject<HTMLDivElement | null>,
  percents: number[],
  started: boolean,
) {
  const pathElRef = useRef<SVGPathElement | null>(null);
  const percentsRef = useRef(percents);
  const [pathReady, setPathReady] = useState(false);
  const [totalLength, setTotalLength] = useState(0);
  const [positions, setPositions] = useState<MarkerPosition[] | null>(null);

  useEffect(() => {
    percentsRef.current = percents;
  });

  // Find the path once the injected SVG markup is in the DOM.
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const svg = container.querySelector("svg");
    if (!svg) return;
    pathElRef.current = findTimelinePath(svg);
    setPathReady(pathElRef.current !== null);
  }, [containerRef]);

  // Compute/recompute marker positions; re-run on resize (debounced).
  useEffect(() => {
    const pathEl = pathElRef.current;
    if (!pathEl) return;
    const svg = pathEl.ownerSVGElement;
    if (!svg) return;

    let lastLength = -1;

    const recalc = () => {
      const length = pathEl.getTotalLength();
      if (length === lastLength) return;
      lastLength = length;

      const viewBox = getViewBoxSize(svg);
      setTotalLength(length);
      setPositions(
        percentsRef.current.map((percent) => {
          // This SVG's path is authored in the opposite direction from how
          // it's meant to be read (its length-0 point is the visual end),
          // so we measure from the far end instead. Keeps getPercentPoint
          // itself honest — "percent along the path from its real start" —
          // rather than baking a reversal into a low-level utility.
          const point = getPercentPoint(pathEl, 1 - percent);
          return {
            xPercent: (point.x / viewBox.width) * 100,
            yPercent: (point.y / viewBox.height) * 100,
          };
        }),
      );
    };

    recalc();

    let resizeTimeout: ReturnType<typeof setTimeout>;
    const observer = new ResizeObserver(() => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(recalc, RESIZE_DEBOUNCE_MS);
    });
    observer.observe(svg);

    return () => {
      clearTimeout(resizeTimeout);
      observer.disconnect();
    };
  }, [pathReady]);

  // Drive the stroke-draw animation directly on the path element.
  useEffect(() => {
    const pathEl = pathElRef.current;
    if (!pathEl || totalLength === 0) return;

    // A positive dashoffset-to-0 transition draws from the path's raw
    // length-0 point toward its end. Since that point is this SVG's visual
    // "end" (see the comment above in the recalc function), we draw from a
    // *negative* offset instead — the standard trick for reversing an SVG
    // stroke-draw animation — so it visually draws from the same end where
    // the percent=0 marker now sits.
    pathEl.style.strokeDasharray = `${totalLength}`;
    pathEl.style.transition = "none";
    pathEl.style.strokeDashoffset = `${-totalLength}`;
    // Force layout so the "from" state above is committed before the
    // "to" state below is applied — otherwise both changes coalesce and
    // the browser never sees a transition to animate.
    void pathEl.getBoundingClientRect();
    pathEl.style.transition = `stroke-dashoffset ${DRAW_DURATION_MS}ms linear`;
    pathEl.style.strokeDashoffset = started ? "0" : `${-totalLength}`;
  }, [totalLength, started, pathReady]);

  return { positions };
}
