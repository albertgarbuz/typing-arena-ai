"use client";

import Link from "next/link";
import { useMemo, useSyncExternalStore } from "react";
import {
  getProgressRaw,
  subscribeStorage,
  type ProgressData,
} from "@/lib/typing/storage";
import { getUserRaw, getUserServerSnapshot, subscribeUser } from "@/lib/auth/user";
import { getCourseLevels } from "@/lib/typing/texts";
import type { Layout, LessonExercise } from "@/lib/typing/types";
import { IconCheck, IconArrowRight } from "@/components/icons";

interface CourseMapProps {
  layout: Layout;
  onLayoutChange: (l: Layout) => void;
}

export function CourseMap({ layout, onLayoutChange }: CourseMapProps) {
  const progressRaw = useSyncExternalStore(
    subscribeStorage,
    getProgressRaw,
    () => "{}"
  );

  const progress = useMemo(() => {
    try {
      const data: ProgressData = JSON.parse(progressRaw);
      return data.completedExercises || {};
    } catch {
      return {};
    }
  }, [progressRaw]);

  const userRaw = useSyncExternalStore(subscribeUser, getUserRaw, getUserServerSnapshot);
  const credited = useMemo(() => {
    try {
      const ids = JSON.parse(userRaw).creditedLessons;
      return new Set<string>(Array.isArray(ids) ? ids : []);
    } catch { return new Set<string>(); }
  }, [userRaw]);
  const openRuLevels = useMemo(() => {
    try {const ids=JSON.parse(userRaw).openRuLevels;return new Set<number>(Array.isArray(ids)?ids:[]);}
    catch {return new Set<number>();}
  },[userRaw]);
  const levels = getCourseLevels(layout);
  const isPassed = (ex: LessonExercise) =>
    credited.has(ex.id) || (progress[ex.id]?.accuracy ?? 0) >= ex.minAccuracy;
  const isLevelUnlocked = (index: number) =>
    index === 0 || (layout==="ru" && openRuLevels.has(levels[index].level)) || levels[index-1].exercises.every(isPassed);
  const lessons = levels.flatMap(level => level.exercises.map(exercise => ({level: level.level, exercise})));
  const passed = ({exercise}: typeof lessons[number]) => isPassed(exercise);
  const totalLessons = lessons.length;
  const completedTotal = lessons.filter(passed).length;
  const next = lessons.find(item => !passed(item));
  const index = next ? lessons.indexOf(next) : totalLessons;
  const within = index % 10;
  const session = Math.floor(index / 10) * 3 + (within < 3 ? 1 : within < 6 ? 2 : 3);
  const last = Math.floor(index / 10) * 10 + (within < 3 ? 3 : within < 6 ? 6 : 10);
  const percentTotal = Math.min(100, Math.round((completedTotal / totalLessons) * 100));

  return (
    <div className="course-map">
      {/* Layout selector */}
      <div className="course-map__header">
        <div>
          <h2 className="course-map__title">Курс слепой печати: 100 уроков</h2>
          <p className="course-map__subtitle">
            30 занятий по полчаса. Пять минут разомни пальцы, двадцать посвяти новым урокам, а последние пять — словам, в которых ошибаешься.
          </p>
        </div>

        <div className="layout-tabs" role="tablist" aria-label="Выбор раскладки курса">
          <button
            type="button"
            role="tab"
            aria-selected={layout === "ru"}
            onClick={() => onLayoutChange("ru")}
            className={`layout-tabs__tab ${layout === "ru" ? "layout-tabs__tab--active" : ""}`}
          >
            <span className="layout-tabs__code">RU</span>
            <span className="layout-tabs__name">ЙЦУКЕН</span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={layout === "en"}
            onClick={() => onLayoutChange("en")}
            className={`layout-tabs__tab ${layout === "en" ? "layout-tabs__tab--active" : ""}`}
          >
            <span className="layout-tabs__code">EN</span>
            <span className="layout-tabs__name">QWERTY</span>
          </button>
        </div>
      </div>

      {/* 100 Lessons Global Progress Banner */}
      <div className="course-progress-banner">
        <div className="course-progress-banner__info">
          <div className="streak-badge-pill">
            {next ? `Занятие ${session} из 30 · уроки ${index + 1}–${last}` : "Курс пройден"}
          </div>
          <h3 className="course-progress-title">
            Прогресс курса: {completedTotal} из {totalLessons} уроков ({percentTotal}%)
          </h3>
          <p className="course-progress-desc">
            {next ? <Link className="text-link" href={`/learn/${layout}/${next.level}?ex=${next.exercise.id}`}>Продолжить · {next.exercise.title} →</Link>
              : <Link className="text-link" href="/test">Измерить итоговую скорость →</Link>}
          </p>
        </div>
        <div className="course-progress-bar-wrap">
          <div className="course-progress-bar-fill" style={{ width: `${percentTotal}%` }} />
        </div>
      </div>

      {/* Levels list */}
      <div className="course-levels-grid">
        {levels.map((lvl, index) => {
          const unlocked = isLevelUnlocked(index);
          const completedCount = lvl.exercises.filter(isPassed).length;
          const isLevelComplete = completedCount === lvl.exercises.length;

          return (
            <div
              key={lvl.level}
              className={`level-card ${!unlocked ? "level-card--locked" : ""} ${
                isLevelComplete ? "level-card--completed" : ""
              }`}
            >
              <div className="level-card__header">
                <span className="level-card__num">Уровень {lvl.level}</span>
                {isLevelComplete ? (
                  <span className="level-badge level-badge--complete">
                    <IconCheck size={12} /> Освоен (10/10)
                  </span>
                ) : unlocked ? (
                  <span className="level-badge level-badge--active">
                    {completedCount} / {lvl.exercises.length} уроков
                  </span>
                ) : (
                  <span className="level-badge level-badge--locked">
                    Закрыт
                  </span>
                )}
              </div>

              <h3 className="level-card__title">{lvl.title}</h3>
              <p className="level-card__desc">{lvl.description}</p>
              <p className="level-card__focus">
                <strong>Фокус:</strong> {lvl.fingerFocus}
              </p>

              <div className="level-card__exercises">
                {lvl.exercises.map((ex) => {
                  const exProgress = progress[ex.id];
                  const passed = isPassed(ex);

                  return (
                    <div key={ex.id} className="exercise-row">
                      <div className="exercise-row__info">
                        <span className="exercise-row__title">
                          {ex.title}
                        </span>
                        {passed ? (
                          <span className="exercise-row__stat">
                            {exProgress && exProgress.accuracy >= ex.minAccuracy ? `✓ ${exProgress.accuracy}% · ${exProgress.cpm} CPM` : "✓ Перенесён из прежнего профиля"}
                          </span>
                        ) : null}
                      </div>

                      {unlocked ? (
                        <Link
                          href={`/learn/${layout}/${lvl.level}?ex=${ex.id}`}
                          className="exercise-row__btn"
                        >
                          <span>{passed ? "Повторить" : "Начать"}</span>
                          <IconArrowRight size={14} />
                        </Link>
                      ) : (
                        <span className="exercise-row__locked-text">Закрыто</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
