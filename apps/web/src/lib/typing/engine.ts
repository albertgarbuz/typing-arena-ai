import type { TypingMetrics } from "./types";

/**
 * Calculates typing metrics strictly according to the published methodology:
 *
 * C: Correct characters in the final buffer matching the target string on that position.
 * A: Total character input attempts (excluding Backspace and modifier keys).
 * H: Hits (attempts that matched the target character at that exact position when typed).
 * E: Errors (A - H).
 * CPM: (C * 60) / T
 * WPM: CPM / 5
 * Accuracy: (H / A) * 100%
 */
export function calculateTypingMetrics(params: {
  targetText: string;
  finalBuffer: string;
  totalAttempts: number;
  hits: number;
  backspaces: number;
  durationSec: number;
}): TypingMetrics {
  const { targetText, finalBuffer, totalAttempts, hits, backspaces, durationSec } = params;

  // C: Count matching characters between final buffer and target at the same index
  let c = 0;
  const len = Math.min(finalBuffer.length, targetText.length);
  for (let i = 0; i < len; i++) {
    if (finalBuffer[i] === targetText[i]) {
      c++;
    }
  }

  const a = Math.max(0, totalAttempts);
  const h = Math.max(0, Math.min(hits, a));
  const e = a - h;

  const safeDuration = durationSec > 0 ? durationSec : 1;
  const cpm = Math.round((c * 60) / safeDuration);
  const wpm = Math.round((cpm / 5) * 10) / 10;
  const accuracy = a > 0 ? Math.round((h / a) * 1000) / 10 : 0;

  return {
    durationSec,
    c,
    a,
    h,
    e,
    backspaces,
    cpm,
    wpm,
    accuracy,
  };
}

/**
 * Evaluates typing error statistics and provides actionable advice for the user.
 */
export function analyzeMistakes(mistakesByKey: Record<string, number>): {
  problemKeys: { key: string; count: number }[];
  advice: string;
} {
  const entries = Object.entries(mistakesByKey)
    .filter(([, count]) => count > 0)
    .sort((a, b) => b[1] - a[1]);

  const problemKeys = entries.slice(0, 3).map(([key, count]) => ({
    key: key === " " ? "пробел" : key,
    count,
  }));

  let advice = "Отличная концентрация! Продолжайте удерживать равномерный темп.";

  if (problemKeys.length > 0) {
    const keysStr = problemKeys.map((p) => `«${p.key}»`).join(", ");
    advice = `Обратите внимание на клавиши ${keysStr}. Снизьте темп на этих буквах и следите за возвратом пальцев в исходную позицию.`;
  }

  return { problemKeys, advice };
}
