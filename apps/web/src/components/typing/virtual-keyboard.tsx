"use client";

import { useMemo } from "react";
import {
  findKeyDef,
  getFingerLabel,
  RU_KEYBOARD,
  EN_KEYBOARD,
} from "@/lib/typing/keyboard";
import type { KeyDef, Layout } from "@/lib/typing/types";

interface VirtualKeyboardProps {
  layout: Layout;
  activeChar?: string;
  pressedCode?: string;
}

export function VirtualKeyboard({
  layout,
  activeChar,
  pressedCode,
}: VirtualKeyboardProps) {
  const keyboard = layout === "ru" ? RU_KEYBOARD : EN_KEYBOARD;

  const activeKeyDef = useMemo(() => {
    if (!activeChar) return null;
    return findKeyDef(activeChar, layout);
  }, [activeChar, layout]);

  const activeFingerLabel = useMemo(() => {
    if (!activeKeyDef) return null;
    return getFingerLabel(activeKeyDef.finger, activeKeyDef.hand);
  }, [activeKeyDef]);

  return (
    <div className="vk-container" aria-label="Виртуальная клавиатура">
      {activeFingerLabel ? (
        <div className="vk-finger-hint">
          <span className="vk-finger-hint__dot" />
          <span>Палец: <strong>{activeFingerLabel}</strong></span>
          {activeChar ? (
            <span className="vk-finger-hint__char">
              Клавиша: <code>{activeChar === " " ? "пробел" : activeChar}</code>
            </span>
          ) : null}
        </div>
      ) : null}

      <div className="vk-board">
        {keyboard.map((row, rowIndex) => (
          <div key={rowIndex} className={`vk-row vk-row--${rowIndex + 1}`}>
            {row.map((key) => {
              const isActive =
                activeKeyDef &&
                (activeKeyDef.code === key.code ||
                  activeKeyDef.char === key.char ||
                  (activeChar === " " && key.char === " "));
              const isPressed = pressedCode === key.code;

              return (
                <Keycap
                  key={key.code}
                  keyDef={key}
                  isActive={Boolean(isActive)}
                  isPressed={isPressed}
                />
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

function Keycap({
  keyDef,
  isActive,
  isPressed,
}: {
  keyDef: KeyDef;
  isActive: boolean;
  isPressed: boolean;
}) {
  const classNames = [
    "vk-key",
    `vk-key--finger-${keyDef.finger}`,
    `vk-key--hand-${keyDef.hand}`,
    keyDef.isHome ? "vk-key--home" : null,
    keyDef.isAnchor ? "vk-key--anchor" : null,
    isActive ? "vk-key--active" : null,
    isPressed ? "vk-key--pressed" : null,
    keyDef.char === " " ? "vk-key--space" : null,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={classNames} data-code={keyDef.code}>
      <span className="vk-key__char">{keyDef.displayChar || keyDef.char.toUpperCase()}</span>
      {keyDef.shiftChar ? (
        <span className="vk-key__shift">{keyDef.shiftChar}</span>
      ) : null}
      {keyDef.isAnchor ? <span className="vk-key__bump" /> : null}
    </div>
  );
}
