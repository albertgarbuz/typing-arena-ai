import type { Layout, TypingResult } from "./types";

const RESULTS_KEY = "typing-arena-results";
const PROGRESS_KEY = "typing-arena-progress";

export interface ExerciseProgress {
  accuracy: number;
  cpm: number;
  passedAt: string;
}

export interface ProgressData {
  completedExercises: Record<string, ExerciseProgress>;
}

export function parseProgress(raw: string): ProgressData["completedExercises"] {
  try {
    const exercises = JSON.parse(raw)?.completedExercises;
    return exercises && typeof exercises === "object" && !Array.isArray(exercises) ? exercises : {};
  } catch {
    return {};
  }
}

function isBetter(attempt: ExerciseProgress, saved?: ExerciseProgress): boolean {
  return !saved || !Number.isFinite(saved.accuracy) || attempt.accuracy > saved.accuracy ||
    (attempt.accuracy === saved.accuracy && attempt.cpm > saved.cpm);
}

let progressSnapshot = { stored: "", history: "", merged: "{}" };

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
    const saved = raw ? JSON.parse(raw) : [];
    const list: TypingResult[] = Array.isArray(saved) ? saved : [];
    list.unshift(result);
    if (list.length > 100) {
      // Keep recovered lessons when older attempts leave the rolling history.
      const recovered = getProgressRaw();
      if (recovered !== localStorage.getItem(PROGRESS_KEY)) localStorage.setItem(PROGRESS_KEY, recovered);
      list.length = 100;
    }
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
  if (typeof window === "undefined" || !Number.isFinite(accuracy) || !Number.isFinite(cpm)) return;
  try {
    const progress = parseProgress(getProgressRaw());
    const attempt = { accuracy, cpm, passedAt: new Date().toISOString() };

    if (isBetter(attempt, progress[exerciseId])) progress[exerciseId] = attempt;
    const snapshot = JSON.stringify({ completedExercises: progress });
    if (snapshot !== localStorage.getItem(PROGRESS_KEY)) {
      localStorage.setItem(PROGRESS_KEY, snapshot);
      notify();
    }
  } catch (err) {
    console.error("Failed to save progress:", err);
  }
}

export function getProgressRaw(): string {
  if (typeof window === "undefined") return "{}";
  try {
    const stored = localStorage.getItem(PROGRESS_KEY) || "{}";
    const history = getResultsRaw();
    if (stored === progressSnapshot.stored && history === progressSnapshot.history) {
      return progressSnapshot.merged;
    }
    const progress = parseProgress(stored);
    const results = getResults();
    for (const result of Array.isArray(results) ? results : []) {
      if (result?.mode !== "lesson" || typeof result.lessonId !== "string" || !/^(ru|en)-\d+$/.test(result.lessonId) ||
        !Number.isFinite(result.accuracy) || !Number.isFinite(result.cpm) || typeof result.timestamp !== "string") continue;
      const attempt = { accuracy: result.accuracy, cpm: result.cpm, passedAt: result.timestamp };
      if (isBetter(attempt, progress[result.lessonId])) progress[result.lessonId] = attempt;
    }
    const merged = JSON.stringify({ completedExercises: progress });
    progressSnapshot = { stored, history, merged };
    return merged;
  } catch {
    return "{}";
  }
}

export function getExerciseProgress(): ProgressData["completedExercises"] {
  return parseProgress(getProgressRaw());
}
