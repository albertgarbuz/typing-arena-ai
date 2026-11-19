import { describe, expect, it } from "vitest";
import { calculateTypingMetrics } from "./engine";

describe("calculateTypingMetrics", () => {
  it("matches methodology example: reference 'кот' with one corrected error", () => {
    // Reference 'кот', user typed 'к', 'а', backspace, 'о', 'т'
    // C = 3, A = 4, H = 3, E = 1, T = 15s
    const metrics = calculateTypingMetrics({
      targetText: "кот",
      finalBuffer: "кот",
      totalAttempts: 4,
      hits: 3,
      backspaces: 1,
      durationSec: 15,
    });

    expect(metrics.c).toBe(3);
    expect(metrics.a).toBe(4);
    expect(metrics.h).toBe(3);
    expect(metrics.e).toBe(1);
    expect(metrics.backspaces).toBe(1);
    expect(metrics.accuracy).toBe(75);
    expect(metrics.cpm).toBe(12); // 3 * 60 / 15 = 12
    expect(metrics.wpm).toBe(2.4); // 12 / 5 = 2.4
  });

  it("handles empty input gracefully", () => {
    const metrics = calculateTypingMetrics({
      targetText: "привет",
      finalBuffer: "",
      totalAttempts: 0,
      hits: 0,
      backspaces: 0,
      durationSec: 60,
    });

    expect(metrics.c).toBe(0);
    expect(metrics.a).toBe(0);
    expect(metrics.accuracy).toBe(0);
    expect(metrics.cpm).toBe(0);
    expect(metrics.wpm).toBe(0);
  });

  it("handles 100% accuracy calculation correctly", () => {
    const metrics = calculateTypingMetrics({
      targetText: "быстрый текст",
      finalBuffer: "быстрый текст",
      totalAttempts: 13,
      hits: 13,
      backspaces: 0,
      durationSec: 30,
    });

    expect(metrics.c).toBe(13);
    expect(metrics.accuracy).toBe(100);
    expect(metrics.cpm).toBe(26); // 13 * 60 / 30 = 26
    expect(metrics.wpm).toBe(5.2);
  });
});
