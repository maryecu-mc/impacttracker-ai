"use client";

import { useState, useEffect, Suspense } from "react";
import { createClient } from "@/lib/supabase/client";
import { useSearchParams } from "next/navigation";

// Set to true once Google OAuth credentials are added in Supabase Auth → Providers → Google
const GOOGLE_OAUTH_ENABLED = false;

function SignInForm() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [errorDetail, setErrorDetail] = useState("");
  const [errorStatus, setErrorStatus] = useState<number | null>(null);
  const [debugInfo, setDebugInfo] = useState<{
    configOk: boolean;
    supabaseUrl: string;
    supabaseHost: string;
    keyPrefix: string;
    keyType: string;
    redirectUrl: string;
    authEndpoint: string;
  } | null>(null);

  const searchParams = useSearchParams();
  const errorParam = searchParams.get("error");

  useEffect(() => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
    const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "";

    let supabaseHost = "(not set)";
    let authEndpoint = "(unknown)";
    try {
      if (supabaseUrl) {
        const base = new URL(supabaseUrl.endsWith("/") ? supabaseUrl : supabaseUrl + "/");
        supabaseHost = base.host;
        authEndpoint = new URL("auth/v1/otp", base).href;
      }
    } catch {
      supabaseHost = "(malformed URL)";
    }

    const keyPrefix = key ? key.slice(0, 24) + "…" : "(not set)";
    const keyType = key.startsWith("sb_publishable_")
      ? "sb_publishable_ (new format)"
      : key.startsWith("eyJ")
      ? "eyJ… (legacy JWT anon key)"
      : key
      ? "⚠ unrecognised format"
      : "(not set)";

    const redirectUrl = `${window.location.origin}/auth/callback`;

    setDebugInfo({
      configOk: !!supabaseUrl && !!key,
      supabaseUrl,
      supabaseHost,
      keyPrefix,
      keyType,
      redirectUrl,
      authEndpoint,
    });
  }, []);

  // Redirect if already signed in
  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) window.location.href = "/dashboard";
    });
  }, []);

  async function handleMagicLink(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setStatus("sending");
    setErrorDetail("");
    setErrorStatus(null);

    const redirectTo = `${window.location.origin}/auth/callback`;
    console.log("[auth] signInWithOtp →", { email: email.trim(), redirectTo });

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: redirectTo },
    });

    if (error) {
      const status = "status" in error ? (error as { status?: number }).status ?? null : null;
      console.error("[auth] signInWithOtp error", {
        message: error.message,
        name: error.name,
        status,
        redirectTo,
      });
      setErrorDetail(error.message);
      setErrorStatus(status);
      setStatus("error");
    } else {
      console.log("[auth] signInWithOtp success — magic link sent");
      setStatus("sent");
    }
  }

  const configOk = debugInfo?.configOk ?? null;

  return (
    <div className="max-w-sm mx-auto pt-16">
      <div className="text-center mb-8">
        <div className="text-blue-600 text-2xl mb-3">◆</div>
        <h1 className="text-2xl font-semibold text-slate-900 mb-1">Sign in to Impact Tracker</h1>
        <p className="text-sm text-slate-500">Save your accomplishments and access them anywhere.</p>
      </div>

      {configOk === false && (
        <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700 mb-6">
          <p className="font-semibold mb-1">Configuration error</p>
          <p>
            <code className="bg-red-100 px-1 rounded font-mono text-xs">NEXT_PUBLIC_SUPABASE_URL</code> or{" "}
            <code className="bg-red-100 px-1 rounded font-mono text-xs">NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY</code>{" "}
            is missing. Check Vercel environment variables and redeploy.
          </p>
        </div>
      )}

      {errorParam && (
        <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700 mb-6">
          Sign-in failed. Please try again.
        </div>
      )}

      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-4">
        {GOOGLE_OAUTH_ENABLED && (
          <>
            <button
              type="button"
              onClick={async () => {
                const supabase = createClient();
                await supabase.auth.signInWithOAuth({
                  provider: "google",
                  options: { redirectTo: `${window.location.origin}/auth/callback` },
                });
              }}
              className="w-full flex items-center justify-center gap-3 border border-slate-300 rounded-lg px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
            >
              <svg width="18" height="18" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Continue with Google
            </button>
            <div className="flex items-center gap-3">
              <div className="flex-1 border-t border-slate-200" />
              <span className="text-xs text-slate-400">or</span>
              <div className="flex-1 border-t border-slate-200" />
            </div>
          </>
        )}

        {status === "sent" ? (
          <div className="text-center py-4">
            <div className="text-2xl mb-2">✉️</div>
            <p className="text-sm font-medium text-slate-800 mb-1">Check your email</p>
            <p className="text-sm text-slate-500">
              We sent a magic link to <strong>{email}</strong>. Click it to sign in.
            </p>
            <button
              type="button"
              onClick={() => { setStatus("idle"); setErrorDetail(""); setErrorStatus(null); }}
              className="mt-4 text-xs text-blue-600 hover:underline"
            >
              Use a different email
            </button>
          </div>
        ) : (
          <form onSubmit={handleMagicLink} className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Email address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                className="w-full border border-slate-200 rounded-lg px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/25 focus:border-blue-400"
              />
            </div>
            {status === "error" && (
              <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2.5 text-xs text-red-700 space-y-1.5">
                <p className="font-semibold">Sign-in failed</p>
                {errorDetail && <p className="font-mono break-all">{errorDetail}</p>}
                {errorStatus && <p className="text-red-500">HTTP status: {errorStatus}</p>}
                <p className="text-red-500">See browser console (F12) for full error details.</p>
              </div>
            )}
            <button
              type="submit"
              disabled={status === "sending" || !email.trim() || configOk === false}
              className="w-full bg-blue-600 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {status === "sending" ? "Sending…" : "Send magic link"}
            </button>
          </form>
        )}
      </div>

      <p className="text-center text-xs text-slate-400 mt-6">
        No password needed. We&apos;ll email you a sign-in link.
      </p>

      {/* Full debug panel */}
      {debugInfo && (
        <div className="mt-4 bg-slate-100 border border-slate-200 rounded-lg px-3 py-3 text-xs text-slate-600 space-y-1.5">
          <p className="font-semibold text-slate-700 mb-1">Auth debug</p>
          <p>
            <span className="text-slate-500">Config:</span>{" "}
            <span style={{ color: debugInfo.configOk ? "#16a34a" : "#dc2626" }}>
              {debugInfo.configOk ? "✓ present" : "✗ missing"}
            </span>
          </p>
          <p>
            <span className="text-slate-500">Supabase URL:</span>{" "}
            <span className="font-mono break-all">{debugInfo.supabaseUrl || "(not set)"}</span>
          </p>
          <p>
            <span className="text-slate-500">Auth endpoint:</span>{" "}
            <span className="font-mono break-all">{debugInfo.authEndpoint}</span>
          </p>
          <p>
            <span className="text-slate-500">Key prefix:</span>{" "}
            <span className="font-mono">{debugInfo.keyPrefix}</span>
          </p>
          <p>
            <span className="text-slate-500">Key type:</span>{" "}
            <span className="font-mono">{debugInfo.keyType}</span>
          </p>
          <div className="pt-1 border-t border-slate-200">
            <p className="font-semibold text-slate-700 mb-1">Redirect URL sent to Supabase:</p>
            <p className="font-mono break-all bg-white border border-slate-200 rounded px-2 py-1">{debugInfo.redirectUrl}</p>
            <p className="mt-1.5 text-slate-500">
              ⚠ This exact URL must be in{" "}
              <strong>Supabase → Auth → URL Configuration → Redirect URLs</strong>.
              Vercel preview URLs change on every push — add a wildcard instead:
            </p>
            <p className="font-mono mt-1 break-all bg-white border border-slate-200 rounded px-2 py-1">
              https://*-maryecu-mcs-projects.vercel.app/auth/callback
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export default function SignInPage() {
  return (
    <Suspense>
      <SignInForm />
    </Suspense>
  );
}
