/**
 * Load SVG icon from public/icons/events/${eventId}.svg
 * Returns the SVG URL or a fallback placeholder SVG data URI
 */
export function getSvgIconUrl(eventId: string): string {
  return `/icons/events/${eventId}.svg`;
}

export function getSvgFallbackUrl(): string {
  // Fallback: a simple circle (● symbol as SVG)
  return `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23b8965a'%3E%3Ccircle cx='12' cy='12' r='10'/%3E%3C/svg%3E`;
}
