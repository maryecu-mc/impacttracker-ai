"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { saveEntry, generateId } from "@/lib/storage";
import type { RefineResponse } from "@/lib/types";

const CATEGORIES = [
  "Engineering",
  "Leadership",
  "Product",
  "Data & Analytics",
  "Design",
  "Operations",
  "Sales & Marketing",
  "Other",
];

export default function TrackerPage() {
  const router = useRouter();
  const [rawInput, setRawInput] = useState("");
  const [category, setCategory] = useState("Engineering");
  const [bullets, setBullets] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  async function handleRefine() {
    if (!rawInput.trim()) return;
    setLoading(true);
    setError("");
    setBullets([]);
    setSaved(false);

    try {
      const res = await fetch("/api/refine", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rawInput, category }),
      });
      const data: RefineResponse = await res.json();
      if (data.error) {
        setError(data.error);
      } else {
        setBullets(data.bullets);
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function handleSave() {
    const now = new Date().toISOString();
    saveEntry({
      id: generateId(),
      rawInput,
      refinedBullets: bullets,
      category,
      createdAt: now,
      updatedAt: now,
    });
    setSaved(true);
    setTimeout(() => router.push("/dashboard"), 800);
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Log an Impact</h1>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Category
          </label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {CATEGORIES.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            What did you do? <span className="text-gray-400">(plain language)</span>
          </label>
          <textarea
            value={rawInput}
            onChange={(e) => setRawInput(e.target.value)}
            rows={5}
            placeholder="e.g. I rewrote the search indexing pipeline which made searches way faster and the team stopped getting paged at night"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          />
        </div>

        <button
          onClick={handleRefine}
          disabled={loading || !rawInput.trim()}
          className="w-full bg-blue-600 text-white py-2.5 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? "Refining…" : "Refine with AI"}
        </button>

        {error && (
          <p className="text-red-600 text-sm">{error}</p>
        )}

        {bullets.length > 0 && (
          <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
            <h2 className="text-sm font-semibold text-gray-700 mb-3">
              Refined Bullets
            </h2>
            <ul className="space-y-2">
              {bullets.map((b, i) => (
                <li key={i} className="flex gap-2 text-sm text-gray-800">
                  <span className="text-blue-500 mt-0.5">•</span>
                  <span>{b}</span>
                </li>
              ))}
            </ul>
            <button
              onClick={handleSave}
              disabled={saved}
              className="mt-4 w-full bg-green-600 text-white py-2 rounded-lg font-medium hover:bg-green-700 disabled:opacity-50 transition-colors text-sm"
            >
              {saved ? "Saved!" : "Save to Dashboard"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
