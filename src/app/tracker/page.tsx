"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  saveEntry,
  generateId,
  getUserSettings,
  saveUserSettings,
  todayISO,
} from "@/lib/storage";
import type {
  RefinedOutputs,
  RefineRequest,
  UserSettings,
  PrimaryUse,
} from "@/lib/types";
import { PRIMARY_USE_LABELS } from "@/lib/types";

// ─── Constants ────────────────────────────────────────────────────────────────

const WHO_BENEFITED = [
  "Executive / leadership team",
  "My team",
  "Customer / client",
  "Department",
  "Company-wide",
  "Vendor / partner",
  "Cross-functional stakeholders",
];

const CONTRIBUTION_TYPES = [
  "Administrative support",
  "Leadership support",
  "Project coordination",
  "Communication",
  "Relationship management",
  "Process improvement",
  "Event / meeting execution",
  "Strategic support",
  "Problem solving",
  "Customer support",
  "Operations",
  "Change management",
];

const IMPACT_TYPES = [
  "Time savings",
  "Cost savings",
  "Revenue / profitability support",
  "Risk reduction",
  "Customer experience",
  "Employee experience",
  "Process improvement",
  "Operational efficiency",
  "Leadership enablement",
  "Culture / engagement",
  "Project execution",
  "Strategic alignment",
  "Communication effectiveness",
  "Relationship management",
];

const OUTPUT_LABELS: Record<keyof RefinedOutputs, string> = {
  accomplishmentStatement: "Accomplishment Statement",
  measurableImpact: "Measurable Impact",
  performanceReviewBullet: "Performance Review Bullet",
  leadershipUpdateBullet: "Leadership Update Bullet",
  careerStoryBullet: "Career Story Bullet",
  executiveSummary: "Executive Summary",
  starFormat: "STAR Format",
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function SectionHeader({
  title,
  collapsible = false,
  open,
  onToggle,
}: {
  title: string;
  collapsible?: boolean;
  open?: boolean;
  onToggle?: () => void;
}) {
  return (
    <div className="flex items-center justify-between mb-4">
      <h2 className="text-sm font-semibold text-slate-800 border-l-2 border-blue-500 pl-3 leading-tight">
        {title}
      </h2>
      {collapsible && onToggle && (
        <button
          type="button"
          onClick={onToggle}
          className="text-xs text-slate-400 hover:text-slate-600 transition-colors px-2 py-1"
        >
          {open ? "Hide" : "Show"}
        </button>
      )}
    </div>
  );
}

function ChipGroup({
  options,
  selected,
  onChange,
}: {
  options: string[];
  selected: string[];
  onChange: (values: string[]) => void;
}) {
  const [showCustom, setShowCustom] = useState(false);
  const [customInput, setCustomInput] = useState("");

  function toggle(value: string) {
    onChange(
      selected.includes(value)
        ? selected.filter((v) => v !== value)
        : [...selected, value]
    );
  }

  function addCustom() {
    const v = customInput.trim();
    if (v && !selected.includes(v)) onChange([...selected, v]);
    setCustomInput("");
    setShowCustom(false);
  }

  const customSelected = selected.filter((s) => !options.includes(s));

  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((opt) => {
        const isSelected = selected.includes(opt);
        return (
          <button
            key={opt}
            type="button"
            onClick={() => toggle(opt)}
            className={`px-3 py-1.5 rounded-full text-sm border transition-all font-medium ${
              isSelected
                ? "bg-blue-600 border-blue-600 text-white shadow-sm"
                : "bg-white border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50"
            }`}
          >
            {isSelected ? `✓ ${opt}` : opt}
          </button>
        );
      })}
      {customSelected.map((c) => (
        <button
          key={c}
          type="button"
          onClick={() => toggle(c)}
          className="px-3 py-1.5 rounded-full text-sm border bg-blue-600 border-blue-600 text-white font-medium shadow-sm"
        >
          ✓ {c} ×
        </button>
      ))}
      {showCustom ? (
        <div className="flex gap-1.5 items-center">
          <input
            value={customInput}
            onChange={(e) => setCustomInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addCustom()}
            placeholder="Type and press Enter…"
            className="px-2.5 py-1.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-44"
            autoFocus
          />
          <button
            type="button"
            onClick={addCustom}
            className="text-xs px-2.5 py-1.5 bg-blue-600 text-white rounded-lg"
          >
            Add
          </button>
          <button
            type="button"
            onClick={() => setShowCustom(false)}
            className="text-xs text-slate-400 hover:text-slate-600"
          >
            Cancel
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setShowCustom(true)}
          className="px-3 py-1.5 rounded-full text-sm border border-dashed border-slate-300 text-slate-400 hover:border-slate-400 hover:text-slate-500 transition-colors"
        >
          + Other
        </button>
      )}
    </div>
  );
}

