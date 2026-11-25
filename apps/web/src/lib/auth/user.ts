export interface MedalsCount {
  gold: number;
  silver: number;
  bronze: number;
}

export interface UserProfile {
  id: string;
  nickname: string;
  email: string;
  avatar: string;
  bio: string;
  authProvider: "guest" | "google" | "email";
  createdAt: string;
  level: number;
  xp: number;
  coins: number; // Накопленные баллы/монеты мастерства
  ratingRu: number;
  ratingEn: number;
  preferredLayout: "ru" | "en";
  goalCpm: number;
  goalDays: number;
  achievements: string[];
  medals: MedalsCount;
  unlockedAvatars: string[];
  unlockedTitles: string[];
  activeTitle: string;
  campaign?: { days: number; date: string; today: number; characters: number; best: number };
  toys?: string[];
  activeToy?: string;
  dailyAwardDate?: string;
  streakDays: number;
  lastActiveDate: string;
  totalMatches: number;
  wins: number;
}

export type League = "Бронза" | "Серебро" | "Золото" | "Платина" | "Чемпион";

export function getLeague(rating: number): { name: League; color: string; minElo: number } {
  if (rating >= 1800) return { name: "Чемпион", color: "#FFD700", minElo: 1800 };
  if (rating >= 1600) return { name: "Платина", color: "#00E5FF", minElo: 1600 };
  if (rating >= 1400) return { name: "Золото", color: "#FFA726", minElo: 1400 };
  if (rating >= 1200) return { name: "Серебро", color: "#B0BEC5", minElo: 1200 };
  return { name: "Бронза", color: "#CD7F32", minElo: 0 };
}

export interface ChessRankInfo {
  title: string;
  code: string;
  badge: string;
  color: string;
  minElo: number;
  description: string;
}

export function getChessRank(rating: number): ChessRankInfo {
  if (rating >= 2000) {
    return {
      title: "Легенда арены",
      code: "Легенда",
      badge: "👑 Легенда",
      color: "#FFD700",
      minElo: 2000,
      description: "Высшее звание. Безупречный ритм, филигранная точность свыше 400 CPM.",
    };
  }
  if (rating >= 1700) {
    return {
      title: "Сверхновая",
      code: "Сверхновая",
      badge: "⭐ Сверхновая",
      color: "#E040FB",
      minElo: 1700,
      description: "Элита скоростной печати. Победы в рапиде и блице против сильнейших.",
    };
  }
  if (rating >= 1400) {
    return {
      title: "Форсаж",
      code: "Форсаж",
      badge: "⚔️ Форсаж",
      color: "#00E5FF",
      minElo: 1400,
      description: "Уверенная слепая десятипальцевая печать без взглядов на клавиатуру.",
    };
  }
  if (rating >= 1200) {
    return {
      title: "Импульс",
      code: "Импульс",
      badge: "⚡ Импульс",
      color: "#69F0AE",
      minElo: 1200,
      description: "Стабильный темп, владение всеми рядами и знаками препинания.",
    };
  }
  if (rating >= 1000) {
    return {
      title: "Спринтер",
      code: "Спринтер",
      badge: "🎯 Спринтер",
      color: "#FFD54F",
      minElo: 1000,
      description: "Базовый уровень соревнований. Регулярная практика и первые победы.",
    };
  }
  return {
    title: "Новичок",
    code: "НОВИЧОК",
    badge: "🌱 Новичок",
    color: "#90A4AE",
    minElo: 0,
    description: "Начало пути слепого десятипальцевого метода.",
  };
}

export interface Achievement {
  code: string;
  title: string;
  description: string;
  icon: string;
  xpReward: number;
  coinReward: number;
}

