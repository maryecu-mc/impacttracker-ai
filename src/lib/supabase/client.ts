import { createBrowserClient } from "@supabase/ssr";

function getSupabaseUrl(): string {
  const raw = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  try {
    // Strip any path (e.g. /rest/v1) — Supabase client needs the root origin only
    const url = new URL(raw);
    const normalized = url.origin; // "https://xxx.supabase.co"
    if (normalized !== raw.replace(/\/$/, "")) {
      console.warn(
        `[supabase/client] NEXT_PUBLIC_SUPABASE_URL contained an extra path ("${raw}"). ` +
          `Normalized to "${normalized}". Update the env var to just the root URL.`
      );
    }
    return normalized;
  } catch {
    return raw;
  }
}

export function createClient() {
  return createBrowserClient(
    getSupabaseUrl(),
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
  );
}
