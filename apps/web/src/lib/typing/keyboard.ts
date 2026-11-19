import type { Finger, Hand, KeyDef, Layout } from "./types";

export interface FingerInfo {
  finger: Finger;
  hand: Hand;
  labelRu: string;
}

export const FINGER_LABELS: Record<string, string> = {
  "pinky-left": "Левый мизинец",
  "ring-left": "Левый безымянный",
  "middle-left": "Левый средний",
  "index-left": "Левый указательный",
  "thumb-left": "Большой палец",
  "thumb-right": "Большой палец",
  "thumb-both": "Большие пальцы (пробел)",
  "index-right": "Правый указательный",
  "middle-right": "Правый средний",
  "ring-right": "Правый безымянный",
  "pinky-right": "Правый мизинец",
};

export function getFingerLabel(finger: Finger, hand: Hand): string {
  if (finger === "thumb") return "Большой палец (пробел)";
  const side = hand === "left" ? "Левый" : "Правый";
  const names: Record<Finger, string> = {
    pinky: "мизинец",
    ring: "безымянный",
    middle: "средний",
    index: "указательный",
    thumb: "большой",
  };
  return `${side} ${names[finger]}`;
}

export const RU_KEYBOARD: KeyDef[][] = [
  // Row 1: Numbers & symbols
  [
    { char: "ё", shiftChar: "Ё", finger: "pinky", hand: "left", code: "Backquote", row: 1 },
    { char: "1", shiftChar: "!", finger: "pinky", hand: "left", code: "Digit1", row: 1 },
    { char: "2", shiftChar: '"', finger: "ring", hand: "left", code: "Digit2", row: 1 },
    { char: "3", shiftChar: "№", finger: "middle", hand: "left", code: "Digit3", row: 1 },
    { char: "4", shiftChar: ";", finger: "index", hand: "left", code: "Digit4", row: 1 },
    { char: "5", shiftChar: "%", finger: "index", hand: "left", code: "Digit5", row: 1 },
    { char: "6", shiftChar: ":", finger: "index", hand: "right", code: "Digit6", row: 1 },
    { char: "7", shiftChar: "?", finger: "index", hand: "right", code: "Digit7", row: 1 },
    { char: "8", shiftChar: "*", finger: "middle", hand: "right", code: "Digit8", row: 1 },
    { char: "9", shiftChar: "(", finger: "ring", hand: "right", code: "Digit9", row: 1 },
    { char: "0", shiftChar: ")", finger: "pinky", hand: "right", code: "Digit0", row: 1 },
    { char: "-", shiftChar: "_", finger: "pinky", hand: "right", code: "Minus", row: 1 },
    { char: "=", shiftChar: "+", finger: "pinky", hand: "right", code: "Equal", row: 1 },
  ],
  // Row 2: Top letter row
  [
    { char: "й", shiftChar: "Й", finger: "pinky", hand: "left", code: "KeyQ", row: 2 },
    { char: "ц", shiftChar: "Ц", finger: "ring", hand: "left", code: "KeyW", row: 2 },
    { char: "у", shiftChar: "У", finger: "middle", hand: "left", code: "KeyE", row: 2 },
    { char: "к", shiftChar: "К", finger: "index", hand: "left", code: "KeyR", row: 2 },
    { char: "е", shiftChar: "Е", finger: "index", hand: "left", code: "KeyT", row: 2 },
    { char: "н", shiftChar: "Н", finger: "index", hand: "right", code: "KeyY", row: 2 },
    { char: "г", shiftChar: "Г", finger: "index", hand: "right", code: "KeyU", row: 2 },
    { char: "ш", shiftChar: "Ш", finger: "middle", hand: "right", code: "KeyI", row: 2 },
    { char: "щ", shiftChar: "Щ", finger: "ring", hand: "right", code: "KeyO", row: 2 },
    { char: "з", shiftChar: "З", finger: "pinky", hand: "right", code: "KeyP", row: 2 },
    { char: "х", shiftChar: "Х", finger: "pinky", hand: "right", code: "BracketLeft", row: 2 },
    { char: "ъ", shiftChar: "Ъ", finger: "pinky", hand: "right", code: "BracketRight", row: 2 },
  ],
  // Row 3: Home row (основной ряд)
  [
    { char: "ф", shiftChar: "Ф", finger: "pinky", hand: "left", code: "KeyA", row: 3, isHome: true },
    { char: "ы", shiftChar: "Ы", finger: "ring", hand: "left", code: "KeyS", row: 3, isHome: true },
    { char: "в", shiftChar: "В", finger: "middle", hand: "left", code: "KeyD", row: 3, isHome: true },
    { char: "а", shiftChar: "А", finger: "index", hand: "left", code: "KeyF", row: 3, isHome: true, isAnchor: true },
    { char: "п", shiftChar: "П", finger: "index", hand: "left", code: "KeyG", row: 3 },
    { char: "р", shiftChar: "Р", finger: "index", hand: "right", code: "KeyH", row: 3 },
    { char: "о", shiftChar: "О", finger: "index", hand: "right", code: "KeyJ", row: 3, isHome: true, isAnchor: true },
    { char: "л", shiftChar: "Л", finger: "middle", hand: "right", code: "KeyK", row: 3, isHome: true },
    { char: "д", shiftChar: "Д", finger: "ring", hand: "right", code: "KeyL", row: 3, isHome: true },
    { char: "ж", shiftChar: "Ж", finger: "pinky", hand: "right", code: "Semicolon", row: 3, isHome: true },
    { char: "э", shiftChar: "Э", finger: "pinky", hand: "right", code: "Quote", row: 3 },
  ],
  // Row 4: Bottom row
  [
    { char: "я", shiftChar: "Я", finger: "pinky", hand: "left", code: "KeyZ", row: 4 },
    { char: "ч", shiftChar: "Ч", finger: "ring", hand: "left", code: "KeyX", row: 4 },
    { char: "с", shiftChar: "С", finger: "middle", hand: "left", code: "KeyC", row: 4 },
    { char: "м", shiftChar: "М", finger: "index", hand: "left", code: "KeyV", row: 4 },
    { char: "и", shiftChar: "И", finger: "index", hand: "left", code: "KeyB", row: 4 },
    { char: "т", shiftChar: "Т", finger: "index", hand: "right", code: "KeyN", row: 4 },
    { char: "ь", shiftChar: "Ь", finger: "index", hand: "right", code: "KeyM", row: 4 },
    { char: "б", shiftChar: "Б", finger: "middle", hand: "right", code: "Comma", row: 4 },
    { char: "ю", shiftChar: "Ю", finger: "ring", hand: "right", code: "Period", row: 4 },
    { char: ".", shiftChar: ",", finger: "pinky", hand: "right", code: "Slash", row: 4 },
  ],
  // Row 5: Space
  [
    { char: " ", displayChar: "пробел", finger: "thumb", hand: "both", code: "Space", row: 5 },
  ],
];