export const ACHIEVEMENTS_LIST: Achievement[] = [
  {
    code: "first_step",
    title: "Первый шаг",
    description: "Завершите любую тренировку или урок печати",
    icon: "🎯",
    xpReward: 50,
    coinReward: 25,
  },
  {
    code: "clean_sheet",
    title: "Абсолютная точность",
    description: "Завершите упражнение со 100% точностью",
    icon: "✨",
    xpReward: 100,
    coinReward: 50,
  },
  {
    code: "speed_200",
    title: "Быстрые пальцы",
    description: "Преодолейте рубеж в 200 знаков в минуту (CPM)",
    icon: "⚡",
    xpReward: 150,
    coinReward: 75,
  },
  {
    code: "speed_300",
    title: "Мастер клавиатуры",
    description: "Преодолейте рубеж в 300 знаков в минуту (CPM)",
    icon: "🔥",
    xpReward: 250,
    coinReward: 120,
  },
  {
    code: "speed_400",
    title: "Легенда печати",
    description: "Преодолейте рубеж в 400 знаков в минуту (CPM)",
    icon: "👑",
    xpReward: 500,
    coinReward: 250,
  },
  {
    code: "arena_first_win",
    title: "Первая кровь",
    description: "Одержите свою первую победу на Арене",
    icon: "🏆",
    xpReward: 150,
    coinReward: 60,
  },
  {
    code: "arena_5_wins",
    title: "Гроза соперников",
    description: "Победите в 5 дуэлях на Арене соревнований",
    icon: "⚔️",
    xpReward: 300,
    coinReward: 150,
  },
  {
    code: "team_win",
    title: "Командный дух",
    description: "Победите в командной битве 2 на 2",
    icon: "🤝",
    xpReward: 200,
    coinReward: 100,
  },
  {
    code: "tournament_podium",
    title: "Призер турнира",
    description: "Займите призовое место в еженедельном турнире",
    icon: "🥇",
    xpReward: 400,
    coinReward: 200,
  },
  {
    code: "streak_7",
    title: "Стальная воля",
    description: "Тренируйтесь 7 дней подряд без единого пропуска",
    icon: "🔥",
    xpReward: 350,
    coinReward: 180,
  },
  {
    code: "chess_etude",
    title: "Виртуоз точности",
    description: "Решите клавиатурный этюд без ошибок за рекордное время",
    icon: "⚡",
    xpReward: 200,
    coinReward: 100,
  },
  {
    code: "lessons_10",
    title: "Прилежный ученик",
    description: "Успешно завершите 10 пошаговых уроков",
    icon: "📖",
    xpReward: 200,
    coinReward: 100,
  },
];

export interface ShopAvatar {
  avatar: string;
  name: string;
  cost: number;
  description: string;
}

export const SHOP_AVATARS: ShopAvatar[] = [
  { avatar: "🦊", name: "Лис-пилот", cost: 0, description: "Базовый аватар клавогонщика" },
  { avatar: "🦅", name: "Сокол", cost: 0, description: "Стремительный и зоркий" },
  { avatar: "🦝", name: "Ночной пилот", cost: 90, description: "Тихий старт под светом фонарей" },
  { avatar: "🪼", name: "Неоновая медуза", cost: 220, description: "Светится в глубине трека" },
  { avatar: "🧑‍🚀", name: "Орбитальный гонщик", cost: 360, description: "Покоряет космические дистанции" },
  { avatar: "🥷", name: "Ниндзя", cost: 100, description: "Бесшумные и точные удары" },
  { avatar: "🏎️", name: "Болид F1", cost: 150, description: "Чистая скорость на треке" },
  { avatar: "⚡", name: "Молния", cost: 200, description: "Энергия каждого нажатия" },
  { avatar: "🚀", name: "Ракета", cost: 250, description: "Преодолевая звуковой барьер" },
  { avatar: "👑", name: "Король", cost: 500, description: "Чемпион скорости" },
  { avatar: "🐉", name: "Дракон", cost: 750, description: "Легендарный огненный темп" },
  { avatar: "🦾", name: "Киборг", cost: 1000, description: "Идеальная машинная точность" },
];

export interface ShopTitle {
  title: string;
  cost: number;
  description: string;
}

export const SHOP_TITLES: ShopTitle[] = [
  { title: "Новичок клавиатуры", cost: 0, description: "Первые шаги к мастерству" },
  { title: "Пальцы-молнии", cost: 150, description: "Стремительный разгон на старте" },
  { title: "Тактик клавиш", cost: 250, description: "Чувствует ритм каждого слова" },
  { title: "Гроза Арены", cost: 400, description: "Непобедимый дуэлянт" },
  { title: "Легенда арены", cost: 800, description: "Абсолютный авторитет" },
];

