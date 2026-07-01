import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;

  // Log the auth endpoint that will be used (no key value logged)
  if (typeof window !== "undefined") {
    try {
      const authUrl = new URL("auth/v1/otp", supabaseUrl.endsWith("/") ? supabaseUrl : supabaseUrl + "/");
      console.log("[supabase/client] auth OTP endpoint:", authUrl.href);
      console.log("[supabase/client] supabaseUrl:", supabaseUrl);
    } catch {
      console.error("[supabase/client] supabaseUrl is malformed:", supabaseUrl);
    }
  }

  return createBrowserClient(supabaseUrl, supabaseKey);
}