export const EN_KEYBOARD: KeyDef[][] = [
  // Row 1: Numbers & symbols
  [
    { char: "`", shiftChar: "~", finger: "pinky", hand: "left", code: "Backquote", row: 1 },
    { char: "1", shiftChar: "!", finger: "pinky", hand: "left", code: "Digit1", row: 1 },
    { char: "2", shiftChar: "@", finger: "ring", hand: "left", code: "Digit2", row: 1 },
    { char: "3", shiftChar: "#", finger: "middle", hand: "left", code: "Digit3", row: 1 },
    { char: "4", shiftChar: "$", finger: "index", hand: "left", code: "Digit4", row: 1 },
    { char: "5", shiftChar: "%", finger: "index", hand: "left", code: "Digit5", row: 1 },
    { char: "6", shiftChar: "^", finger: "index", hand: "right", code: "Digit6", row: 1 },
    { char: "7", shiftChar: "&", finger: "index", hand: "right", code: "Digit7", row: 1 },
    { char: "8", shiftChar: "*", finger: "middle", hand: "right", code: "Digit8", row: 1 },
    { char: "9", shiftChar: "(", finger: "ring", hand: "right", code: "Digit9", row: 1 },
    { char: "0", shiftChar: ")", finger: "pinky", hand: "right", code: "Digit0", row: 1 },
    { char: "-", shiftChar: "_", finger: "pinky", hand: "right", code: "Minus", row: 1 },
    { char: "=", shiftChar: "+", finger: "pinky", hand: "right", code: "Equal", row: 1 },
  ],
  // Row 2: Top letter row
  [
    { char: "q", shiftChar: "Q", finger: "pinky", hand: "left", code: "KeyQ", row: 2 },
    { char: "w", shiftChar: "W", finger: "ring", hand: "left", code: "KeyW", row: 2 },
    { char: "e", shiftChar: "E", finger: "middle", hand: "left", code: "KeyE", row: 2 },
    { char: "r", shiftChar: "R", finger: "index", hand: "left", code: "KeyR", row: 2 },
    { char: "t", shiftChar: "T", finger: "index", hand: "left", code: "KeyT", row: 2 },
    { char: "y", shiftChar: "Y", finger: "index", hand: "right", code: "KeyY", row: 2 },
    { char: "u", shiftChar: "U", finger: "index", hand: "right", code: "KeyU", row: 2 },
    { char: "i", shiftChar: "I", finger: "middle", hand: "right", code: "KeyI", row: 2 },
    { char: "o", shiftChar: "O", finger: "ring", hand: "right", code: "KeyO", row: 2 },
    { char: "p", shiftChar: "P", finger: "pinky", hand: "right", code: "KeyP", row: 2 },
    { char: "[", shiftChar: "{", finger: "pinky", hand: "right", code: "BracketLeft", row: 2 },
    { char: "]", shiftChar: "}", finger: "pinky", hand: "right", code: "BracketRight", row: 2 },
  ],
  // Row 3: Home row
  [
    { char: "a", shiftChar: "A", finger: "pinky", hand: "left", code: "KeyA", row: 3, isHome: true },
    { char: "s", shiftChar: "S", finger: "ring", hand: "left", code: "KeyS", row: 3, isHome: true },
    { char: "d", shiftChar: "D", finger: "middle", hand: "left", code: "KeyD", row: 3, isHome: true },
    { char: "f", shiftChar: "F", finger: "index", hand: "left", code: "KeyF", row: 3, isHome: true, isAnchor: true },
    { char: "g", shiftChar: "G", finger: "index", hand: "left", code: "KeyG", row: 3 },
    { char: "h", shiftChar: "H", finger: "index", hand: "right", code: "KeyH", row: 3 },
    { char: "j", shiftChar: "J", finger: "index", hand: "right", code: "KeyJ", row: 3, isHome: true, isAnchor: true },
    { char: "k", shiftChar: "K", finger: "middle", hand: "right", code: "KeyK", row: 3, isHome: true },
    { char: "l", shiftChar: "L", finger: "ring", hand: "right", code: "KeyL", row: 3, isHome: true },
    { char: ";", shiftChar: ":", finger: "pinky", hand: "right", code: "Semicolon", row: 3, isHome: true },
    { char: "'", shiftChar: '"', finger: "pinky", hand: "right", code: "Quote", row: 3 },
  ],
  // Row 4: Bottom row
  [
    { char: "z", shiftChar: "Z", finger: "pinky", hand: "left", code: "KeyZ", row: 4 },
    { char: "x", shiftChar: "X", finger: "ring", hand: "left", code: "KeyX", row: 4 },
    { char: "c", shiftChar: "C", finger: "middle", hand: "left", code: "KeyC", row: 4 },
    { char: "v", shiftChar: "V", finger: "index", hand: "left", code: "KeyV", row: 4 },
    { char: "b", shiftChar: "B", finger: "index", hand: "left", code: "KeyB", row: 4 },
    { char: "n", shiftChar: "N", finger: "index", hand: "right", code: "KeyN", row: 4 },
    { char: "m", shiftChar: "M", finger: "index", hand: "right", code: "KeyM", row: 4 },
    { char: ",", shiftChar: "<", finger: "middle", hand: "right", code: "Comma", row: 4 },
    { char: ".", shiftChar: ">", finger: "ring", hand: "right", code: "Period", row: 4 },
    { char: "/", shiftChar: "?", finger: "pinky", hand: "right", code: "Slash", row: 4 },
  ],
  // Row 5: Space
  [
    { char: " ", displayChar: "space", finger: "thumb", hand: "both", code: "Space", row: 5 },
  ],
];

// Helper to look up key info by character
export function findKeyDef(char: string, layout: Layout): KeyDef | null {
  const keyboard = layout === "ru" ? RU_KEYBOARD : EN_KEYBOARD;
  const lowerChar = char.toLowerCase();
  for (const row of keyboard) {
    for (const key of row) {
      if (key.char === char || key.char === lowerChar || key.shiftChar === char) {
        return key;
      }
    }
  }
  return null;
}
