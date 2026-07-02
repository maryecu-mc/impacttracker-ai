"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";

export default function NavAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null);
      setLoading(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = "/";
  }

  if (loading) return null;

  if (user) {
    return (
      <div className="flex items-center gap-3">
        <span className="text-xs text-slate-400 hidden sm:block truncate max-w-[140px]">
          {user.email}
        </span>
        <button
          onClick={handleSignOut}
          className="text-xs text-slate-700 font-medium hover:text-slate-900 border border-slate-300 hover:border-slate-400 bg-white rounded-lg px-3 py-1.5 transition-colors"
        >
          Sign out
        </button>
      </div>
    );
  }

  return (
    <a
      href="/auth/signin"
      className="text-xs text-white font-medium bg-slate-800 hover:bg-slate-700 rounded-lg px-3 py-1.5 transition-colors"
    >
      Sign in
    </a>
  );
}
