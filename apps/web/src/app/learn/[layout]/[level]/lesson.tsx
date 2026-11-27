"use client";

import { use, useMemo, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { TypingArena } from "@/components/typing/typing-arena";
import { getProgressRaw, parseProgress, saveExerciseProgress, subscribeStorage } from "@/lib/typing/storage";
import { addXpAndCoins, awardMedal, getUserRaw, getUserServerSnapshot, subscribeUser, unlockAchievement } from "@/lib/auth/user";
import { getCourseProgress } from "@/lib/typing/course-progress";
import { getCourseLevels } from "@/lib/typing/texts";
import type { Layout, TypingResult } from "@/lib/typing/types";
import { IconArrowRight } from "@/components/icons";

interface LessonPageProps {
  params: Promise<{
    layout: string;
    level: string;
  }>;
}

export default function LessonPage({ params }: LessonPageProps) {
  const resolvedParams = use(params);
  const layout = (resolvedParams.layout === "en" ? "en" : "ru") as Layout;
  const levelNum = parseInt(resolvedParams.level, 10) || 1;

  const searchParams = useSearchParams();
  const requestedExId = searchParams.get("ex");

  const levels = getCourseLevels(layout);
  const currentLevel = levels.find((l) => l.level === levelNum) || levels[0];

  const [selectedExerciseId, setSelectedExerciseId] = useState<string | null>(null);
  const progressRaw = useSyncExternalStore(subscribeStorage, getProgressRaw, () => "{}");
  const userRaw = useSyncExternalStore(subscribeUser, getUserRaw, getUserServerSnapshot);
  const progress = useMemo(() => parseProgress(progressRaw), [progressRaw]);
  const profile = useMemo(() => {
    try { return JSON.parse(userRaw) ?? {}; } catch { return {}; }
  }, [userRaw]);
  const { isPassed } = getCourseProgress(layout, levels, progress, profile);
  const selectedIndex = currentLevel.exercises.findIndex(ex => ex.id === (selectedExerciseId ?? requestedExId));
  const nextIndex = currentLevel.exercises.findIndex(ex => !isPassed(ex));
  const activeExerciseIndex = selectedIndex >= 0 ? selectedIndex : Math.max(0, nextIndex);
  const activeExercise = currentLevel.exercises[activeExerciseIndex];

  const handleLessonComplete = (result: TypingResult) => {
    setSelectedExerciseId(activeExercise.id);
    saveExerciseProgress(activeExercise.id, result.accuracy, result.cpm);
    const minAcc = activeExercise.minAccuracy || 95;
    if (result.accuracy >= minAcc) {
      addXpAndCoins(40, 20);
      if (result.accuracy === 100) {
        awardMedal("gold");
        unlockAchievement("clean_sheet");
      } else if (result.accuracy >= 98) {
        awardMedal("silver");
      } else {
        awardMedal("bronze");
      }
      unlockAchievement("first_step");
    }
  };

  const hasNextExercise = activeExerciseIndex < currentLevel.exercises.length - 1;
  const hasNextLevel = levelNum < levels.length;

  return (
    <>
      <SiteHeader />
      <main id="main-content" className="lesson-page-main">
        <div className="layout-container lesson-page-shell">
          <div className="lesson-nav-bar">
            <Link href="/learn" className="text-link">
              ← Назад к карте курса
            </Link>
            <span className="lesson-nav-bar__crumb">
              {layout.toUpperCase()} · Уровень {levelNum} · Упражнение{" "}
              {activeExerciseIndex + 1} из {currentLevel.exercises.length}
            </span>
          </div>

          <div className="lesson-card-header">
            <div className="lesson-card-header__info">
              <span className="eyebrow">
                УРОВЕНЬ {levelNum}: {currentLevel.title.toUpperCase()}
              </span>
              <h1 className="lesson-title">{activeExercise.title}</h1>
              <p className="lesson-desc">{activeExercise.description}</p>
              <div className="lesson-reqs">
                <span className="req-pill">
                  Минимальная точность: <strong>{activeExercise.minAccuracy}%</strong>
                </span>
                {activeExercise.targetCpm ? (
                  <span className="req-pill">
                    Целевой темп: <strong>{activeExercise.targetCpm} CPM</strong>
                  </span>
                ) : null}
                <span className="req-pill req-pill--focus">
                  Фокус: <strong>{currentLevel.fingerFocus}</strong>
                </span>
              </div>
            </div>

            {/* Exercise pills switcher */}
            <div className="exercise-switcher">
              {currentLevel.exercises.map((ex, idx) => (
                <button
                  key={ex.id}
                  type="button"
                  onClick={() => setSelectedExerciseId(ex.id)}
                  className={`exercise-pill ${
                    activeExerciseIndex === idx ? "exercise-pill--active" : ""
                  }`}
                >
                  Упражнение {idx + 1}
                </button>
              ))}
            </div>
          </div>

          <TypingArena
            key={`${layout}-${levelNum}-${activeExercise.id}`}
            initialText={activeExercise.text}
            layout={layout}
            mode="lesson"
            lessonId={activeExercise.id}
            onLessonComplete={handleLessonComplete}
            onTextRequest={() => activeExercise.text}
          />

          <div className="lesson-page-footer-nav">
            {hasNextExercise ? (
              <button
                type="button"
                onClick={() => setSelectedExerciseId(currentLevel.exercises[activeExerciseIndex + 1].id)}
                className="button button--primary"
              >
                <span>Следующее упражнение</span>
                <IconArrowRight size={16} />
              </button>
            ) : hasNextLevel ? (
              <Link
                href={`/learn/${layout}/${levelNum + 1}`}
                className="button button--primary"
              >
                <span>Перейти к Уровню {levelNum + 1}</span>
                <IconArrowRight size={16} />
              </Link>
            ) : (
              <Link href="/learn" className="button button--primary">
                <span>Поздравляем! Курс завершён →</span>
              </Link>
            )}
          </div>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
