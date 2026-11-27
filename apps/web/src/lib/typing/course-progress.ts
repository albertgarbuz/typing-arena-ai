import type { UserProfile } from "../auth/user";
import type { ProgressData } from "./storage";
import type { CourseLevel, Layout, LessonExercise } from "./types";

type CourseProfile = Pick<UserProfile, "nickname" | "creditedLessons" | "openRuLevels">;

export function getCourseProgress(
  layout: Layout,
  levels: CourseLevel[],
  progress: ProgressData["completedExercises"],
  profile: Partial<CourseProfile>,
) {
  const credited = new Set(Array.isArray(profile.creditedLessons) ? profile.creditedLessons : []);
  const openRuLevels = Array.isArray(profile.openRuLevels) ? profile.openRuLevels : [];
  const isPassed = (exercise: LessonExercise) =>
    credited.has(exercise.id) || (progress[exercise.id]?.accuracy ?? 0) >= exercise.minAccuracy;

  let unlockedThrough = 1;
  for (const level of levels) {
    const exam = level.exercises.at(-1);
    if (level.exercises.some(isPassed) || (layout === "ru" && openRuLevels.includes(level.level))) {
      unlockedThrough = Math.max(unlockedThrough, level.level);
    }
    if (exam && isPassed(exam)) unlockedThrough = Math.max(unlockedThrough, level.level + 1);
  }

  // Restore the course position requested by the existing Fantom777 player without awarding missing lessons.
  const thirdLevel = levels.find(level => level.level === 3);
  if (layout === "ru" && profile.nickname?.trim().toLowerCase() === "fantom777" &&
    (openRuLevels.includes(3) || thirdLevel?.exercises.some(isPassed))) {
    unlockedThrough = Math.max(unlockedThrough, 4);
  }
  unlockedThrough = Math.min(unlockedThrough, levels.at(-1)?.level ?? 1);

  const lessons = levels.flatMap(level => level.exercises.map(exercise => ({ level: level.level, exercise })));
  const remaining = lessons.filter(item => item.level <= unlockedThrough && !isPassed(item.exercise));
  const next = remaining.find(item => item.level === unlockedThrough) ?? remaining[0];

  return { isPassed, unlockedThrough, lessons, next };
}
