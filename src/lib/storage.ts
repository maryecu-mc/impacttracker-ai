import { ImpactEntry, UserSettings } from "./types";

const ENTRIES_KEY = "impact_tracker_entries";
const SETTINGS_KEY = "impact_tracker_settings";

const DEFAULT_SETTINGS: UserSettings = {
  strategicPriorities: [
    "Operational Excellence",
    "Customer Growth",
    "Team Effectiveness",
    "Process Improvement",
  ],
  kpiMetrics: [
    "Response Time",
    "Revenue Growth",
    "Stakeholder Satisfaction",
    "Employee Engagement",
  ],
  companyValues: [
    "Ownership",
    "Collaboration",
    "Continuous Improvement",
    "Customer Focus",
  ],
  projects: [],
};

export function getEntries(): ImpactEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(ENTRIES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveEntry(entry: ImpactEntry): void {
  const entries = getEntries();
  const idx = entries.findIndex((e) => e.id === entry.id);
  if (idx >= 0) {
    entries[idx] = entry;
  } else {
    entries.unshift(entry);
  }
  localStorage.setItem(ENTRIES_KEY, JSON.stringify(entries));
}

export function deleteEntry(id: string): void {
  const entries = getEntries().filter((e) => e.id !== id);
  localStorage.setItem(ENTRIES_KEY, JSON.stringify(entries));
}

export function getUserSettings(): UserSettings {
  if (typeof window === "undefined") return DEFAULT_SETTINGS;
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    const saved = JSON.parse(raw) as Partial<UserSettings>;
    return {
      strategicPriorities:
        saved.strategicPriorities ?? DEFAULT_SETTINGS.strategicPriorities,
      kpiMetrics: saved.kpiMetrics ?? DEFAULT_SETTINGS.kpiMetrics,
      companyValues: saved.companyValues ?? DEFAULT_SETTINGS.companyValues,
      projects: saved.projects ?? DEFAULT_SETTINGS.projects,
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveUserSettings(settings: UserSettings): void {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function todayISO(): string {
  return new Date().toISOString().split("T")[0];
}
