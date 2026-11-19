export type Layout = "ru" | "en";

export type TestDuration = 15 | 30 | 60 | 120;

export type Finger = "pinky" | "ring" | "middle" | "index" | "thumb";
export type Hand = "left" | "right" | "both";

export interface KeyDef {
  char: string;
  displayChar?: string;
  shiftChar?: string;
  finger: Finger;
  hand: Hand;
  code: string;
  row: 1 | 2 | 3 | 4 | 5;
  isHome?: boolean;
  isAnchor?: boolean;
}

export interface TypingMetrics {
  durationSec: number;
  c: number; // Correct characters in final buffer
  a: number; // All input attempts
  h: number; // Hits (correct at time of pressing)
  e: number; // Errors (a - h)
  backspaces: number;
  cpm: number;
  wpm: number;
  accuracy: number; // In percent (0 - 100)
}

export interface TypingResult extends TypingMetrics {
  id: string;
  layout: Layout;
  timestamp: string;
  mode: "test" | "training" | "lesson";
  lessonId?: string;
  mistakesByKey: Record<string, number>;
}

export interface LessonExercise {
  id: string;
  title: string;
  description: string;
  targetKeys: string[];
  text: string;
  minAccuracy: number;
  targetCpm?: number;
}

export interface CourseLevel {
  level: number;
  title: string;
  description: string;
  fingerFocus: string;
  exercises: LessonExercise[];
}
