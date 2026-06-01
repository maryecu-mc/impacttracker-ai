"use client";

import { useEffect, useState } from "react";
import { getEntries, deleteEntry } from "@/lib/storage";
import type { ImpactEntry } from "@/lib/types";
import Link from "next/link";

export default function DashboardPage() {
  const [entries, setEntries] = useState<ImpactEntry[]>([]);

  useEffect(() => {
    setEntries(getEntries());
  }, []);

  function handleDelete(id: string) {
    deleteEntry(id);
    setEntries(getEntries());
  }

  if (entries.length === 0) {
    return (
      <div className="text-center py-16">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Dashboard</h1>
        <p className="text-gray-500 mb-6">No impacts logged yet.</p>
        <Link
          href="/tracker"
          className="bg-blue-600 text-white px-5 py-2.5 rounded-lg font-medium hover:bg-blue-700 transition-colors"
        >
          Log your first impact
        </Link>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          Dashboard <span className="text-gray-400 font-normal text-lg">({entries.length})</span>
        </h1>
        <Link
          href="/tracker"
          className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
        >
          + Add Impact
        </Link>
      </div>

      <div className="space-y-4">
        {entries.map((entry) => (
          <div key={entry.id} className="border border-gray-200 rounded-lg p-5">
            <div className="flex items-start justify-between gap-4 mb-3">
              <div>
                <span className="inline-block text-xs font-medium bg-blue-50 text-blue-700 px-2 py-0.5 rounded mb-1">
                  {entry.category}
                </span>
                <p className="text-sm text-gray-500">{entry.rawInput}</p>
              </div>
              <button
                onClick={() => handleDelete(entry.id)}
                className="text-gray-400 hover:text-red-500 text-xs shrink-0 transition-colors"
              >
                Delete
              </button>
            </div>
            {entry.refinedBullets.length > 0 && (
              <ul className="space-y-1.5 border-t border-gray-100 pt-3">
                {entry.refinedBullets.map((b, i) => (
                  <li key={i} className="flex gap-2 text-sm text-gray-800">
                    <span className="text-blue-500 mt-0.5 shrink-0">•</span>
                    <span>{b}</span>
                  </li>
                ))}
              </ul>
            )}
            <p className="text-xs text-gray-400 mt-3">
              {new Date(entry.createdAt).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
