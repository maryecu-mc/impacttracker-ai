"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  generateId,
  getUserSettings,
  saveUserSettings,
  todayISO,
} from "@/lib/storage";
import { createClient } from "@/lib/supabase/client";
import type {
  RefinedOutputs,
  RefineRequest,
  UserSettings,
  PrimaryUse,
  ImpactEntry,
} from "@/lib/types";
import { PRIMARY_USE_LABELS } from "@/lib/types";
import type { User } from "@supabase/supabase-js";

// ─── Constants ────────────────────────────────────────────────────────────────

const DRAFT_KEY = "impact_tracker_draft";

const WHO_HELPED = [
  "Executive / leadership team",
  "My team",
  "Customer / client",
  "Department",
  "Company-wide",
  "Vendor / partner",
  "Cross-functional stakeholders",
];

const CONTRIBUTION_TYPES = [
  "Operational support",
  "Leadership support",
  "Project coordination",
  "Communication",
  "Relationship management",
  "Problem solving",
  "Process improvement",
  "Event / meeting execution",
  "Strategic support",
  "Stakeholder support",
  "Operations",
  "Change management",
];

const CONTRIBUTION_TYPES_DEFAULT_VISIBLE = 6;

const IMPACT_TYPES = [
  "Time savings",
  "Cost savings",
  "Risk reduction",
  "Operational efficiency",
  "Better decision-making",
  "Strategic alignment",
  "Revenue / profitability support",
  "Customer experience",
  "Employee experience",
  "Process improvement",
  "Leadership enablement",
  "Culture / engagement",
  "Project execution",
  "Communication effectiveness",
  "Relationship management",
];

const IMPACT_TYPES_DEFAULT_VISIBLE = 6;

const OUTPUT_LABELS: Record<keyof RefinedOutputs, string> = {
  accomplishmentStatement: "Accomplishment Statement",
  measurableImpact: "Measurable Impact",
  performanceReviewBullet: "Performance Review Bullet",
  leadershipUpdateBullet: "Leadership Update Bullet",
  careerStoryBullet: "Career Story Bullet",
  executiveSummary: "Executive Summary",
  starFormat: "STAR Format",
};

// ─── Draft helpers ─────────────────────────────────────────────────────────────

interface DraftState {
  rawInput: string;
  dateOfImpact: string;
  primaryUse: PrimaryUse;
  whoBenefited: string[];
  impactTypes: string[];
  contributionTypes: string[];
  estimatedImpact: string;
  strategicPriority: string;
  kpiMetric: string;
  companyValue: string;
  projectInitiative: string;
  leadershipPriority: string;
}

function loadDraft(): DraftState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

function saveDraftLS(state: DraftState) {
  if (typeof window !== "undefined") localStorage.setItem(DRAFT_KEY, JSON.stringify(state));
}

function clearDraftLS() {
  if (typeof window !== "undefined") localStorage.removeItem(DRAFT_KEY);
}

// ─── Icons ───────────────────────────────────────────────────────────────────

const IconEdit = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-500">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
  </svg>
);

const IconUsers = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-400">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
    <circle cx="9" cy="7" r="4"/>
    <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
    <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
  </svg>
);

const IconTarget = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-400">
    <circle cx="12" cy="12" r="10"/>
    <circle cx="12" cy="12" r="6"/>
    <circle cx="12" cy="12" r="2"/>
  </svg>
);

// ─── Sub-components ───────────────────────────────────────────────────────────

function SectionHeader({ title, icon, collapsible = false, open, onToggle }: {
  title: string; icon?: React.ReactNode; collapsible?: boolean; open?: boolean; onToggle?: () => void;
}) {
  return (
    <div className="flex items-center justify-between mb-4">
      <h2 className="text-sm font-semibold text-slate-800 border-l-2 border-blue-500 pl-3 leading-tight flex items-center gap-2">
        {icon && <span className="inline-flex items-center">{icon}</span>}
        {title}
      </h2>
      {collapsible && onToggle && (
        <button type="button" onClick={onToggle} className="text-xs text-slate-400 hover:text-slate-600 transition-colors px-2 py-1">
          {open ? "Hide alignment" : "Add strategic alignment"}
        </button>
      )}
    </div>
  );
}