function AlignmentSelect({
  label,
  value,
  onChange,
  options,
  onAddOption,
  optional = false,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: string[];
  onAddOption: (v: string) => void;
  optional?: boolean;
}) {
  const [showAdd, setShowAdd] = useState(false);
  const [newValue, setNewValue] = useState("");

  function handleAdd() {
    const v = newValue.trim();
    if (!v) return;
    onAddOption(v);
    onChange(v);
    setNewValue("");
    setShowAdd(false);
  }

  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-1.5">
        {label}
        {optional && (
          <span className="text-slate-400 font-normal ml-1">(optional)</span>
        )}
      </label>
      <div className="flex gap-2">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1 border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Select…</option>
          {options.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={() => setShowAdd(!showAdd)}
          className="px-3 py-2 text-sm border border-dashed border-slate-300 rounded-lg text-slate-500 hover:border-slate-400 hover:text-slate-600 whitespace-nowrap transition-colors"
        >
          + Add
        </button>
      </div>
      {showAdd && (
        <div className="flex gap-2 mt-2">
          <input
            value={newValue}
            onChange={(e) => setNewValue(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAdd()}
            placeholder="Enter custom value…"
            className="flex-1 border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            autoFocus
          />
          <button
            type="button"
            onClick={handleAdd}
            className="px-3 py-2 bg-blue-600 text-white text-sm rounded-lg"
          >
            Save
          </button>
          <button
            type="button"
            onClick={() => setShowAdd(false)}
            className="px-3 py-2 text-slate-500 text-sm"
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  );
}

function OutputCard({
  label,
  outputKey,
  text,
  rawInput,
  context,
  onRegenerated,
}: {
  label: string;
  outputKey: keyof RefinedOutputs;
  text: string;
  rawInput: string;
  context: Omit<RefineRequest, "rawInput">;
  onRegenerated: (key: keyof RefinedOutputs, newText: string) => void;
}) {
  const [copied, setCopied] = useState(false);
  const [regenerating, setRegenerating] = useState(false);

  async function handleCopy() {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleRegenerate() {
    setRegenerating(true);
    try {
      const res = await fetch("/api/regenerate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rawInput, context, outputKey }),
      });
      const data = await res.json();
      if (data.text) onRegenerated(outputKey, data.text);
    } finally {
      setRegenerating(false);
    }
  }

  const isMultiLine =
    outputKey === "starFormat" ||
    outputKey === "executiveSummary" ||
    outputKey === "accomplishmentStatement";

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
          {label}
        </span>
        <button
          type="button"
          onClick={handleCopy}
          className={`text-xs px-2.5 py-1 rounded-md border transition-colors ${
            copied
              ? "bg-green-50 border-green-200 text-green-700"
              : "border-slate-200 text-slate-500 hover:border-slate-300 hover:text-slate-700"
          }`}
        >
          {copied ? "✓ Copied" : "Copy"}
        </button>
      </div>
      <p
        className={`text-sm text-slate-800 leading-relaxed flex-1 ${
          isMultiLine ? "whitespace-pre-line" : ""
        }`}
      >
        {text}
      </p>
      <div className="flex justify-end pt-1 border-t border-slate-100">
        <button
          type="button"
          onClick={handleRegenerate}
          disabled={regenerating}
          className="text-xs text-slate-400 hover:text-blue-600 transition-colors disabled:opacity-50 flex items-center gap-1"
        >
          {regenerating ? (
            <><span className="animate-spin inline-block">↺</span> Regenerating…</>
          ) : (
            <>↺ Refresh</>
          )}
        </button>
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function TrackerPage() {
  const router = useRouter();
  const outputsRef = useRef<HTMLDivElement>(null);

  const [rawInput, setRawInput] = useState("");
  const [dateOfImpact, setDateOfImpact] = useState(todayISO());
  const [primaryUse, setPrimaryUse] = useState<PrimaryUse>("multi-purpose");
  const [whoBenefited, setWhoBenefited] = useState<string[]>([]);
  const [impactTypes, setImpactTypes] = useState<string[]>([]);
  const [contributionTypes, setContributionTypes] = useState<string[]>([]);
  const [estimatedImpact, setEstimatedImpact] = useState("");
  const [strategicPriority, setStrategicPriority] = useState("");
  const [kpiMetric, setKpiMetric] = useState("");
  const [companyValue, setCompanyValue] = useState("");
  const [projectInitiative, setProjectInitiative] = useState("");
  const [leadershipPriority, setLeadershipPriority] = useState("");

  const [section2Open, setSection2Open] = useState(true);
  const [section3Open, setSection3Open] = useState(false); // collapsed by default
  const [userSettings, setUserSettings] = useState<UserSettings>({
    strategicPriorities: [],
    kpiMetrics: [],
    companyValues: [],
    projects: [],
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [demoMode, setDemoMode] = useState(false);
  const [refinedOutputs, setRefinedOutputs] = useState<RefinedOutputs | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setUserSettings(getUserSettings());
  }, []);

  function addToSettings(key: keyof UserSettings, value: string) {
    const updated = { ...userSettings, [key]: [...userSettings[key], value] };
    setUserSettings(updated);
    saveUserSettings(updated);
  }

  function buildContext(): Omit<RefineRequest, "rawInput"> {
    return {
      primaryUse,
      dateOfImpact,
      whoBenefited,
      impactTypes,
      contributionTypes,
      estimatedImpact,
      strategicPriority,
      kpiMetric,
      companyValue,
    };
  }

  async function handleGenerate() {
    if (!rawInput.trim()) return;
    setLoading(true);
    setError("");
    setDemoMode(false);
    setRefinedOutputs(null);
    setSaved(false);

    try {
      const res = await fetch("/api/refine", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rawInput, ...buildContext() } as RefineRequest),
      });
      const data = await res.json();
      if (data.error) {
        setError(data.error);
      } else {
        if (data.demo) setDemoMode(true);
        setRefinedOutputs(data.outputs);
        setTimeout(
          () =>
            outputsRef.current?.scrollIntoView({
              behavior: "smooth",
              block: "start",
            }),
          100
        );
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function handleRegenerated(key: keyof RefinedOutputs, newText: string) {
    if (!refinedOutputs) return;
    setRefinedOutputs({ ...refinedOutputs, [key]: newText });
  }

  function handleSave() {
    const now = new Date().toISOString();
    saveEntry({
      id: generateId(),
      createdAt: now,
      updatedAt: now,
      dateOfImpact,
      primaryUse,
      rawInput,
      whoBenefited,
      impactTypes,
      contributionTypes,
      estimatedImpact,
      strategicPriority,
      kpiMetric,
      companyValue,
      projectInitiative,
      leadershipPriority,
      refinedOutputs,
    });
    setSaved(true);
    setTimeout(() => router.push("/dashboard"), 800);
  }

  const card = "bg-white border border-slate-200 rounded-xl p-5";
  const fieldLabel = "block text-sm font-medium text-slate-700 mb-1.5";

  return (
    <div className="max-w-2xl mx-auto space-y-3">
      <div className="flex items-center justify-between mb-1">
        <h1 className="text-lg font-semibold text-slate-900">Capture Impact</h1>
        <a
          href="/dashboard"
          className="text-sm text-slate-400 hover:text-slate-600 transition-colors"
        >
          ← My Impact
        </a>
      </div>

      {/* ── Section 1 ─────────────────────────────────────────────────────── */}
      <div className={card}>
        <SectionHeader title="What happened?" />

        <div className="space-y-4">
          <div>
            <label className={fieldLabel}>
              What happened or what did you contribute?
            </label>
            <p className="text-xs text-slate-400 mb-2">
              Accomplishments, support provided, problems solved, process
              improvements, leadership support, or outcomes.
            </p>
            <textarea
              value={rawInput}
              onChange={(e) => setRawInput(e.target.value)}
              rows={5}
              placeholder="e.g. Coordinated leadership summit for 60 leaders and redesigned the agenda after strategic priorities shifted two days before the event."
              className="w-full border border-slate-200 rounded-lg px-3.5 py-3 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none leading-relaxed"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={fieldLabel}>Date of impact</label>
              <input
                type="date"
                value={dateOfImpact}
                onChange={(e) => setDateOfImpact(e.target.value)}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className={fieldLabel}>Primary use</label>
              <select
                value={primaryUse}
                onChange={(e) => setPrimaryUse(e.target.value as PrimaryUse)}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {(
                  Object.entries(PRIMARY_USE_LABELS) as [PrimaryUse, string][]
                ).map(([val, label]) => (
                  <option key={val} value={val}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* ── Section 2: Context ─────────────────────────────────────────────── */}
      <div className={card}>
        <SectionHeader
          title="Add Context"
          collapsible
          open={section2Open}
          onToggle={() => setSection2Open(!section2Open)}
        />

        {section2Open && (
          <div className="space-y-4">
            <div>
              <label className={fieldLabel}>Who benefited?</label>
              <ChipGroup
                options={WHO_BENEFITED}
                selected={whoBenefited}
                onChange={setWhoBenefited}
              />
            </div>
            <div>
              <label className={fieldLabel}>Work type</label>
              <ChipGroup
                options={CONTRIBUTION_TYPES}
                selected={contributionTypes}
                onChange={setContributionTypes}
              />
            </div>
            <div>
              <label className={fieldLabel}>Impact type</label>
              <ChipGroup
                options={IMPACT_TYPES}
                selected={impactTypes}
                onChange={setImpactTypes}
              />
            </div>
            <div>
              <label className={fieldLabel}>
                Estimated impact{" "}
                <span className="text-slate-400 font-normal">(optional)</span>
              </label>
              <input
                type="text"
                value={estimatedImpact}
                onChange={(e) => setEstimatedImpact(e.target.value)}
                placeholder="e.g. Saved ~3 days of re-planning time, accelerated decision-making"
                className="w-full border border-slate-200 rounded-lg px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        )}
      </div>

      {/* ── Section 3: Alignment ───────────────────────────────────────────── */}
      <div className={card}>
        <SectionHeader
          title="Alignment"
          collapsible
          open={section3Open}
          onToggle={() => setSection3Open(!section3Open)}
        />

        {section3Open && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <AlignmentSelect
                label="Strategic Priority"
                value={strategicPriority}
                onChange={setStrategicPriority}
                options={userSettings.strategicPriorities}
                onAddOption={(v) => addToSettings("strategicPriorities", v)}
              />
              <AlignmentSelect
                label="KPI / Metric"
                value={kpiMetric}
                onChange={setKpiMetric}
                options={userSettings.kpiMetrics}
                onAddOption={(v) => addToSettings("kpiMetrics", v)}
              />
              <AlignmentSelect
                label="Company Value"
                value={companyValue}
                onChange={setCompanyValue}
                options={userSettings.companyValues}
                onAddOption={(v) => addToSettings("companyValues", v)}
              />
              <AlignmentSelect
                label="Project / Initiative"
                value={projectInitiative}
                onChange={setProjectInitiative}
                options={userSettings.projects}
                onAddOption={(v) => addToSettings("projects", v)}
                optional
              />
            </div>
            <div>
              <label className={fieldLabel}>
                Leadership Priority{" "}
                <span className="text-slate-400 font-normal">(optional)</span>
              </label>
              <input
                type="text"
                value={leadershipPriority}
                onChange={(e) => setLeadershipPriority(e.target.value)}
                placeholder="e.g. CEO's Q2 focus on executive team alignment"
                className="w-full border border-slate-200 rounded-lg px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        )}
      </div>

      {/* ── Generate ──────────────────────────────────────────────────────── */}
      <button
        type="button"
        onClick={handleGenerate}
        disabled={loading || !rawInput.trim()}
        className="w-full bg-blue-600 text-white py-4 rounded-xl font-semibold hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-base flex items-center justify-center gap-2 shadow-sm"
      >
        {loading ? (
          <><span className="animate-spin inline-block">✦</span> Generating AI Outputs…</>
        ) : (
          <>✦ Generate AI Outputs</>
        )}
      </button>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* ── Section 4: AI Outputs ─────────────────────────────────────────── */}
      {refinedOutputs && (
        <div ref={outputsRef} className="space-y-3 pt-1">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-800 border-l-2 border-blue-500 pl-3">
              AI Outputs
            </h2>
            <span className="text-xs text-slate-400">
              Copy or refresh each output individually
            </span>
          </div>

          {demoMode && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 flex items-start gap-2.5">
              <span className="text-amber-500 mt-0.5 shrink-0">◈</span>
              <div>
                <p className="text-sm font-medium text-amber-800">Demo mode</p>
                <p className="text-xs text-amber-700 mt-0.5">
                  These outputs are generated from templates, not AI. Add{" "}
                  <code className="bg-amber-100 px-1 py-0.5 rounded text-xs font-mono">
                    ANTHROPIC_API_KEY
                  </code>{" "}
                  to your Vercel environment variables to enable full AI generation.
                </p>
              </div>
            </div>
          )}

          <OutputCard
            label={OUTPUT_LABELS.accomplishmentStatement}
            outputKey="accomplishmentStatement"
            text={refinedOutputs.accomplishmentStatement}
            rawInput={rawInput}
            context={buildContext()}
            onRegenerated={handleRegenerated}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <OutputCard
              label={OUTPUT_LABELS.performanceReviewBullet}
              outputKey="performanceReviewBullet"
              text={refinedOutputs.performanceReviewBullet}
              rawInput={rawInput}
              context={buildContext()}
              onRegenerated={handleRegenerated}
            />
            <OutputCard
              label={OUTPUT_LABELS.leadershipUpdateBullet}
              outputKey="leadershipUpdateBullet"
              text={refinedOutputs.leadershipUpdateBullet}
              rawInput={rawInput}
              context={buildContext()}
              onRegenerated={handleRegenerated}
            />
            <OutputCard
              label={OUTPUT_LABELS.careerStoryBullet}
              outputKey="careerStoryBullet"
              text={refinedOutputs.careerStoryBullet}
              rawInput={rawInput}
              context={buildContext()}
              onRegenerated={handleRegenerated}
            />
            <OutputCard
              label={OUTPUT_LABELS.starFormat}
              outputKey="starFormat"
              text={refinedOutputs.starFormat}
              rawInput={rawInput}
              context={buildContext()}
              onRegenerated={handleRegenerated}
            />
            <OutputCard
              label={OUTPUT_LABELS.measurableImpact}
              outputKey="measurableImpact"
              text={refinedOutputs.measurableImpact}
              rawInput={rawInput}
              context={buildContext()}
              onRegenerated={handleRegenerated}
            />
            <OutputCard
              label={OUTPUT_LABELS.executiveSummary}
              outputKey="executiveSummary"
              text={refinedOutputs.executiveSummary}
              rawInput={rawInput}
              context={buildContext()}
              onRegenerated={handleRegenerated}
            />
          </div>

          <button
            type="button"
            onClick={handleSave}
            disabled={saved}
            className="w-full bg-slate-900 text-white py-4 rounded-xl font-semibold hover:bg-slate-800 disabled:opacity-50 transition-colors text-base"
          >
            {saved ? "✓ Saved to My Impact" : "Save to My Impact"}
          </button>
        </div>
      )}
    </div>
  );
}
