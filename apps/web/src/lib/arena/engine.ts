import type { MatchHistoryItem, MatchMode, Racer, TimeControl } from "./types";

const MATCH_HISTORY_KEY = "typing-arena-matches";

export function calculateEloChange(
  myRating: number,
  rivalRating: number,
  isWin: boolean
): number {
  const K = 32;
  const expected = 1 / (1 + Math.pow(10, (rivalRating - myRating) / 400));
  const actual = isWin ? 1 : 0;
  const change = Math.round(K * (actual - expected));
  return isWin ? Math.max(10, change) : Math.min(-6, change);
}

export const BOT_PROFILES_RU = [
  { name: "Сокол_99", avatar: "🦅", title: "Форсаж" },
  { name: "Стремительный_Лис", avatar: "🦊", title: "Импульс" },
  { name: "Клавишный_Ниндзя", avatar: "🥷", title: "Легенда арены" },
  { name: "Неоновый_Гонщик", avatar: "🏎️", title: "Форсаж" },
  { name: "Тайфун_Ввода", avatar: "⚡", title: "Сверхновая" },
  { name: "Кибер_Барс", avatar: "🐆", title: "Спринтер" },
  { name: "Метеор_F1", avatar: "☄️", title: "Импульс" },
  { name: "Орбитальный_Пилот", avatar: "👑", title: "Легенда арены" },
  { name: "Стальной_Ритм", avatar: "🦾", title: "Форсаж" },
];

export const BOT_PROFILES_EN = [
  { name: "SwiftFalcon", avatar: "🦅", title: "Форсаж" },
  { name: "CyberDrifter", avatar: "🏎️", title: "Сверхновая" },
  { name: "VelocityKnight", avatar: "⚔️", title: "Легенда" },
  { name: "PulseTypist", avatar: "⚡", title: "Импульс" },
  { name: "HyperNova", avatar: "🌟", title: "Легенда" },
  { name: "OrbitKeys", avatar: "👑", title: "Легенда" },
];

