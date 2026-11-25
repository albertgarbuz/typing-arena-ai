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
  "победа в гонке достаётся не тому кто суетится и жмёт наугад а тому кто сохраняет хладнокровие и держит чистый ритм каждый палец бьёт точно в цель а взгляд устремлён только вперёд",
  "на высокой скорости трасса не прощает ошибок один сбой ломает темп и отбрасывает назад держите пальцы на базовом ряду чувствуйте ориентиры и двигайтесь к финишу на пределе возможностей",
  "истинный мастер печати обгоняет соперников за счёт стабильности когда пальцы скользят по клавишам легко и непрерывно скорость нарастает сама оставляя противника позади",
  "секунды тают на глазах когда оба гонщика идут ноздря в ноздрю в этот момент решает только мышечная память и абсолютная концентрация на каждом символе текста",
  "секрет ровного темпа прост не делай резких лишних движений просчитывай следующие три слова наперёд и держи непрерывный каденс ударов по клавишам",
];

export const ARENA_TEXTS_EN = [
  "true champions in the typing arena stay calm under intense pressure rapid fingers strike with absolute confidence turning pure focus into unmatched velocity on the racetrack",
  "in a sprint duel every single keystroke matters avoid hasty mistakes that break your cadence trust your muscle memory and surge ahead across the finish line",
  "speed without precision leads to defeat maintain a steady relentless rhythm from the first word to the last and victory in the arena will be yours",
  "high speed typing requires forethought scan two words ahead keep calm breathing and let finger muscle memory execute the moves cleanly",
];

const accuracyTexts = {
  ru: [
    "лёгкий ветер качает траву пока мы идём по тропе вдоль реки",
    "утром во дворе тихо и слышно как птицы поют под окном",
    "ровный ритм помогает пальцам легко находить нужные буквы",
  ],
  en: [
    "a soft wind moves the grass as we walk along the river",
    "the sky turns blue as the first birds sing outside the window",
    "find a steady rhythm and let your fingers follow the words",
  ],
};

export function getRandomArenaText(layout: "ru" | "en", mode: MatchMode = "1v1"): string {
  const texts = mode === "etude" ? accuracyTexts[layout] : layout === "ru" ? ARENA_TEXTS_RU : ARENA_TEXTS_EN;
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
