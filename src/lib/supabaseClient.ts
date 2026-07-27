import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://wxgqhhfgrddgvxkovcdk.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind4Z3FoaGZncmRkZ3Z4a292Y2RrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU5MjkwNTAsImV4cCI6MjA5MTUwNTA1MH0.n16R741D8J993Xs9c8QNO3iT4lTWvnRhvgmN1ph2lqs";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Hashea una contraseña con SHA-256 (coincide con el hash generado en Postgres vía pgcrypto)
export async function hashPassword(password: string): Promise<string> {
  const enc = new TextEncoder().encode(password);
  const buf = await crypto.subtle.digest("SHA-256", enc);
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}
