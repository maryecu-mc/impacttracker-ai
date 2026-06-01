"use client";

import { useEffect, useState, useMemo } from "react";
import { getEntries, deleteEntry } from "@/lib/storage";
import type { ImpactEntry } from "@/lib/types";
import { PRIMARY_USE_LABELS } from "@/lib/types";
import Link from "next/link";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function monthLabel(iso: string) {
  return new Date(iso + "T00:00:00").toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });
}

function thisMonthISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function topCounts(items: string[][], n = 5): [string, number][] {
  const counts: Record<string, number> = {};
  items.flat().forEach((item) => {
    counts[item] = (counts[item] ?? 0) + 1;
  });
  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, n);
}

function exportToText(entries: ImpactEntry[]): string {
  const sorted = [...entries].sort(
    (a, b) =>
      new Date(b.dateOfImpact || b.createdAt).getTime() -
      new Date(a.dateOfImpact || a.createdAt).getTime()
  );

  const byMonth: Record<string, ImpactEntry[]> = {};
  for (const entry of sorted) {
    const key = monthLabel(entry.dateOfImpact || entry.createdAt.split("T")[0]);
    if (!byMonth[key]) byMonth[key] = [];
    byMonth[key].push(entry);
  }

  const lines: string[] = [
    "IMPACT TRACKER — ACCOMPLISHMENTS EXPORT",
    `Generated: ${new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}`,
    "─".repeat(60),
    "",
  ];

  for (const [month, monthEntries] of Object.entries(byMonth)) {
    lines.push(`▌ ${month.toUpperCase()}`);
    lines.push("");
    for (const entry of monthEntries) {
      lines.push(`  Date: ${formatDate(entry.dateOfImpact || entry.createdAt.split("T")[0])}`);
      if (entry.strategicPriority)
        lines.push(`  Strategic Priority: ${entry.strategicPriority}`);
      if (entry.impactTypes.length)
        lines.push(`  Impact: ${entry.impactTypes.join(", ")}`);
      lines.push(`  What happened: ${entry.rawInput}`);
      if (entry.estimatedImpact)
        lines.push(`  Estimated impact: ${entry.estimatedImpact}`);
      if (entry.refinedOutputs) {
        lines.push("");
        lines.push(`  Performance Review:`);
        lines.push(`  ${entry.refinedOutputs.performanceReviewBullet}`);
        lines.push(`  Career Story:`);
        lines.push(`  ${entry.refinedOutputs.careerStoryBullet}`);
      }
      lines.push("  " + "·".repeat(56));
      lines.push("");
    }
  }

  return lines.join("\n");
}

