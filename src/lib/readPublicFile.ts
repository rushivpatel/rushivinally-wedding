import fs from "node:fs";
import path from "node:path";

/**
 * Server-only. Reads a text file from /public, or null if it doesn't exist.
 * Do not import this from a Client Component.
 */
export function readPublicFile(relativePath: string): string | null {
  const fullPath = path.join(process.cwd(), "public", relativePath);
  if (!fs.existsSync(fullPath)) return null;
  return fs.readFileSync(fullPath, "utf-8");
}
