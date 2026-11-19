import type { Layout, TypingResult } from "./types";

const RESULTS_KEY = "typing-arena-results";
const PROGRESS_KEY = "typing-arena-progress";

export interface ProgressData {
  completedExercises: Record<string, { accuracy: number; cpm: number; passedAt: string }>;
}

const listeners = new Set<() => void>();

export function subscribeStorage(callback: () => void): () => void {
  listeners.add(callback);
  if (typeof window !== "undefined") {
    window.addEventListener("storage", callback);
  }
  return () => {
    listeners.delete(callback);
    if (typeof window !== "undefined") {
      window.removeEventListener("storage", callback);
    }
  };
}

function notify() {
  for (const l of listeners) {
    l();
  }
}

export function saveResult(result: TypingResult): void {
  if (typeof window === "undefined") return;
  try {
    const raw = localStorage.getItem(RESULTS_KEY);
    const list: TypingResult[] = raw ? JSON.parse(raw) : [];
    list.unshift(result);
    if (list.length > 100) list.length = 100;
    localStorage.setItem(RESULTS_KEY, JSON.stringify(list));
    notify();
  } catch (err) {
    console.error("Failed to save result:", err);
  }
}

export function getResultsRaw(): string {
  if (typeof window === "undefined") return "[]";
  try {
    return localStorage.getItem(RESULTS_KEY) || "[]";
  } catch {
    return "[]";
  }
}

export function getResults(layout?: Layout): TypingResult[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(RESULTS_KEY);
    const list: TypingResult[] = raw ? JSON.parse(raw) : [];
    if (layout) {
      return list.filter((r) => r.layout === layout);
    }
    return list;
  } catch {
    return [];
  }
}

export function getPersonalBest(layout: Layout): TypingResult | null {
  const results = getResults(layout);
  if (results.length === 0) return null;
  return results.reduce((best, cur) => (cur.cpm > best.cpm ? cur : best), results[0]);
}

export function saveExerciseProgress(
  exerciseId: string,
  accuracy: number,
  cpm: number
): void {
  if (typeof window === "undefined") return;
  try {
    const raw = localStorage.getItem(PROGRESS_KEY);
    const progress: ProgressData = raw ? JSON.parse(raw) : { completedExercises: {} };
    const current = progress.completedExercises[exerciseId];

    if (!current || accuracy > current.accuracy || cpm > current.cpm) {
      progress.completedExercises[exerciseId] = {
        accuracy,
        cpm,
        passedAt: new Date().toISOString(),
      };
      localStorage.setItem(PROGRESS_KEY, JSON.stringify(progress));
      notify();
    }
  } catch (err) {
    console.error("Failed to save progress:", err);
  }
}

export function getProgressRaw(): string {
  if (typeof window === "undefined") return "{}";
  try {
    return localStorage.getItem(PROGRESS_KEY) || "{}";
  } catch {
    return "{}";
  }
}

export function getExerciseProgress(): Record<string, { accuracy: number; cpm: number; passedAt: string }> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(PROGRESS_KEY);
    const progress: ProgressData = raw ? JSON.parse(raw) : { completedExercises: {} };
    return progress.completedExercises;
  } catch {
    return {};
  }
}