export function createRivalBot(
  playerRating: number,
  layout: "ru" | "en",
  team?: "blue" | "red"
): Racer {
  const profiles = layout === "ru" ? BOT_PROFILES_RU : BOT_PROFILES_EN;
  const p = profiles[Math.floor(Math.random() * profiles.length)];

  // Rival rating closely matches player with variation ± 60
  const ratingJitter = Math.floor(Math.random() * 100) - 50;
  const rating = Math.max(400, playerRating + ratingJitter);

  // Target CPM is calibrated around player's rating / 5.5 ± jitter
  const baseCpm = Math.max(120, Math.round(rating / 5.5) + Math.floor(Math.random() * 30 - 15));

  return {
    id: `bot-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    name: p.name,
    avatar: p.avatar,
    rating,
    progressPercent: 0,
    cpm: baseCpm,
    accuracy: 96 + Math.floor(Math.random() * 4),
    isFinished: false,
    isBot: true,
    team: team || "red",
    chessRank: p.title,
  };
}

export function create2v2MatchRoster(
  player: { name: string; avatar: string; rating: number },
  layout: "ru" | "en"
): { teamBlue: Racer[]; teamRed: Racer[] } {
  const playerRacer: Racer = {
    id: "player",
    name: player.name,
    avatar: player.avatar,
    rating: player.rating,
    progressPercent: 0,
    cpm: 0,
    accuracy: 100,
    isFinished: false,
    team: "blue",
  };

  // Teammate bot
  const teammate = createRivalBot(player.rating, layout, "blue");
  teammate.name = layout === "ru" ? "Напарник_Бот" : "CoPilot_Bot";

  // 2 Rivals
  const rival1 = createRivalBot(player.rating, layout, "red");
  const rival2 = createRivalBot(player.rating, layout, "red");

  return {
    teamBlue: [playerRacer, teammate],
    teamRed: [rival1, rival2],
  };
}

export const ARENA_TEXTS_RU = [
  "Победа в гонке достаётся не тому, кто суетится и жмёт наугад, а тому, кто сохраняет хладнокровие и держит чистый ритм. Каждый палец бьёт точно в цель, а взгляд устремлён только вперёд.",
  "На высокой скорости трасса не прощает ошибок. Один сбой ломает темп и отбрасывает назад. Держите пальцы на базовом ряду, чувствуйте ориентиры и двигайтесь к финишу на пределе возможностей.",
  "Истинный мастер печати обгоняет соперников за счёт стабильности. Когда пальцы скользят по клавишам легко и непрерывно, скорость нарастает сама, оставляя противника позади.",
  "Секунды тают на глазах, когда оба гонщика идут ноздря в ноздрю. В этот момент решает только мышечная память и абсолютная концентрация на каждом символе текста.",
  "Секрет ровного темпа прост: не делай резких лишних движений, просчитывай следующие три слова наперёд и держи непрерывный каденс ударов по клавишам.",
];

export const ARENA_TEXTS_EN = [
  "True champions in the typing arena stay calm under intense pressure. Rapid fingers strike with absolute confidence, turning pure focus into unmatched velocity on the racetrack.",
  "In a sprint duel every single keystroke matters. Avoid hasty mistakes that break your cadence, trust your muscle memory, and surge ahead across the finish line.",
  "Speed without precision leads to defeat. Maintain a steady, relentless rhythm from the first word to the last, and victory in the arena will be yours.",
  "High-speed typing requires forethought: scan two words ahead, keep calm breathing, and let finger muscle memory execute the moves cleanly.",
];

// Chess Keyboard Etudes: complex tactical combinations
export const CHESS_ETUDES_RU = [{ title: "Спринт разработчика", hint: "Код и пунктуация", text: "скорость = 120; пока (таймер > 0) { ритм = скорость + 1; }" }, { title: "Код импульса", hint: "Цифры и пунктуация", text: "Сектор 7: частота 42 Гц. На счёт три запустите цикл (А-19), удержите ритм и подтвердите сигнал!" }];
export const CHESS_ETUDES_EN = [{ title: "Code sprint", hint: "Brackets and punctuation", text: "const speed = 120; const ready = true; if (ready) { startRace(speed); }" }, { title: "Signal relay", hint: "Numbers and punctuation", text: "Sector 7: set the relay to 42 Hz. Start cycle (A-19), keep a steady rhythm, and confirm the signal!" }];

export function getRandomArenaText(layout: "ru" | "en", mode: MatchMode = "1v1"): string {
  if (mode === "etude") {
    const etudes = layout === "ru" ? CHESS_ETUDES_RU : CHESS_ETUDES_EN;
    return etudes[Math.floor(Math.random() * etudes.length)].text;
  }
  const texts = layout === "ru" ? ARENA_TEXTS_RU : ARENA_TEXTS_EN;
  return texts[Math.floor(Math.random() * texts.length)];
}

export function saveMatchResult(match: MatchHistoryItem): void {
  if (typeof window === "undefined") return;
  try {
    const raw = localStorage.getItem(MATCH_HISTORY_KEY);
    const list: MatchHistoryItem[] = raw ? JSON.parse(raw) : [];
    const best = getArenaBest(match.layout);
    localStorage.setItem("typing-arena-best-" + match.layout, String(Math.max(best, match.myCpm)));
    list.unshift(match);
    if (list.length > 50) list.length = 50;
    localStorage.setItem(MATCH_HISTORY_KEY, JSON.stringify(list));
  } catch (err) {
    console.error("Failed to save match:", err);
  }
}

export function getMatchHistory(): MatchHistoryItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(MATCH_HISTORY_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function getArenaBest(layout: "ru" | "en"): number {
  if (typeof window === "undefined") return 0;
  return Math.max(Number(localStorage.getItem("typing-arena-best-" + layout)) || 0,
    ...getMatchHistory().filter(match => match.layout === layout).map(match => match.myCpm));
}
