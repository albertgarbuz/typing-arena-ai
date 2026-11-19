"use client";

import { useMemo, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import {
  getResultsRaw,
  subscribeStorage,
} from "@/lib/typing/storage";
import type { Layout, TypingResult } from "@/lib/typing/types";
import { IconArrowRight } from "@/components/icons";

export default function StatsPage() {
  const [layout, setLayout] = useState<Layout>("ru");

  const resultsRaw = useSyncExternalStore(
    subscribeStorage,
    getResultsRaw,
    () => "[]"
  );

  const results: TypingResult[] = useMemo(() => {
    try {
      const list: TypingResult[] = JSON.parse(resultsRaw);
      return list.filter((r) => r.layout === layout);
    } catch {
      return [];
    }
  }, [resultsRaw, layout]);

  const personalBest: TypingResult | null = useMemo(() => {
    if (results.length === 0) return null;
    return results.reduce((best, cur) => (cur.cpm > best.cpm ? cur : best), results[0]);
  }, [results]);

  const totalTests = results.length;
  const avgCpm =
    totalTests > 0
      ? Math.round(results.reduce((sum, r) => sum + r.cpm, 0) / totalTests)
      : 0;
  const avgAccuracy =
    totalTests > 0
      ? Math.round((results.reduce((sum, r) => sum + r.accuracy, 0) / totalTests) * 10) / 10
      : 0;

  return (
    <>
      <SiteHeader />
      <main id="main-content" className="stats-page-main">
        <div className="layout-container stats-page-shell">
          <div className="stats-page-header">
            <div>
              <p className="eyebrow">ЛИЧНЫЙ КАБИНЕТ И СТАТИСТИКА</p>
              <h1 className="stats-page-title">Статистика тренировок</h1>
              <p className="stats-page-subtitle">
                История ваших попыток, личные рекорды и динамика скорости отдельно для
                русской и английской раскладок.
              </p>
            </div>

            <div className="layout-tabs" role="tablist" aria-label="Выбор раскладки">
              <button
                type="button"
                role="tab"
                aria-selected={layout === "ru"}
                onClick={() => setLayout("ru")}
                className={`layout-tabs__tab ${layout === "ru" ? "layout-tabs__tab--active" : ""}`}
              >
                <span className="layout-tabs__code">RU</span>
                <span className="layout-tabs__name">ЙЦУКЕН</span>
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={layout === "en"}
                onClick={() => setLayout("en")}
                className={`layout-tabs__tab ${layout === "en" ? "layout-tabs__tab--active" : ""}`}
              >
                <span className="layout-tabs__code">EN</span>
                <span className="layout-tabs__name">QWERTY</span>
              </button>
            </div>
          </div>

          {/* Key Stat Summary Cards */}
          <div className="stats-cards-grid">
            <div className="stat-card stat-card--highlight">
              <span className="stat-card__label">Личный рекорд (CPM)</span>
              <span className="stat-card__value">
                {personalBest ? personalBest.cpm : "—"}
              </span>
              <span className="stat-card__sub">
                {personalBest
                  ? `${personalBest.wpm} WPM · ${personalBest.accuracy}% точность`
                  : "Пока нет завершённых тестов"}
              </span>
            </div>

            <div className="stat-card">
              <span className="stat-card__label">Средняя скорость</span>
              <span className="stat-card__value">{totalTests > 0 ? avgCpm : "—"}</span>
              <span className="stat-card__sub">CPM за все попытки</span>
            </div>

            <div className="stat-card">
              <span className="stat-card__label">Средняя точность</span>
              <span className="stat-card__value">
                {totalTests > 0 ? `${avgAccuracy}%` : "—"}
              </span>
              <span className="stat-card__sub">Доля безошибочных нажатий</span>
            </div>

            <div className="stat-card">
              <span className="stat-card__label">Всего попыток</span>
              <span className="stat-card__value">{totalTests}</span>
              <span className="stat-card__sub">
                {layout === "ru" ? "в раскладке ЙЦУКЕН" : "в раскладке QWERTY"}
              </span>
            </div>
          </div>

          {/* History table or empty state */}
          <div className="stats-history-section">
            <h2 className="stats-history-title">История попыток</h2>

            {totalTests > 0 ? (
              <div className="table-scroll">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th scope="col">Дата и время</th>
                      <th scope="col">Режим</th>
                      <th scope="col">Длительность</th>
                      <th scope="col">CPM</th>
                      <th scope="col">WPM</th>
                      <th scope="col">Точность</th>
                      <th scope="col">Ошибок</th>
                    </tr>
                  </thead>
                  <tbody>
                    {results.map((r) => {
                      const d = new Date(r.timestamp);
                      const dateStr = d.toLocaleDateString("ru-RU", {
                        day: "numeric",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      });

                      const modeLabel =
                        r.mode === "test"
                          ? "Тест скорости"
                          : r.mode === "lesson"
                          ? "Урок"
                          : "Практика";

                      return (
                        <tr key={r.id}>
                          <td>{dateStr}</td>
                          <td>
                            <span className="history-mode-badge">{modeLabel}</span>
                          </td>
                          <td>{r.durationSec} с</td>
                          <td>
                            <strong>{r.cpm}</strong>
                          </td>
                          <td>{r.wpm}</td>
                          <td>
                            <span
                              className={`history-acc ${
                                r.accuracy >= 95
                                  ? "history-acc--good"
                                  : r.accuracy >= 90
                                  ? "history-acc--mid"
                                  : "history-acc--low"
                              }`}
                            >
                              {r.accuracy}%
                            </span>
                          </td>
                          <td>{r.e}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="stats-empty-state">
                <p className="stats-empty-title">Пока нет сохранённых результатов</p>
                <p className="stats-empty-desc">
                  Пройдите свой первый тест скорости или начните обучение, и результаты
                  автоматически появятся здесь.
                </p>
                <div className="button-row">
                  <Link href="/test" className="button button--primary">
                    <span>Пройти тест скорости</span>
                    <IconArrowRight size={16} />
                  </Link>
                  <Link href="/learn" className="button button--secondary">
                    <span>Перейти к обучению</span>
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