function downloadText(text: string, filename: string) {
  const blob = new Blob([text], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatCard({ value, label }: { value: number | string; label: string }) {
  const isString = typeof value === "string";
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
      <p className={`font-bold text-slate-900 mb-1 leading-tight ${isString ? "text-base" : "text-3xl"}`}>{value}</p>
      <p className="text-sm text-slate-500">{label}</p>
    </div>
  );
}

function BarList({
  title,
  items,
}: {
  title: string;
  items: [string, number][];
}) {
  const max = items[0]?.[1] ?? 1;
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
      <p className="text-sm font-semibold text-slate-700 mb-4">
        {title}
      </p>
      {items.length === 0 ? (
        <p className="text-sm text-slate-400">No data yet</p>
      ) : (
        <div className="space-y-2.5">
          {items.map(([label, count]) => (
            <div key={label} className="flex items-center gap-3">
              <span className="text-sm text-slate-600 w-44 shrink-0 truncate">
                {label}
              </span>
              <div className="flex-1 bg-slate-100 rounded-full h-1.5">
                <div
                  className="bg-blue-500 rounded-full h-1.5 transition-all"
                  style={{ width: `${(count / max) * 100}%` }}
                />
              </div>
              <span className="text-sm text-slate-400 w-4 text-right shrink-0">
                {count}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function EntryCard({
  entry,
  onDelete,
}: {
  entry: ImpactEntry;
  onDelete: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const date = entry.dateOfImpact || entry.createdAt.split("T")[0];
  const bestBullet =
    entry.refinedOutputs?.performanceReviewBullet ||
    entry.refinedOutputs?.accomplishmentStatement;

  const primaryUseColors: Record<string, string> = {
    "personal-tracking": "bg-slate-100 text-slate-500",
    "performance-review": "bg-violet-50 text-violet-700",
    "leadership-update": "bg-blue-50 text-blue-700",
    "career-growth": "bg-green-50 text-green-700",
    "multi-purpose": "bg-amber-50 text-amber-700",
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4 mb-3">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-slate-400">{formatDate(date)}</span>
          {entry.primaryUse && (
            <span
              className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                primaryUseColors[entry.primaryUse] ??
                "bg-slate-100 text-slate-500"
              }`}
            >
              {PRIMARY_USE_LABELS[entry.primaryUse] ?? entry.primaryUse}
            </span>
          )}
        </div>
        <button
          onClick={onDelete}
          className="text-slate-300 hover:text-red-400 text-xs transition-colors shrink-0"
        >
          Delete
        </button>
      </div>

      <p className="text-sm text-slate-800 leading-relaxed mb-3">
        {entry.rawInput}
      </p>

      <div className="flex flex-wrap gap-1.5 mb-3">
        {entry.impactTypes.slice(0, 3).map((t) => (
          <span
            key={t}
            className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full"
          >
            {t}
          </span>
        ))}
        {entry.impactTypes.length > 3 && (
          <span className="text-xs text-slate-400">
            +{entry.impactTypes.length - 3} more
          </span>
        )}
      </div>

      {(entry.strategicPriority || entry.kpiMetric) && (
        <div className="flex flex-wrap gap-2 mb-3">
          {entry.strategicPriority && (
            <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">
              {entry.strategicPriority}
            </span>
          )}
          {entry.kpiMetric && (
            <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">
              {entry.kpiMetric}
            </span>
          )}
        </div>
      )}

      {bestBullet && !expanded && (
        <p className="text-sm text-slate-500 italic border-t border-slate-100 pt-3 mt-3">
          {bestBullet}
        </p>
      )}

      {expanded && entry.refinedOutputs && (
        <div className="border-t border-slate-100 pt-3 mt-3 space-y-3">
          {(
            Object.entries(entry.refinedOutputs) as [
              string,
              string,
            ][]
          ).map(([key, value]) => (
            <div key={key}>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">
                {key.replace(/([A-Z])/g, " $1").trim()}
              </p>
              <p className="text-sm text-slate-700 whitespace-pre-line leading-relaxed">
                {value}
              </p>
            </div>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100">
        {entry.refinedOutputs ? (
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-xs text-slate-400 hover:text-blue-600 transition-colors"
          >
            {expanded ? "▲ Collapse" : "▾ View all outputs"}
          </button>
        ) : (
          <span className="text-xs text-slate-300">No AI outputs yet</span>
        )}
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const [entries, setEntries] = useState<ImpactEntry[]>([]);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("all");

  useEffect(() => {
    setEntries(getEntries());
  }, []);

  function handleDelete(id: string) {
    deleteEntry(id);
    setEntries(getEntries());
  }

  function handleExport() {
    const text = exportToText(entries);
    const date = new Date().toISOString().split("T")[0];
    downloadText(text, `impact-tracker-export-${date}.txt`);
  }

  const thisMonth = thisMonthISO();
  const thisMonthCount = entries.filter(
    (e) => (e.dateOfImpact || e.createdAt.split("T")[0]).startsWith(thisMonth)
  ).length;

  const allImpactTypes = entries.map((e) => e.impactTypes);
  const allContribTypes = entries.map((e) => e.contributionTypes ?? []);
  const topImpactTypes = topCounts(allImpactTypes);
  const topStrategic = topCounts(
    entries.map((e) => (e.strategicPriority ? [e.strategicPriority] : []))
  );

  // Themes: combined top impact + contribution types
  const themes = useMemo(() => {
    return topCounts([...allImpactTypes, ...allContribTypes], 6);
  }, [entries]);

  const allTypes = Array.from(
    new Set(entries.flatMap((e) => e.impactTypes))
  ).sort();

  const filtered = entries.filter((e) => {
    const matchSearch =
      !search ||
      e.rawInput.toLowerCase().includes(search.toLowerCase()) ||
      (e.refinedOutputs?.performanceReviewBullet ?? "")
        .toLowerCase()
        .includes(search.toLowerCase());
    const matchFilter =
      filterType === "all" || e.impactTypes.includes(filterType);
    return matchSearch && matchFilter;
  });

  // Group by month
  const byMonth: Record<string, ImpactEntry[]> = {};
  for (const entry of filtered) {
    const key = monthLabel(
      entry.dateOfImpact || entry.createdAt.split("T")[0]
    );
    if (!byMonth[key]) byMonth[key] = [];
    byMonth[key].push(entry);
  }

  if (entries.length === 0) {
    return (
      <div className="text-center py-20">
        <div className="text-4xl mb-4">◆</div>
        <h1 className="text-2xl font-semibold text-slate-900 mb-2">
          My Impact
        </h1>
        <p className="text-slate-500 mb-6 max-w-sm mx-auto">
          You haven't captured any impacts yet. Start with something that
          happened this week.
        </p>
        <Link
          href="/tracker"
          className="bg-blue-600 text-white px-5 py-2.5 rounded-lg font-medium hover:bg-blue-700 transition-colors text-sm"
        >
          Capture Impact
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-slate-900">My Impact</h1>
        <div className="flex gap-2">
          <button
            onClick={handleExport}
            className="text-sm border border-slate-200 bg-white text-slate-600 px-4 py-2 rounded-lg hover:bg-slate-50 transition-colors"
          >
            Export Accomplishments
          </button>
          <Link
            href="/tracker"
            className="bg-blue-600 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            + Capture Impact
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard value={entries.length} label="Total captures" />
        <StatCard value={thisMonthCount} label="This month" />
        <StatCard value={topImpactTypes[0]?.[0] ?? "—"} label="Top impact area" />
        <StatCard value={topStrategic[0]?.[0] ?? "—"} label="Top strategic priority" />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <BarList title="Top impact types" items={topImpactTypes} />
        <BarList title="Strategic alignment" items={topStrategic} />
      </div>

      {/* Themes */}
      {themes.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
          <p className="text-sm font-semibold text-slate-700 mb-1">
            Where your impact is concentrated
          </p>
          <p className="text-xs text-slate-400 mb-4">
            Based on your captured impact and contribution types
          </p>
          <div className="flex flex-wrap gap-2">
            {themes.map(([theme, count]) => (
              <span
                key={theme}
                className="inline-flex items-center gap-1.5 bg-blue-50 text-blue-700 text-sm px-3 py-1.5 rounded-full"
              >
                {theme}
                <span className="bg-blue-100 text-blue-600 text-xs px-1.5 py-0.5 rounded-full font-medium">
                  {count}
                </span>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Search + filter */}
      <div className="flex gap-3">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search impacts…"
          className="flex-1 border border-slate-200 rounded-lg px-3.5 py-2.5 text-sm bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="border border-slate-200 rounded-lg px-3 py-2.5 text-sm bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">All impact types</option>
          {allTypes.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      </div>

      {/* Entries grouped by month */}
      {Object.entries(byMonth).map(([month, monthEntries]) => (
        <div key={month}>
          <h2 className="text-sm font-semibold text-slate-700 border-b border-slate-100 pb-2 mb-3">
            {month}
          </h2>
          <div className="space-y-3">
            {monthEntries.map((entry) => (
              <EntryCard
                key={entry.id}
                entry={entry}
                onDelete={() => handleDelete(entry.id)}
              />
            ))}
          </div>
        </div>
      ))}

      {filtered.length === 0 && entries.length > 0 && (
        <p className="text-center text-slate-400 text-sm py-8">
          No results for "{search}"
        </p>
      )}
    </div>
  );
}
