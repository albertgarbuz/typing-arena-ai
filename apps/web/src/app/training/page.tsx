"use client";

import { useState } from "react";
import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { TypingArena } from "@/components/typing/typing-arena";
import { getRandomTestText } from "@/lib/typing/texts";
import type { Layout } from "@/lib/typing/types";

const WORD_BANK_RU =
  "время жизнь человек рука дело глаз день рука слово работа место лицо голос дом город земля вечер ночь конец сила путь случай душа тело вид воздух час свет порядок закон минута комната плечо сердце разговор радость вера";
const WORD_BANK_EN =
  "time year people way day man world life hand part child eye woman place work week company system number group problem fact idea water money month story book study job word business issue side kind head house service";
const SYMBOLS_RU =
  "12 + 34 = 46; цена 150 руб., номер №48 (группа 2). «Точность — залог успеха!» 2026-й год: 100% результат.";
const SYMBOLS_EN =
  "12 + 34 = 46; price $150, item #48 (group 2). 'Speed follows accuracy!' In 2026: 100% confirmed result.";

export default function TrainingPage() {
  const [layout, setLayout] = useState<Layout>("ru");
  const [practiceType, setPracticeType] = useState<"text" | "words" | "symbols">("words");

  const getText = (l: Layout, type: "text" | "words" | "symbols") => {
    if (type === "words") {
      return l === "ru" ? WORD_BANK_RU : WORD_BANK_EN;
    }
    if (type === "symbols") {
      return l === "ru" ? SYMBOLS_RU : SYMBOLS_EN;
    }
    return getRandomTestText(l);
  };

  const [currentText, setCurrentText] = useState(() => getText("ru", "words"));

  const updateSettings = (newLayout: Layout, newType: "text" | "words" | "symbols") => {
    setLayout(newLayout);
    setPracticeType(newType);
    setCurrentText(getText(newLayout, newType));
  };

  return (
    <>
      <SiteHeader />
      <main id="main-content" className="test-page-main">
        <div className="layout-container test-page-shell">
          <div className="test-page-header">
            <div>
              <p className="eyebrow">СВОБОДНАЯ ТРЕНИРОВКА</p>
              <h1 className="test-page-title">Практика набора текста</h1>
              <p className="test-page-subtitle">
                Тренируйтесь без жесткого таймера в удобном ритме. Выбирайте слова, связный текст или цифры и знаки.
              </p>
            </div>

            <div className="layout-tabs" role="tablist" aria-label="Выбор языка">
              <button
                type="button"
                role="tab"
                aria-selected={layout === "ru"}
                onClick={() => updateSettings("ru", practiceType)}
                className={`layout-tabs__tab ${layout === "ru" ? "layout-tabs__tab--active" : ""}`}
              >
                <span className="layout-tabs__code">RU</span>
                <span className="layout-tabs__name">Русский</span>
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={layout === "en"}
                onClick={() => updateSettings("en", practiceType)}
                className={`layout-tabs__tab ${layout === "en" ? "layout-tabs__tab--active" : ""}`}
              >
                <span className="layout-tabs__code">EN</span>
                <span className="layout-tabs__name">English</span>
              </button>
            </div>
          </div>

          <div className="training-modes-bar">
            <span className="toolbar-label">Тип упражнения:</span>
            <button
              type="button"
              className={`mode-pill ${practiceType === "words" ? "mode-pill--active" : ""}`}
              onClick={() => updateSettings(layout, "words")}
            >
              Частые слова
            </button>
            <button
              type="button"
              className={`mode-pill ${practiceType === "text" ? "mode-pill--active" : ""}`}
              onClick={() => updateSettings(layout, "text")}
            >
              Связный текст
            </button>
            <button
              type="button"
              className={`mode-pill ${practiceType === "symbols" ? "mode-pill--active" : ""}`}
              onClick={() => updateSettings(layout, "symbols")}
            >
              Цифры и знаки
            </button>
          </div>

          <TypingArena
            key={`${layout}-${practiceType}-${currentText.slice(0, 10)}`}
            initialText={currentText}
            layout={layout}
            mode="training"
            initialDuration={60}
            onTextRequest={() => getText(layout, practiceType)}
          />

          <div className="test-page-links">
            <Link href="/test" className="text-link">
              ← Проверить скорость на время
            </Link>
            <Link href="/learn" className="text-link">
              Курс обучения слепой печати →
            </Link>
          </div>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
