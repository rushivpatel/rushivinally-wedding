/**
 * Generates a Google Maps URL for navigation using address
 * Works on both desktop and mobile without hydration issues
 * @param address - Full address to search
 * @returns Google Maps URL string
 */
export function generateMapsLink(address: string): string {
  const cleanAddress = String(address).trim();
  const encodedAddress = encodeURIComponent(cleanAddress);

  // Universal format: Google automatically handles desktop/mobile routing
  return `https://maps.google.com/?q=${encodedAddress}`;
}