export const CAMPAIGN = [
  { days: 1, characters: 200, speed: 0, avatar: "🦦", name: "Речной разведчик" },
  { days: 4, characters: 2000, speed: 80, avatar: "🦉", name: "Ночной штурман" },
  { days: 8, characters: 6000, speed: 120, avatar: "🐆", name: "Спринтер" },
  { days: 15, characters: 16000, speed: 160, avatar: "🦈", name: "Охотник глубин" },
  { days: 23, characters: 35000, speed: 200, avatar: "🦄", name: "Спектр" },
  { days: 32, characters: 64000, speed: 240, avatar: "🐦‍🔥", name: "Феникс арены" },
];
export function advanceCampaign(correct: number, accuracy: number, cpm: number) {
  if (correct < 1 || accuracy < 90) return;
  const user = getCurrentUser();
  const day = dailyGoal().day;
  const prev = user.campaign;
  const earlier = prev?.date === day ? prev.today : 0;
  const today = earlier + correct;
  const days = (prev?.days || 0) + Number(earlier < 200 && today >= 200);
  const characters = (prev?.characters || 0) + correct;
  const best = Math.max(prev?.best || 0, correct >= 20 ? cpm : 0);
  user.campaign = {days, date: day, today, characters, best};
  for (const stage of CAMPAIGN) {
    if (days >= stage.days && characters >= stage.characters && best >= stage.speed &&
        !user.unlockedAvatars.includes(stage.avatar)) user.unlockedAvatars.push(stage.avatar);
  }
  saveUser(user);
}
export const TOYS = [
  { id: "satellite", icon: "🛰️", name: "Орбитальный спутник", cost: 60 },
  { id: "robot", icon: "🤖", name: "Робот-барабанщик", cost: 180 },
  { id: "comet", icon: "☄️", name: "Карманная комета", cost: 320 },
];
export const SPEED_TITLES: Record<string, string> = {
  speed_200: "Пилот импульса", speed_300: "Звуковой гонщик", speed_400: "Сверхзвук"
};
export function dailyGoal(now = new Date()) {
  const day = [now.getFullYear(), String(now.getMonth()+1).padStart(2,"0"), String(now.getDate()).padStart(2,"0")].join("-");
  const letters = [12, 16, 20][Math.floor(Date.UTC(now.getFullYear(),now.getMonth(),now.getDate()) / 86400000) % 3];
  return { day, letters };
}
export function earnDailyReward(correct: number, accuracy: number) {
  const goal = dailyGoal();
  const user = getCurrentUser();
  if (correct < goal.letters || accuracy < 90 || user.dailyAwardDate === goal.day) return false;
  user.dailyAwardDate = goal.day;
  user.coins += 30;
  saveUser(user);
  return true;
}
export function selectToy(id: string) {
  const item = TOYS.find(toy => toy.id === id);
  if (!item) return;
  const user = getCurrentUser();
  const owned = user.toys || [];
  if (!owned.includes(id)) {
    if (user.coins < item.cost) return;
    user.coins -= item.cost;
    user.toys = [...owned, id];
  }
  user.activeToy = id;
  saveUser(user);
}

const USER_STORAGE_KEY = "typing-arena-current-user";
const listeners = new Set<() => void>();

export function subscribeUser(callback: () => void): () => void {
  listeners.add(callback);
  if (typeof window !== "undefined") {
    window.addEventListener("storage", callback);
  }
  return () => {
    listeners.delete(callback);
    if (typeof window !== "undefined") {
      window.removeEventListener("storage", callback);
    }
  };
}

function notify() {
  for (const l of listeners) l();
}

export function getDefaultUser(): UserProfile {
  return {
    id: "user-default",
    nickname: "Клавогонщик",
    email: "pilot@typingarena.ai",
    avatar: "🦊",
    bio: "Осваиваю слепой десятипальцевый метод печати",
    authProvider: "guest",
    createdAt: new Date().toISOString(),
    level: 1,
    xp: 120,
    coins: 80,
    ratingRu: 1000,
    ratingEn: 1000,
    preferredLayout: "ru",
    goalCpm: 250,
    goalDays: 30,
    achievements: ["first_step"],
    medals: { gold: 0, silver: 0, bronze: 1 },
    unlockedAvatars: ["🦊", "🦅"],
    unlockedTitles: ["Новичок клавиатуры"],
    activeTitle: "Новичок клавиатуры",
    streakDays: 1,
    lastActiveDate: new Date().toISOString().slice(0, 10),
    totalMatches: 0,
    wins: 0,
  };
}

