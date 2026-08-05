export type Point = { x: number; y: number };

/**
 * Finds the timeline's main path element inside an inlined SVG root.
 * Prefers an explicit id/data attribute; otherwise falls back to
 * whichever <path> has the greatest total length — a reasonable proxy
 * for "the main continuous line" versus small decorative marks.
 */
export function findTimelinePath(svg: SVGSVGElement): SVGPathElement | null {
  const explicit = svg.querySelector<SVGPathElement>(
    "#timeline, #timeline-path, [data-timeline-path]",
  );
  if (explicit) return explicit;

  const paths = Array.from(svg.querySelectorAll<SVGPathElement>("path"));
  if (paths.length === 0) return null;
  if (paths.length === 1) return paths[0];

  return paths.reduce((longest, current) =>
    current.getTotalLength() > longest.getTotalLength() ? current : longest,
  );
}

/**
 * The SVG's own coordinate system (its viewBox), independent of however
 * large it happens to be rendered on screen. Positioning markers as a
 * percentage of this size — rather than of rendered pixels — is what
 * keeps them attached to the path across any resize/scale, with no
 * per-resize pixel math required.
 */
export function getViewBoxSize(svg: SVGSVGElement): { width: number; height: number } {
  const viewBox = svg.viewBox?.baseVal;
  if (viewBox && viewBox.width > 0 && viewBox.height > 0) {
    return { width: viewBox.width, height: viewBox.height };
  }
  const width = svg.width.baseVal.value || svg.getBoundingClientRect().width;
  const height = svg.height.baseVal.value || svg.getBoundingClientRect().height;
  return { width, height };
}

export function getPercentPoint(path: SVGPathElement, percent: number): Point {
  const length = path.getTotalLength();
  const clamped = Math.min(1, Math.max(0, percent));
  return path.getPointAtLength(length * clamped);
}
