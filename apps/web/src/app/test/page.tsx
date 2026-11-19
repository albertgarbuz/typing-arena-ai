"use client";

import { useState } from "react";
import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { TypingArena } from "@/components/typing/typing-arena";
import { getRandomTestText } from "@/lib/typing/texts";
import type { Layout } from "@/lib/typing/types";

export default function SpeedTestPage() {
  const [layout, setLayout] = useState<Layout>("ru");
  const [currentText, setCurrentText] = useState(() => getRandomTestText("ru"));

  const handleLayoutChange = (newLayout: Layout) => {
    setLayout(newLayout);
    setCurrentText(getRandomTestText(newLayout));
  };

  return (
    <>
      <SiteHeader />
      <main id="main-content" className="test-page-main">
        <div className="layout-container test-page-shell">
          <div className="test-page-header">
            <div>
              <p className="eyebrow">ПРОВЕРКА СКОРОСТИ</p>
              <h1 className="test-page-title">Тест скорости слепой печати</h1>
              <p className="test-page-subtitle">
                Выберите язык, длительность теста и начните печатать. Тест стартует
                автоматически с первого нажатия клавиши.
              </p>
            </div>

            <div className="layout-tabs" role="tablist" aria-label="Выбор языка">
              <button
                type="button"
                role="tab"
                aria-selected={layout === "ru"}
                onClick={() => handleLayoutChange("ru")}
                className={`layout-tabs__tab ${layout === "ru" ? "layout-tabs__tab--active" : ""}`}
              >
                <span className="layout-tabs__code">RU</span>
                <span className="layout-tabs__name">Русский</span>
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={layout === "en"}
                onClick={() => handleLayoutChange("en")}
                className={`layout-tabs__tab ${layout === "en" ? "layout-tabs__tab--active" : ""}`}
              >
                <span className="layout-tabs__code">EN</span>
                <span className="layout-tabs__name">English</span>
              </button>
            </div>
          </div>

          <TypingArena
            key={`${layout}-${currentText.slice(0, 10)}`}
            initialText={currentText}
            layout={layout}
            mode="test"
            initialDuration={60}
            onTextRequest={() => getRandomTestText(layout)}
          />

          <div className="test-page-links">
            <Link href="/learn" className="text-link">
              ← Перейти к пошаговому обучению
            </Link>
            <Link href="/methodology" className="text-link">
              Методика расчёта CPM и точности →
            </Link>
          </div>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
