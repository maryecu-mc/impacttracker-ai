"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function CaptureImpactButton() {
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getSession().then(({ data }) => {
      setAuthed(!!data.session);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setAuthed(!!session);
    });
    return () => subscription.unsubscribe();
  }, []);

  function handleClick(e: React.MouseEvent) {
    if (authed === false) {
      e.preventDefault();
      setShowModal(true);
    }
  }

  return (
    <>
      <a
        href="/tracker"
        onClick={handleClick}
        className="bg-blue-600 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
      >
        Capture Impact
      </a>

      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
          onClick={() => setShowModal(false)}
        >
          <div
            className="bg-white rounded-xl shadow-xl p-6 max-w-xs w-full mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="text-base font-semibold text-slate-900 mb-1">Sign in to capture impact</p>
            <p className="text-sm text-slate-500 mb-5">Please sign in so your work is saved.</p>
            <div className="flex gap-3">
              <a
                href="/auth/signin"
                className="flex-1 text-center bg-blue-600 text-white text-sm font-medium py-2.5 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Sign in
              </a>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="flex-1 text-center text-sm text-slate-600 font-medium py-2.5 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
