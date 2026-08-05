import fs from "node:fs";
import path from "node:path";

/**
 * Server-only. Checks whether a file exists under /public.
 * Do not import this from a Client Component.
 */
export function imageExistsInPublic(relativePath: string): boolean {
  const fullPath = path.join(process.cwd(), "public", relativePath);
  return fs.existsSync(fullPath);
}