function ChipGroup({ options, selected, onChange, defaultVisible, moreLabel, fewerLabel }: {
  options: string[]; selected: string[]; onChange: (values: string[]) => void;
  defaultVisible?: number; moreLabel?: string; fewerLabel?: string;
}) {
  const [showAll, setShowAll] = useState(false);
  const [showCustom, setShowCustom] = useState(false);
  const [customInput, setCustomInput] = useState("");

  function toggle(value: string) {
    onChange(selected.includes(value) ? selected.filter((v) => v !== value) : [...selected, value]);
  }
  function addCustom() {
    const v = customInput.trim();
    if (v && !selected.includes(v)) onChange([...selected, v]);
    setCustomInput(""); setShowCustom(false);
  }

  const shouldCollapse = !!defaultVisible && !showAll && options.length > defaultVisible;
  const visibleOptions = shouldCollapse ? options.slice(0, defaultVisible) : options;
  const hiddenOptions = shouldCollapse ? options.slice(defaultVisible) : [];
  const selectedFromHidden = hiddenOptions.filter((o) => selected.includes(o));
  const hiddenUnselectedCount = hiddenOptions.filter((o) => !selected.includes(o)).length;
  const displayedOptions = [...visibleOptions, ...selectedFromHidden];
  const customSelected = selected.filter((s) => !options.includes(s));

  return (
    <div className="flex flex-wrap gap-1.5">
      {displayedOptions.map((opt) => {
        const isSelected = selected.includes(opt);
        return (
          <button key={opt} type="button" onClick={() => toggle(opt)}
            className={`px-3 py-1.5 rounded-full text-sm border transition-all duration-150 font-medium ${isSelected
              ? "bg-blue-600 border-blue-600 text-white shadow-sm ring-2 ring-blue-600/20"
              : "bg-white border-slate-200 text-slate-600 hover:border-blue-200 hover:bg-blue-50/50 hover:text-slate-800"}`}>
            {isSelected ? `✓ ${opt}` : opt}
          </button>
        );
      })}
      {customSelected.map((c) => (
        <button key={c} type="button" onClick={() => toggle(c)}
          className="px-3 py-1.5 rounded-full text-sm border bg-blue-600 border-blue-600 text-white font-medium shadow-sm">
          ✓ {c} ×
        </button>
      ))}
      {shouldCollapse && hiddenUnselectedCount > 0 && (
        <button type="button" onClick={() => setShowAll(true)}
          className="px-3 py-1.5 rounded-full text-sm border border-dashed border-blue-300 text-blue-500 hover:border-blue-400 hover:text-blue-600 transition-colors font-medium">
          {moreLabel ?? `+ ${hiddenUnselectedCount} more`}
        </button>
      )}
      {!shouldCollapse && defaultVisible && options.length > defaultVisible && (
        <button type="button" onClick={() => setShowAll(false)}
          className="px-3 py-1.5 rounded-full text-sm border border-dashed border-slate-300 text-slate-400 hover:border-slate-400 hover:text-slate-500 transition-colors">
          {fewerLabel ?? "Show less"}
        </button>
      )}
      {showCustom ? (
        <div className="flex gap-1.5 items-center">
          <input value={customInput} onChange={(e) => setCustomInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addCustom()}
            placeholder="Type and press Enter…" className="px-2.5 py-1.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-44" autoFocus />
          <button type="button" onClick={addCustom} className="text-xs px-2.5 py-1.5 bg-blue-600 text-white rounded-lg">Add</button>
          <button type="button" onClick={() => setShowCustom(false)} className="text-xs text-slate-400 hover:text-slate-600">Cancel</button>
        </div>
      ) : (
        <button type="button" onClick={() => setShowCustom(true)}
          className="px-3 py-1.5 rounded-full text-sm border border-dashed border-slate-300 text-slate-400 hover:border-slate-400 hover:text-slate-500 transition-colors">
          + Other
        </button>
      )}
    </div>
  );
}

