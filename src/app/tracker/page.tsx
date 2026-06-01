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
  VisibilityLevel,
} from "@/lib/types";
import { VISIBILITY_LABELS } from "@/lib/types";

// ─── Constants ───────────────────────────────────────────────────────────────

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
  const inputRef = useRef<HTMLInputElement>(null);

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
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => (
        <button
          key={opt}
          type="button"
          onClick={() => toggle(opt)}
          className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
            selected.includes(opt)
              ? "bg-blue-50 border-blue-200 text-blue-700"
              : "bg-white border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50"
          }`}
        >
          {opt}
        </button>
      ))}
      {customSelected.map((c) => (
        <button
          key={c}
          type="button"
          onClick={() => toggle(c)}
          className="px-3 py-1.5 rounded-full text-sm border bg-blue-50 border-blue-200 text-blue-700"
        >
          {c} ×
        </button>
      ))}
      {showCustom ? (
        <div className="flex gap-1.5 items-center">
          <input
            ref={inputRef}
            value={customInput}
            onChange={(e) => setCustomInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addCustom()}
            placeholder="Type and press Enter..."
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
          <option value="">Select...</option>
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
            placeholder="Enter custom value..."
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

  const isMultiLine = outputKey === "starFormat" || outputKey === "executiveSummary" || outputKey === "accomplishmentStatement";

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold tracking-widest uppercase text-slate-500">
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
      <div className="flex justify-end">
        <button
          type="button"
          onClick={handleRegenerate}
          disabled={regenerating}
          className="text-xs text-slate-400 hover:text-blue-600 transition-colors disabled:opacity-50 flex items-center gap-1"
        >
          {regenerating ? (
            <>
              <span className="animate-spin inline-block">↺</span> Regenerating…
            </>
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

  // Form state
  const [rawInput, setRawInput] = useState("");
  const [dateOfImpact, setDateOfImpact] = useState(todayISO());
  const [visibilityLevel, setVisibilityLevel] =
    useState<VisibilityLevel>("career-safe");
  const [whoBenefited, setWhoBenefited] = useState<string[]>([]);
  const [impactTypes, setImpactTypes] = useState<string[]>([]);
  const [contributionTypes, setContributionTypes] = useState<string[]>([]);
  const [estimatedImpact, setEstimatedImpact] = useState("");
  const [strategicPriority, setStrategicPriority] = useState("");
  const [kpiMetric, setKpiMetric] = useState("");
  const [companyValue, setCompanyValue] = useState("");
  const [projectInitiative, setProjectInitiative] = useState("");
  const [leadershipPriority, setLeadershipPriority] = useState("");

  // UI state
  const [section2Open, setSection2Open] = useState(true);
  const [section3Open, setSection3Open] = useState(true);
  const [userSettings, setUserSettings] = useState<UserSettings>({
    strategicPriorities: [],
    kpiMetrics: [],
    companyValues: [],
    projects: [],
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [refinedOutputs, setRefinedOutputs] = useState<RefinedOutputs | null>(
    null
  );
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setUserSettings(getUserSettings());
  }, []);

  function addToSettings(
    key: keyof UserSettings,
    value: string
  ) {
    const updated = {
      ...userSettings,
      [key]: [...userSettings[key], value],
    };
    setUserSettings(updated);
    saveUserSettings(updated);
  }

  function buildContext(): Omit<RefineRequest, "rawInput"> {
    return {
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
        setRefinedOutputs(data.outputs);
        setTimeout(
          () => outputsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }),
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
      visibilityLevel,
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

  const sectionHeaderClass =
    "flex items-center justify-between mb-5";
  const sectionLabelClass =
    "text-xs font-semibold tracking-widest uppercase text-slate-500";
  const collapseButtonClass =
    "text-xs text-slate-400 hover:text-slate-600 transition-colors";
  const cardClass = "bg-white border border-slate-200 rounded-xl p-6";
  const fieldLabelClass = "block text-sm font-medium text-slate-700 mb-1.5";

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-slate-900">Capture an Impact</h1>
        <a
          href="/dashboard"
          className="text-sm text-slate-400 hover:text-slate-600 transition-colors"
        >
          ← My Impact
        </a>
      </div>

      {/* ── Section 1: Capture ─────────────────────────────────────────────── */}
      <div className={cardClass}>
        <div className={sectionHeaderClass}>
          <span className={sectionLabelClass}>1 — What happened?</span>
        </div>

        <div className="space-y-4">
          <div>
            <label className={fieldLabelClass}>
              What happened or what did you contribute?
            </label>
            <p className="text-xs text-slate-400 mb-2">
              Include accomplishments, support provided, problems solved,
              process improvements, leadership support, or outcomes.
            </p>
            <textarea
              value={rawInput}
              onChange={(e) => setRawInput(e.target.value)}
              rows={5}
              placeholder="e.g. Coordinated leadership summit for 60 leaders and redesigned the agenda after strategic priorities shifted two days before the event."
              className="w-full border border-slate-200 rounded-lg px-3.5 py-3 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none leading-relaxed"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={fieldLabelClass}>Date of impact</label>
              <input
                type="date"
                value={dateOfImpact}
                onChange={(e) => setDateOfImpact(e.target.value)}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className={fieldLabelClass}>Visibility</label>
              <select
                value={visibilityLevel}
                onChange={(e) =>
                  setVisibilityLevel(e.target.value as VisibilityLevel)
                }
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {(
                  Object.entries(VISIBILITY_LABELS) as [
                    VisibilityLevel,
                    string,
                  ][]
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
      <div className={cardClass}>
        <div className={sectionHeaderClass}>
          <span className={sectionLabelClass}>2 — Add context</span>
          <button
            type="button"
            onClick={() => setSection2Open(!section2Open)}
            className={collapseButtonClass}
          >
            {section2Open ? "▾ Collapse" : "▸ Expand"}
          </button>
        </div>

        {section2Open && (
          <div className="space-y-5">
            <div>
              <label className={fieldLabelClass}>Who benefited?</label>
              <ChipGroup
                options={WHO_BENEFITED}
                selected={whoBenefited}
                onChange={setWhoBenefited}
              />
            </div>

            <div>
              <label className={fieldLabelClass}>
                Work type / Contribution type
              </label>
              <ChipGroup
                options={CONTRIBUTION_TYPES}
                selected={contributionTypes}
                onChange={setContributionTypes}
              />
            </div>

            <div>
              <label className={fieldLabelClass}>Impact type</label>
              <ChipGroup
                options={IMPACT_TYPES}
                selected={impactTypes}
                onChange={setImpactTypes}
              />
            </div>

            <div>
              <label className={fieldLabelClass}>
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
      <div className={cardClass}>
        <div className={sectionHeaderClass}>
          <span className={sectionLabelClass}>3 — Alignment</span>
          <button
            type="button"
            onClick={() => setSection3Open(!section3Open)}
            className={collapseButtonClass}
          >
            {section3Open ? "▾ Collapse" : "▸ Expand"}
          </button>
        </div>

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
              <label className={fieldLabelClass}>
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

      {/* ── Generate button ────────────────────────────────────────────────── */}
      <button
        type="button"
        onClick={handleGenerate}
        disabled={loading || !rawInput.trim()}
        className="w-full bg-blue-600 text-white py-3.5 rounded-xl font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm flex items-center justify-center gap-2"
      >
        {loading ? (
          <>
            <span className="animate-spin inline-block">✦</span> Generating AI
            outputs…
          </>
        ) : (
          <>✦ Generate AI Outputs</>
        )}
      </button>

      {error && (
        <p className="text-red-600 text-sm text-center">{error}</p>
      )}

      {/* ── Section 4: AI Outputs ─────────────────────────────────────────── */}
      {refinedOutputs && (
        <div ref={outputsRef} className="space-y-4 pt-2">
          <div className="flex items-center justify-between">
            <span className={sectionLabelClass}>4 — AI outputs</span>
            <span className="text-xs text-slate-400">
              Copy or refresh individual outputs
            </span>
          </div>

          {/* Accomplishment Statement — full width */}
          <OutputCard
            label={OUTPUT_LABELS.accomplishmentStatement}
            outputKey="accomplishmentStatement"
            text={refinedOutputs.accomplishmentStatement}
            rawInput={rawInput}
            context={buildContext()}
            onRegenerated={handleRegenerated}
          />

          {/* 2-col grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
            className="w-full bg-slate-900 text-white py-3.5 rounded-xl font-medium hover:bg-slate-800 disabled:opacity-50 transition-colors text-sm"
          >
            {saved ? "✓ Saved to My Impact" : "Save to My Impact"}
          </button>
        </div>
      )}
    </div>
  );
}
