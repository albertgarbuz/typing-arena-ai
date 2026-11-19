"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { calculateTypingMetrics } from "@/lib/typing/engine";
import { saveResult } from "@/lib/typing/storage";
import { addXpAndCoins, awardMedal, unlockAchievement } from "@/lib/auth/user";
import type { Layout, TestDuration, TypingResult } from "@/lib/typing/types";
import { VirtualKeyboard } from "./virtual-keyboard";
import { ResultCard } from "./result-card";
import { IconClock, IconKeyboard, IconRepeat } from "@/components/icons";

interface TypingArenaProps {
  initialText: string;
  layout: Layout;
  mode?: "test" | "training" | "lesson";
  initialDuration?: TestDuration;
  onTextRequest?: (layout: Layout) => string;
  onLessonComplete?: (result: TypingResult) => void;
  lessonId?: string;
}

export function TypingArena({
  initialText,
  layout,
  mode = "test",
  initialDuration = 60,
  onTextRequest,
  onLessonComplete,
  lessonId,
}: TypingArenaProps) {
  const [targetText, setTargetText] = useState(initialText);
  const [duration, setDuration] = useState<TestDuration>(initialDuration);
  const [timeLeft, setTimeLeft] = useState<number>(initialDuration);
  const [showKeyboard, setShowKeyboard] = useState(true);

  // Input states
  const [inputBuffer, setInputBuffer] = useState("");
  const [isStarted, setIsStarted] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [isFocused, setIsFocused] = useState(true);

  // Metrics tracking
  const totalAttemptsRef = useRef(0);
  const hitsRef = useRef(0);
  const backspacesRef = useRef(0);
  const mistakesByKeyRef = useRef<Record<string, number>>({});
  const lastPressedCodeRef = useRef<string | undefined>(undefined);
  const [pressedCode, setPressedCode] = useState<string | undefined>(undefined);
  const [liveCpm, setLiveCpm] = useState(0);

  const [result, setResult] = useState<TypingResult | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number | null>(null);

  const inputId = useId();

  // Reset session
  const resetSession = useCallback(
    (newText?: string) => {
      if (timerRef.current) clearInterval(timerRef.current);
      setInputBuffer("");
      setIsStarted(false);
      setIsFinished(false);
      setResult(null);
      setTimeLeft(duration);
      setLiveCpm(0);
      totalAttemptsRef.current = 0;
      hitsRef.current = 0;
      backspacesRef.current = 0;
      mistakesByKeyRef.current = {};
      startTimeRef.current = null;
      lastPressedCodeRef.current = undefined;
      setPressedCode(undefined);

      if (newText) {
        setTargetText(newText);
      } else if (onTextRequest) {
        setTargetText(onTextRequest(layout));
      }

      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    },
    [duration, layout, onTextRequest]
  );

  // Finish session calculation
  const finishSession = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    setIsFinished(true);

    const elapsedSeconds =
      mode === "test"
        ? duration - timeLeft
        : startTimeRef.current
        ? Math.max(1, Math.round((Date.now() - startTimeRef.current) / 1000))
        : 1;

    const actualDuration = elapsedSeconds > 0 ? elapsedSeconds : duration;

    const metrics = calculateTypingMetrics({
      targetText,
      finalBuffer: inputBuffer,
      totalAttempts: totalAttemptsRef.current,
      hits: hitsRef.current,
      backspaces: backspacesRef.current,
      durationSec: actualDuration,
    });

    const fullResult: TypingResult = {
      ...metrics,
      id: `result-${Date.now()}`,
      layout,
      timestamp: new Date().toISOString(),
      mode,
      lessonId,
      mistakesByKey: { ...mistakesByKeyRef.current },
    };

    setResult(fullResult);
    saveResult(fullResult);

    // Gamification rewards and achievements
    addXpAndCoins(25, 10);
    unlockAchievement("first_step");
    if (fullResult.accuracy === 100) {
      awardMedal("gold");
      unlockAchievement("clean_sheet");
    }
    if (fullResult.cpm >= 200) unlockAchievement("speed_200");
    if (fullResult.cpm >= 300) unlockAchievement("speed_300");
    if (fullResult.cpm >= 400) unlockAchievement("speed_400");

    if (onLessonComplete) {
      onLessonComplete(fullResult);
    }
  }, [
    duration,
    inputBuffer,
    layout,
    lessonId,
    mode,
    onLessonComplete,
    targetText,
    timeLeft,
  ]);

  // Timer tick effect for test mode
  useEffect(() => {
    if (!isStarted || isFinished || mode !== "test") return;

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          finishSession();
          return 0;
        }
        const nextTime = prev - 1;
        const elapsed = duration - nextTime;
        if (elapsed > 0) {
          setLiveCpm(Math.round((hitsRef.current * 60) / elapsed));
        }
        return nextTime;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isStarted, isFinished, mode, finishSession, duration]);

  // Handle typing input
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (isFinished) return;

    lastPressedCodeRef.current = e.code;
    setPressedCode(e.code);
    setTimeout(() => setPressedCode(undefined), 150);

    // Tab + Enter or Escape resets session
    if (e.key === "Escape") {
      resetSession();
      return;
    }

    if (e.key === "Backspace") {
      e.preventDefault();
      if (inputBuffer.length > 0) {
        backspacesRef.current += 1;
        setInputBuffer((prev) => prev.slice(0, -1));
      }
      return;
    }

    // Ignore modifier keys and functional keys
    if (
      e.ctrlKey ||
      e.altKey ||
      e.metaKey ||
      e.key === "Shift" ||
      e.key === "CapsLock" ||
      e.key === "Tab" ||
      e.key === "Enter" ||
      e.key.length > 1
    ) {
      return;
    }

    e.preventDefault();

    // Start timer on first keystroke
    if (!isStarted) {
      setIsStarted(true);
      startTimeRef.current = Date.now();
    }

    const nextChar = e.key;
    const currentIndex = inputBuffer.length;
    const expectedChar = targetText[currentIndex];

    totalAttemptsRef.current += 1;

    let nextHits = hitsRef.current;
    if (nextChar === expectedChar) {
      nextHits += 1;
      hitsRef.current = nextHits;
    } else {
      mistakesByKeyRef.current[expectedChar] =
        (mistakesByKeyRef.current[expectedChar] || 0) + 1;
    }

    if (startTimeRef.current) {
      const elapsed = Math.max(1, (Date.now() - startTimeRef.current) / 1000);
      setLiveCpm(Math.round((nextHits * 60) / elapsed));
    }

    const nextBuffer = inputBuffer + nextChar;
    setInputBuffer(nextBuffer);

    // If reached end of target text
    if (nextBuffer.length >= targetText.length) {
      finishSession();
    }
  };

  const currentChar =
    inputBuffer.length < targetText.length
      ? targetText[inputBuffer.length]
      : undefined;

  return (
    <div className="typing-arena">
      {/* Top Controls Bar */}
      <div className="typing-arena__toolbar">
        {mode === "test" ? (
          <div className="typing-arena__time-selector">
            <span className="toolbar-label">
              <IconClock size={14} /> Время:
            </span>
            {([15, 30, 60, 120] as TestDuration[]).map((d) => (
              <button
                key={d}
                type="button"
                disabled={isStarted && !isFinished}
                onClick={() => {
                  setDuration(d);
                  setTimeLeft(d);
                  resetSession();
                }}
                className={`time-pill ${duration === d ? "time-pill--active" : ""}`}
              >
                {d}с
              </button>
            ))}
          </div>
        ) : (
          <div className="typing-arena__mode-badge">
            Режим: <strong>{mode === "lesson" ? "Урок" : "Свободная практика"}</strong>
          </div>
        )}

        <div className="typing-arena__live-stats">
          {mode === "test" ? (
            <div className="live-stat live-stat--time">
              <span className="live-stat__val">{timeLeft}</span>
              <span className="live-stat__sub">сек</span>
            </div>
          ) : null}

          {isStarted && !isFinished ? (
            <div className="live-stat">
              <span className="live-stat__val">{liveCpm}</span>
              <span className="live-stat__sub">CPM</span>
            </div>
          ) : null}

          <button
            type="button"
            onClick={() => resetSession()}
            className="action-icon-button"
            title="Перезапустить (Esc)"
            aria-label="Перезапустить"
          >
            <IconRepeat size={16} />
          </button>

          <button
            type="button"
            onClick={() => setShowKeyboard((prev) => !prev)}
            className={`action-icon-button ${showKeyboard ? "action-icon-button--active" : ""}`}
            title="Включить / скрыть клавиатуру"
            aria-label="Клавиатура"
          >
            <IconKeyboard size={16} />
          </button>
        </div>
      </div>

      {/* Main interactive typing container */}
      {!isFinished ? (
        <div
          className={`typing-screen ${!isFocused ? "typing-screen--blurred" : ""}`}
          onClick={() => inputRef.current?.focus()}
        >
          {/* Hidden text input capturing real typing */}
          <input
            id={inputId}
            ref={inputRef}
            type="text"
            className="typing-screen__hidden-input"
            value=""
            onChange={() => {}}
            onKeyDown={handleKeyDown}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            autoCapitalize="off"
            autoComplete="off"
            autoCorrect="off"
            spellCheck="false"
            aria-label="Поле для набора текста"
          />

          {!isFocused ? (
            <div className="typing-screen__overlay">
              <p>Кликните сюда, чтобы продолжить набор</p>
            </div>
          ) : null}

          {/* Rendered Text with Caret and Highlights */}
          <div className="typing-text-container" aria-hidden="true">
            {targetText.split("").map((char, index) => {
              const isTyped = index < inputBuffer.length;
              const isCurrent = index === inputBuffer.length;
              const isCorrect = isTyped && inputBuffer[index] === char;
              const isError = isTyped && inputBuffer[index] !== char;

              let charClass = "arena-char";
              if (isCorrect) charClass += " arena-char--correct";
              if (isError) charClass += " arena-char--wrong";
              if (isCurrent) charClass += " arena-char--current";
              if (!isTyped && !isCurrent) charClass += " arena-char--untyped";

              return (
                <span key={index} className={charClass}>
                  {isCurrent ? <span className="arena-caret" /> : null}
                  {char}
                </span>
              );
            })}
          </div>

          <div className="typing-screen__footer-hint">
            <span>
              Нажимайте клавиши на клавиатуре. Ошибки можно исправлять через{" "}
              <code>Backspace</code>. Сброс — клавиша <code>Esc</code>.
            </span>
          </div>
        </div>
      ) : (
        result && (
          <ResultCard
            result={result}
            onRestart={() => resetSession()}
            onNext={
              onTextRequest
                ? () => {
                    const newText = onTextRequest(layout);
                    resetSession(newText);
                  }
                : undefined
            }
          />
        )
      )}

      {/* Virtual Keyboard */}
      {showKeyboard && !isFinished ? (
        <div className="typing-arena__keyboard-wrap">
          <VirtualKeyboard
            layout={layout}
            activeChar={currentChar}
            pressedCode={pressedCode}
          />
        </div>
      ) : null}
    </div>
  );
}
