export type MatchMode = "1v1" | "2v2" | "tournament" | "etude";
export type TimeControl = "bullet" | "blitz" | "rapid";

export interface Racer {
  id: string;
  name: string;
  avatar: string;
  rating: number;
  progressPercent: number; // 0 to 100
  cpm: number;
  accuracy: number;
  isFinished: boolean;
  isBot?: boolean;
  team?: "blue" | "red";
  chessRank?: string;
}

export interface MatchHistoryItem {
  id: string;
  timestamp: string;
  layout: "ru" | "en";
  mode: MatchMode;
  timeControl: TimeControl;
  textSnippet: string;
  myCpm: number;
  myAccuracy: number;
  rivalName: string;
  rivalAvatar: string;
  rivalCpm: number;
  isWin: boolean;
  deltaElo: number;
  myRatingAfter: number;
  medalAwarded?: "gold" | "silver" | "bronze";
}

export interface TournamentMatch {
  id: string;
  roundName: "1/4 финала" | "Полуфинал" | "Гранд-финал";
  racerA: Racer;
  racerB: Racer;
  winnerId?: string;
  scoreA?: number;
  scoreB?: number;
}
