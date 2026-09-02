import "server-only";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

/** Server-only Supabase client using the service_role key, which bypasses
 *  RLS. Every table denies the public anon key by default, so all reads
 *  and writes go through here — never import this from a "use client" file. */
export const supabaseServer = createClient(supabaseUrl, supabaseServiceRoleKey);