function AlignmentSelect({ label, value, onChange, options, onAddOption, optional = false }: {
  label: string; value: string; onChange: (v: string) => void; options: string[]; onAddOption: (v: string) => void; optional?: boolean;
}) {
  const [showAdd, setShowAdd] = useState(false);
  const [newValue, setNewValue] = useState("");
  function handleAdd() {
    const v = newValue.trim(); if (!v) return;
    onAddOption(v); onChange(v); setNewValue(""); setShowAdd(false);
  }
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-1.5">
        {label}{optional && <span className="text-slate-400 font-normal ml-1">(optional)</span>}
      </label>
      <div className="flex gap-2">
        <select value={value} onChange={(e) => onChange(e.target.value)}
          className="flex-1 border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option value="">Select…</option>
          {options.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
        </select>
        <button type="button" onClick={() => setShowAdd(!showAdd)}
          className="px-3 py-2 text-sm border border-dashed border-slate-300 rounded-lg text-slate-500 hover:border-slate-400 hover:text-slate-600 whitespace-nowrap transition-colors">
          + Add
        </button>
      </div>
      {showAdd && (
        <div className="flex gap-2 mt-2">
          <input value={newValue} onChange={(e) => setNewValue(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleAdd()}
            placeholder="Enter custom value…" className="flex-1 border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" autoFocus />
          <button type="button" onClick={handleAdd} className="px-3 py-2 bg-blue-600 text-white text-sm rounded-lg">Save</button>
          <button type="button" onClick={() => setShowAdd(false)} className="px-3 py-2 text-slate-500 text-sm">Cancel</button>
        </div>
      )}
    </div>
  );
}

function OutputCard({ label, outputKey, text, rawInput, context, onRegenerated }: {
  label: string; outputKey: keyof RefinedOutputs; text: string;
  rawInput: string; context: Omit<RefineRequest, "rawInput">; onRegenerated: (key: keyof RefinedOutputs, newText: string) => void;
}) {
  const [copied, setCopied] = useState(false);
  const [regenerating, setRegenerating] = useState(false);

  async function handleCopy() {
    await navigator.clipboard.writeText(text);
    setCopied(true); setTimeout(() => setCopied(false), 2000);
  }
  async function handleRegenerate() {
    setRegenerating(true);
    try {
      const res = await fetch("/api/regenerate", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ rawInput, context, outputKey }) });
      const data = await res.json();
      if (data.text) onRegenerated(outputKey, data.text);
    } finally { setRegenerating(false); }
  }

  const isMultiLine = outputKey === "starFormat" || outputKey === "executiveSummary" || outputKey === "accomplishmentStatement";
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{label}</span>
        <button type="button" onClick={handleCopy}
          className={`text-xs px-2.5 py-1 rounded-md border transition-colors ${copied ? "bg-green-50 border-green-200 text-green-700" : "border-slate-200 text-slate-500 hover:border-slate-300 hover:text-slate-700"}`}>
          {copied ? "✓ Copied" : "Copy"}
        </button>
      </div>
      <p className={`text-sm text-slate-800 leading-relaxed flex-1 ${isMultiLine ? "whitespace-pre-line" : ""}`}>{text}</p>
      <div className="flex justify-end pt-1 border-t border-slate-100">
        <button type="button" onClick={handleRegenerate} disabled={regenerating}
          className="text-xs text-slate-400 hover:text-blue-600 transition-colors disabled:opacity-50 flex items-center gap-1">
          {regenerating ? <><span className="animate-spin inline-block">↺</span> Regenerating…</> : <>↺ Refresh</>}
        </button>
      </div>
    </div>
  );
}

type SaveStatus = "idle" | "saving" | "saved" | "error";

