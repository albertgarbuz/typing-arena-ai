"use client";

import Link from "next/link";
import { analyzeMistakes } from "@/lib/typing/engine";
import type { TypingResult } from "@/lib/typing/types";
import { IconRepeat, IconArrowRight, IconCheck, IconTarget } from "@/components/icons";

interface ResultCardProps {
  result: TypingResult;
  onRestart: () => void;
  onNext?: () => void;
  nextLabel?: string;
}

export function ResultCard({
  result,
  onRestart,
  onNext,
  nextLabel = "Следующий текст",
}: ResultCardProps) {
  const { problemKeys, advice } = analyzeMistakes(result.mistakesByKey);

  return (
    <div className="result-card" role="region" aria-label="Результаты попытки">
      <div className="result-card__header">
        <span className="result-card__badge">
          <IconCheck size={14} /> Результат зафиксирован
        </span>
        <span className="result-card__date">
          {result.layout === "ru" ? "Русский (ЙЦУКЕН)" : "English (QWERTY)"} ·{" "}
          {result.durationSec} сек
        </span>
      </div>

      <div className="result-card__metrics">
        <div className="result-metric result-metric--primary">
          <span className="result-metric__value">{result.cpm}</span>
          <span className="result-metric__label">CPM (знаков/мин)</span>
        </div>

        <div className="result-metric">
          <span className="result-metric__value">{result.wpm}</span>
          <span className="result-metric__label">WPM (слов/мин)</span>
        </div>

        <div className="result-metric">
          <span className="result-metric__value">{result.accuracy}%</span>
          <span className="result-metric__label">Точность</span>
        </div>

        <div className="result-metric">
          <span className="result-metric__value">{result.e}</span>
          <span className="result-metric__label">Ошибок</span>
        </div>
      </div>

      <div className="result-card__details">
        <div className="result-detail">
          <span className="result-detail__label">Правильных символов:</span>
          <strong className="result-detail__val">{result.c}</strong>
        </div>
        <div className="result-detail">
          <span className="result-detail__label">Всего нажатий:</span>
          <strong className="result-detail__val">{result.a}</strong>
        </div>
        <div className="result-detail">
          <span className="result-detail__label">Исправлений Backspace:</span>
          <strong className="result-detail__val">{result.backspaces}</strong>
        </div>
      </div>

      {problemKeys.length > 0 ? (
        <div className="result-card__problem-keys">
          <span className="result-card__problem-title">Клавиши с ошибками:</span>
          <div className="result-card__problem-list">
            {problemKeys.map((p) => (
              <span key={p.key} className="problem-key-pill">
                <strong>{p.key}</strong>
                <span className="problem-key-count">({p.count})</span>
              </span>
            ))}
          </div>
        </div>
      ) : null}

      <div className="result-card__coach">
        <div className="coach-tag">
          <IconTarget size={14} /> AI-тренер
        </div>
        <p className="coach-advice">{advice}</p>
      </div>

      <div className="result-card__actions">
        <button
          type="button"
          onClick={onRestart}
          className="button button--secondary"
        >
          <IconRepeat size={16} />
          <span>Повторить</span>
        </button>

        {onNext ? (
          <button
            type="button"
            onClick={onNext}
            className="button button--primary"
          >
            <span>{nextLabel}</span>
            <IconArrowRight size={16} />
          </button>
        ) : null}

        <Link href="/stats" className="button button--secondary">
          <span>Вся статистика</span>
        </Link>
      </div>
    </div>
  );
}
