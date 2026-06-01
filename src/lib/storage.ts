import { ImpactEntry } from "./types";

const STORAGE_KEY = "impact_tracker_entries";

export function getEntries(): ImpactEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveEntry(entry: ImpactEntry): void {
  const entries = getEntries();
  const existing = entries.findIndex((e) => e.id === entry.id);
  if (existing >= 0) {
    entries[existing] = entry;
  } else {
    entries.unshift(entry);
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
}

export function deleteEntry(id: string): void {
  const entries = getEntries().filter((e) => e.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
}

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}