const defaultSnapshot = JSON.stringify(getDefaultUser());

export function getUserServerSnapshot(): string {
  return defaultSnapshot;
}

export function getUserRaw(): string {
  if (typeof window === "undefined") return getUserServerSnapshot();
  try {
    const raw = localStorage.getItem(USER_STORAGE_KEY);
    if (!raw) {
      const def = getDefaultUser();
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(def));
      return JSON.stringify(def);
    }
    const legacy = "Гроссмейстер слепой печати";
    if (raw.includes(legacy)) {
      const profile = JSON.parse(raw);
      if (profile.activeTitle === legacy) profile.activeTitle = "Легенда арены";
      if (Array.isArray(profile.unlockedTitles)) profile.unlockedTitles = profile.unlockedTitles.map((title: string) => title === legacy ? "Легенда арены" : title);
      const migrated = JSON.stringify(profile);
      localStorage.setItem(USER_STORAGE_KEY, migrated);
      return migrated;
    }
    return raw;
  } catch {
    return getUserServerSnapshot();
  }
}

export function getCurrentUser(): UserProfile {
  try {
    const parsed = JSON.parse(getUserRaw());
    const def = getDefaultUser();
    return {
      ...def,
      ...parsed,
      medals: {
        ...def.medals,
        ...(parsed?.medals || {}),
      },
      unlockedAvatars: Array.isArray(parsed?.unlockedAvatars)
        ? parsed.unlockedAvatars
        : def.unlockedAvatars,
      unlockedTitles: earnedTitles(parsed, def.unlockedTitles),
      achievements: Array.isArray(parsed?.achievements)
        ? parsed.achievements
        : def.achievements,
    };
  } catch {
    return getDefaultUser();
  }
}

export function saveUser(user: UserProfile): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
    notify();
  } catch (err) {
    console.error("Failed to save user profile:", err);
  }
}

export function addXpAndCoins(
  xpAmount: number,
  coinsAmount: number
): { newLevel: number; newXp: number; leveledUp: boolean } {
  const user = getCurrentUser();
  const nextXp = user.xp + xpAmount;
  const nextCoins = user.coins + coinsAmount;
  // 1 level per 200 XP
  const nextLevel = Math.max(1, Math.floor(nextXp / 200) + 1);
  const leveledUp = nextLevel > user.level;

  user.xp = nextXp;
  user.coins = nextCoins;
  user.level = nextLevel;

  // Check today streak
  const today = new Date().toISOString().slice(0, 10);
  if (user.lastActiveDate !== today) {
    const lastDate = new Date(user.lastActiveDate);
    const currDate = new Date(today);
    const diffDays = Math.round(
      (currDate.getTime() - lastDate.getTime()) / (1000 * 3600 * 24)
    );
    if (diffDays === 1) {
      user.streakDays += 1;
      
    } else if (diffDays > 1) {
      user.streakDays = 1;
    }
    user.lastActiveDate = today;
  }

  saveUser(user);
  if (user.streakDays >= 7) unlockAchievement("streak_7");
  return { newLevel: nextLevel, newXp: nextXp, leveledUp };
}

export function awardMedal(type: "gold" | "silver" | "bronze"): void {
  const user = getCurrentUser();
  user.medals[type] = (user.medals[type] || 0) + 1;
  user.coins += type === "gold" ? 100 : type === "silver" ? 50 : 25;
  saveUser(user);
}

export function unlockAchievement(code: string): boolean {
  const user = getCurrentUser();
  if (user.achievements.includes(code)) return false;

  const ach = ACHIEVEMENTS_LIST.find((a) => a.code === code);
  user.achievements.push(code);
  const title = SPEED_TITLES[code];
  if (title && !user.unlockedTitles.includes(title)) user.unlockedTitles.push(title);
  if (ach) {
    user.xp += ach.xpReward;
    user.coins += ach.coinReward;
    user.level = Math.max(1, Math.floor(user.xp / 200) + 1);
  }
  saveUser(user);
  return true;
}