function SaveStatusBadge({ status }: { status: SaveStatus }) {
  if (status === "idle") return null;
  const map: Record<SaveStatus, [string, string]> = {
    idle: ["", ""],
    saving: ["text-slate-400", "Saving…"],
    saved: ["text-green-600", "✓ Saved"],
    error: ["text-red-500", "Unable to save — try again"],
  };
  const [cls, label] = map[status];
  return <span className={`text-xs font-medium ${cls}`}>{label}</span>;
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function TrackerPage() {
  const router = useRouter();
  const outputsRef = useRef<HTMLDivElement>(null);

  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

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
  const [section3Open, setSection3Open] = useState(false);
  const [userSettings, setUserSettings] = useState<UserSettings>({ strategicPriorities: [], kpiMetrics: [], companyValues: [], projects: [] });

  const [loading, setLoading] = useState(false);
  const [genError, setGenError] = useState("");
  const [demoMode, setDemoMode] = useState(false);
  const [refinedOutputs, setRefinedOutputs] = useState<RefinedOutputs | null>(null);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [showSignInPrompt, setShowSignInPrompt] = useState(false);

  const [hasDraft, setHasDraft] = useState(false);
  const [draftDismissed, setDraftDismissed] = useState(false);

  // Auth state
  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null);
      setAuthLoading(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => { setUserSettings(getUserSettings()); }, []);

  // Check for draft on mount
  useEffect(() => {
    const draft = loadDraft();
    if (draft?.rawInput?.trim()) setHasDraft(true);
  }, []);

  // Autosave draft to localStorage
  useEffect(() => {
    if (!rawInput.trim()) return;
    saveDraftLS({ rawInput, dateOfImpact, primaryUse, whoBenefited, impactTypes, contributionTypes, estimatedImpact, strategicPriority, kpiMetric, companyValue, projectInitiative, leadershipPriority });
  }, [rawInput, dateOfImpact, primaryUse, whoBenefited, impactTypes, contributionTypes, estimatedImpact, strategicPriority, kpiMetric, companyValue, projectInitiative, leadershipPriority]);

  function resumeDraft() {
    const d = loadDraft(); if (!d) return;
    setRawInput(d.rawInput); setDateOfImpact(d.dateOfImpact); setPrimaryUse(d.primaryUse);
    setWhoBenefited(d.whoBenefited); setImpactTypes(d.impactTypes); setContributionTypes(d.contributionTypes);
    setEstimatedImpact(d.estimatedImpact); setStrategicPriority(d.strategicPriority); setKpiMetric(d.kpiMetric);
    setCompanyValue(d.companyValue); setProjectInitiative(d.projectInitiative); setLeadershipPriority(d.leadershipPriority);
    setHasDraft(false); setDraftDismissed(true);
  }

  function discardDraft() { clearDraftLS(); setHasDraft(false); setDraftDismissed(true); }

  function addToSettings(key: keyof UserSettings, value: string) {
    const updated = { ...userSettings, [key]: [...userSettings[key], value] };
    setUserSettings(updated); saveUserSettings(updated);
  }

  function buildContext(): Omit<RefineRequest, "rawInput"> {
    return { primaryUse, dateOfImpact, whoBenefited, impactTypes, contributionTypes, estimatedImpact, strategicPriority, kpiMetric, companyValue };
  }

  async function handleSave() {
    if (!rawInput.trim()) return;
    if (!user) { setShowSignInPrompt(true); return; }

    setSaveStatus("saving");
    const now = new Date().toISOString();
    const entry: ImpactEntry = {
      id: generateId(), createdAt: now, updatedAt: now, dateOfImpact, primaryUse,
      rawInput, whoBenefited, impactTypes, contributionTypes, estimatedImpact,
      strategicPriority, kpiMetric, companyValue, projectInitiative, leadershipPriority, refinedOutputs,
    };

    try {
      const res = await fetch("/api/entries", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(entry) });
      if (!res.ok) throw new Error();
      setSaveStatus("saved");
      clearDraftLS();
      setTimeout(() => router.push("/dashboard"), 800);
    } catch {
      setSaveStatus("error");
    }
  }

  async function handleGenerate() {
    if (!rawInput.trim()) return;
    setLoading(true); setGenError(""); setDemoMode(false); setRefinedOutputs(null); setSaveStatus("idle");
    try {
      const res = await fetch("/api/refine", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ rawInput, ...buildContext() } as RefineRequest) });
      const data = await res.json();
      if (data.error) { setGenError(data.error); }
      else {
        if (data.demo) setDemoMode(true);
        setRefinedOutputs(data.outputs);
        setTimeout(() => outputsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 100);
      }
    } catch { setGenError("Something went wrong. Please try again."); }
    finally { setLoading(false); }
  }

  function handleRegenerated(key: keyof RefinedOutputs, newText: string) {
    if (!refinedOutputs) return;
    setRefinedOutputs({ ...refinedOutputs, [key]: newText });
  }

  const cardPrimary = "bg-white border border-slate-300 rounded-xl p-5 shadow-md";
  const card = "bg-white border border-slate-200 rounded-xl p-5 shadow-sm";
  const fieldLabel = "block text-sm font-medium text-slate-700 mb-1.5";

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <div className="flex items-center justify-between mb-1">
        <h1 className="text-lg font-semibold text-slate-900">Capture Impact</h1>
        <a href="/dashboard" className="text-sm text-slate-400 hover:text-slate-600 transition-colors">← My Impact</a>
      </div>

      {/* Draft banner */}
      {hasDraft && !draftDismissed && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 flex items-center justify-between gap-4">
          <p className="text-sm text-amber-800 font-medium">You have an unsaved draft.</p>
          <div className="flex gap-2 shrink-0">
            <button type="button" onClick={resumeDraft} className="text-xs bg-amber-600 text-white px-3 py-1.5 rounded-lg hover:bg-amber-700 transition-colors font-medium">Resume</button>
            <button type="button" onClick={discardDraft} className="text-xs text-amber-600 hover:text-amber-800 px-2 py-1.5 transition-colors">Discard</button>
          </div>
        </div>
      )}

      {/* Sign-in prompt */}
      {showSignInPrompt && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl px-5 py-4">
          <p className="text-sm font-semibold text-blue-900 mb-1">Sign in to save your impact</p>
          <p className="text-sm text-blue-700 mb-3">Your draft is preserved. Sign in to save it to your account and access it anywhere.</p>
          <div className="flex gap-2">
            <a href="/auth/signin?next=/tracker" className="text-sm bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium">Sign in</a>
            <button type="button" onClick={() => setShowSignInPrompt(false)} className="text-sm text-blue-600 hover:text-blue-800 px-3 py-2">Not now</button>
          </div>
        </div>
      )}

      {/* Motivational callout */}
      <div className="bg-slate-800 rounded-xl px-5 py-4 flex items-start gap-3.5">
        <div className="text-blue-400 mt-0.5 shrink-0">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
          </svg>
        </div>
        <div>
          <p className="text-sm font-semibold text-white mb-1">You&apos;ve already done the work.</p>
          <p className="text-sm text-slate-300 leading-relaxed">Capture the accomplishments, decisions, and contributions that move the business forward before they disappear into the week.</p>
        </div>
      </div>

      {/* Section 1 */}
      <div className={cardPrimary}>
        <SectionHeader title="Describe the impact" icon={<IconEdit />} />
        <div className="space-y-4">
          <div>
            <label className={fieldLabel}>What happened or what did you contribute?</label>
            <p className="text-xs text-slate-400 mb-2">Accomplishments, support provided, problems solved, process improvements, leadership support, or outcomes.</p>
            <textarea value={rawInput} onChange={(e) => setRawInput(e.target.value)} rows={5}
              placeholder={"Examples:\n• Coordinated a leadership summit for 60 leaders\n• Redesigned a reporting process that reduced delays\n• Managed competing priorities during a critical transition"}
              className="w-full border border-slate-200 rounded-lg px-3.5 py-3 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/25 focus:border-blue-400 resize-none leading-relaxed transition-colors" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={fieldLabel}>Date of impact</label>
              <input type="date" value={dateOfImpact} onChange={(e) => setDateOfImpact(e.target.value)}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className={fieldLabel}>Primary use</label>
              <select value={primaryUse} onChange={(e) => setPrimaryUse(e.target.value as PrimaryUse)}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500">
                {(Object.entries(PRIMARY_USE_LABELS) as [PrimaryUse, string][]).map(([val, label]) => <option key={val} value={val}>{label}</option>)}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Section 2 */}
      <div className={card}>
        <SectionHeader title="Add Context" icon={<IconUsers />} collapsible open={section2Open} onToggle={() => setSection2Open(!section2Open)} />
        {section2Open && (
          <div className="space-y-4">
            <div><label className={fieldLabel}>Who did this help?</label><ChipGroup options={WHO_HELPED} selected={whoBenefited} onChange={setWhoBenefited} /></div>
            <div><label className={fieldLabel}>Work type</label><ChipGroup options={CONTRIBUTION_TYPES} selected={contributionTypes} onChange={setContributionTypes} defaultVisible={CONTRIBUTION_TYPES_DEFAULT_VISIBLE} moreLabel="More work types →" fewerLabel="Show fewer work types" /></div>
            <div><label className={fieldLabel}>Impact type</label><ChipGroup options={IMPACT_TYPES} selected={impactTypes} onChange={setImpactTypes} defaultVisible={IMPACT_TYPES_DEFAULT_VISIBLE} moreLabel="More impact types →" fewerLabel="Show fewer impact types" /></div>
            <div>
              <label className={fieldLabel}>Estimated impact <span className="text-slate-400 font-normal">(optional)</span></label>
              <input type="text" value={estimatedImpact} onChange={(e) => setEstimatedImpact(e.target.value)}
                placeholder="e.g. Saved ~3 days of re-planning time, accelerated decision-making"
                className="w-full border border-slate-200 rounded-lg px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>
        )}
      </div>

      {/* Section 3 */}
      <div className={card}>
        <SectionHeader title="Alignment" icon={<IconTarget />} collapsible open={section3Open} onToggle={() => setSection3Open(!section3Open)} />
        {section3Open && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <AlignmentSelect label="Strategic Priority" value={strategicPriority} onChange={setStrategicPriority} options={userSettings.strategicPriorities} onAddOption={(v) => addToSettings("strategicPriorities", v)} />
              <AlignmentSelect label="KPI / Metric" value={kpiMetric} onChange={setKpiMetric} options={userSettings.kpiMetrics} onAddOption={(v) => addToSettings("kpiMetrics", v)} />
              <AlignmentSelect label="Company Value" value={companyValue} onChange={setCompanyValue} options={userSettings.companyValues} onAddOption={(v) => addToSettings("companyValues", v)} />
              <AlignmentSelect label="Project / Initiative" value={projectInitiative} onChange={setProjectInitiative} options={userSettings.projects} onAddOption={(v) => addToSettings("projects", v)} optional />
            </div>
            <div>
              <label className={fieldLabel}>Leadership Priority <span className="text-slate-400 font-normal">(optional)</span></label>
              <input type="text" value={leadershipPriority} onChange={(e) => setLeadershipPriority(e.target.value)}
                placeholder="e.g. CEO's Q2 focus on executive team alignment"
                className="w-full border border-slate-200 rounded-lg px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="space-y-2">
        <div className="flex items-center justify-between px-1">
          <span className="text-xs text-slate-400">
            {authLoading ? "" : user ? `Signed in as ${user.email}` : "Sign in to save your work"}
          </span>
          <SaveStatusBadge status={saveStatus} />
        </div>
        <button type="button" onClick={handleSave}
          disabled={saveStatus === "saving" || saveStatus === "saved" || !rawInput.trim()}
          className="w-full bg-slate-700 text-white py-3.5 rounded-xl font-semibold hover:bg-slate-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-sm">
          {saveStatus === "saved" ? "✓ Saved to My Impact" : saveStatus === "saving" ? "Saving…" : "Save to My Impact"}
        </button>
        <button type="button" onClick={handleGenerate} disabled={loading || !rawInput.trim()}
          className="w-full bg-blue-700 text-white py-3 rounded-xl font-medium hover:bg-blue-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-sm flex items-center justify-center gap-2">
          {loading ? <><span className="animate-spin inline-block">✦</span> Generating AI Outputs…</> : <>✦ Generate AI Outputs</>}
        </button>
      </div>

      {genError && (
        <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700">{genError}</div>
      )}

      {/* AI Outputs */}
      {refinedOutputs && (
        <div ref={outputsRef} className="space-y-3 pt-1">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-800 border-l-2 border-blue-500 pl-3">AI Outputs</h2>
            <span className="text-xs text-slate-400">Copy or refresh each output individually</span>
          </div>

          {demoMode && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 flex items-start gap-2.5">
              <span className="text-amber-500 mt-0.5 shrink-0">◈</span>
              <div>
                <p className="text-sm font-medium text-amber-800">Demo mode</p>
                <p className="text-xs text-amber-700 mt-0.5">These outputs are generated from templates, not AI. Add <code className="bg-amber-100 px-1 py-0.5 rounded text-xs font-mono">ANTHROPIC_API_KEY</code> to your Vercel environment variables to enable full AI generation.</p>
              </div>
            </div>
          )}

          <OutputCard label={OUTPUT_LABELS.accomplishmentStatement} outputKey="accomplishmentStatement" text={refinedOutputs.accomplishmentStatement} rawInput={rawInput} context={buildContext()} onRegenerated={handleRegenerated} />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <OutputCard label={OUTPUT_LABELS.performanceReviewBullet} outputKey="performanceReviewBullet" text={refinedOutputs.performanceReviewBullet} rawInput={rawInput} context={buildContext()} onRegenerated={handleRegenerated} />
            <OutputCard label={OUTPUT_LABELS.leadershipUpdateBullet} outputKey="leadershipUpdateBullet" text={refinedOutputs.leadershipUpdateBullet} rawInput={rawInput} context={buildContext()} onRegenerated={handleRegenerated} />
            <OutputCard label={OUTPUT_LABELS.careerStoryBullet} outputKey="careerStoryBullet" text={refinedOutputs.careerStoryBullet} rawInput={rawInput} context={buildContext()} onRegenerated={handleRegenerated} />
            <OutputCard label={OUTPUT_LABELS.starFormat} outputKey="starFormat" text={refinedOutputs.starFormat} rawInput={rawInput} context={buildContext()} onRegenerated={handleRegenerated} />
            <OutputCard label={OUTPUT_LABELS.measurableImpact} outputKey="measurableImpact" text={refinedOutputs.measurableImpact} rawInput={rawInput} context={buildContext()} onRegenerated={handleRegenerated} />
            <OutputCard label={OUTPUT_LABELS.executiveSummary} outputKey="executiveSummary" text={refinedOutputs.executiveSummary} rawInput={rawInput} context={buildContext()} onRegenerated={handleRegenerated} />
          </div>

          <div className="flex items-center justify-end px-1"><SaveStatusBadge status={saveStatus} /></div>
          <button type="button" onClick={handleSave} disabled={saveStatus === "saving" || saveStatus === "saved"}
            className="w-full bg-slate-700 text-white py-4 rounded-xl font-semibold hover:bg-slate-600 disabled:opacity-50 transition-colors text-base">
            {saveStatus === "saved" ? "✓ Saved to My Impact" : saveStatus === "saving" ? "Saving…" : "Save Refined Impact"}
          </button>
        </div>
      )}
    </div>
  );
}