export function unlockAvatar(avatar: string, cost: number): boolean {
  const user = getCurrentUser();
  if (user.unlockedAvatars.includes(avatar)) return true;
  if (user.coins < cost) return false;

  user.coins -= cost;
  user.unlockedAvatars.push(avatar);
  user.avatar = avatar;
  saveUser(user);
  return true;
}

export function unlockTitle(title: string, cost: number): boolean {
  const user = getCurrentUser();
  if (user.unlockedTitles.includes(title)) {
    user.activeTitle = title;
    saveUser(user);
    return true;
  }
  if (user.coins < cost) return false;

  user.coins -= cost;
  user.unlockedTitles.push(title);
  user.activeTitle = title;
  saveUser(user);
  return true;
}

export function updateUserRating(
  layout: "ru" | "en",
  delta: number,
  isWin: boolean,
  matchType: "1v1" | "2v2" | "tournament" = "1v1"
): void {
  const user = getCurrentUser();
  if (layout === "ru") {
    user.ratingRu = Math.max(100, user.ratingRu + delta);
  } else {
    user.ratingEn = Math.max(100, user.ratingEn + delta);
  }
  user.totalMatches += 1;
  if (isWin) user.wins += 1;
  saveUser(user);
  if (isWin) {
    if (user.wins === 1) unlockAchievement("arena_first_win");
    if (user.wins === 5) unlockAchievement("arena_5_wins");
    if (matchType === "2v2") unlockAchievement("team_win");
    if (matchType === "tournament") {
      awardMedal("gold");
      unlockAchievement("tournament_podium");
    } else {
      awardMedal("silver");
    }
  }

  const xpEarned = isWin ? 100 : 40;
  const coinsEarned = isWin ? 40 : 15;
  addXpAndCoins(xpEarned, coinsEarned);
}

const progressKeys = ["typing-arena-matches", "typing-arena-results", "typing-arena-progress", "typing-arena-best-ru", "typing-arena-best-en"];
function archiveKey(email: string, provider: string) {
  return "typing-arena-local-profile:" + provider + ":" + email.trim().toLowerCase();
}

function restoreLocalProfile(email: string, provider: string): UserProfile {
  const raw = localStorage.getItem(archiveKey(email, provider));
  if (!raw) return getCurrentUser();
  const saved = JSON.parse(raw);
  for (const key of progressKeys) {
    if (typeof saved.progress[key] === "string") localStorage.setItem(key, saved.progress[key]);
    else localStorage.removeItem(key);
  }
  window.dispatchEvent(new Event("storage"));
  return saved.profile;
}

export function loginWithGoogle(profile?: {
  name?: string;
  email?: string;
  avatar?: string;
}): UserProfile {
  const user = restoreLocalProfile(profile?.email || "user@gmail.com", "google");
  user.authProvider = "google";
  user.nickname = profile?.name || "Google Пользователь";
  user.email = profile?.email || "user@gmail.com";
  if (profile?.avatar) {
    user.avatar = profile.avatar;
    if (!user.unlockedAvatars.includes(profile.avatar)) {
      user.unlockedAvatars.push(profile.avatar);
    }
  }
  saveUser(user);
  return user;
}

export function loginWithEmail(data: { nickname: string; email: string }): UserProfile {
  const user = restoreLocalProfile(data.email, "email");
  user.authProvider = "email";
  user.nickname = data.nickname;
  user.email = data.email;
  saveUser(user);
  return user;
}

export function logoutUser(): UserProfile {
  const profile = getCurrentUser();
  const progress = Object.fromEntries(progressKeys.map(key => [key, localStorage.getItem(key)]));
  localStorage.setItem(archiveKey(profile.email, profile.authProvider), JSON.stringify({ profile, progress }));
  for (const key of progressKeys) localStorage.removeItem(key);
  window.dispatchEvent(new Event("storage"));
  const def = getDefaultUser();
  def.authProvider = "guest";
  saveUser(def);
  return def;
}

export function earnedTitles(profile: Partial<UserProfile>, fallback: string[]) {
  return [...new Set([...(Array.isArray(profile.unlockedTitles) ? profile.unlockedTitles : fallback),
    ...Object.entries(SPEED_TITLES).filter(([code]) => profile.achievements?.includes(code)).map(([,title]) => title)])];
}
