"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { RaceTrack } from "./race-track";
import {
  calculateEloChange,
  create2v2MatchRoster,
  createRivalBot,
  getRandomArenaText,
  saveMatchResult,
} from "@/lib/arena/engine";
import type { MatchMode, Racer, TimeControl } from "@/lib/arena/types";
import {
  addXpAndCoins,
  awardMedal,
  getCurrentUser,
  unlockAchievement,
  updateUserRating,
} from "@/lib/auth/user";
import type { Layout } from "@/lib/typing/types";
import { IconArrowRight, IconCheck, IconRepeat, IconTarget } from "@/components/icons";

interface MatchRoomProps {
  layout: Layout;
  mode?: MatchMode;
  timeControl?: TimeControl;
  onExit: () => void;
}

type MatchPhase = "searching" | "countdown" | "racing" | "finished";

export function MatchRoom({
  layout,
  mode = "1v1",
  timeControl = "blitz",
  onExit,
}: MatchRoomProps) {
  const [phase, setPhase] = useState<MatchPhase>("searching");
  const [countdown, setCountdown] = useState(3);

  // Tournament stage state
  const [tournamentStage, setTournamentStage] = useState<"quarter" | "semi" | "final">("quarter");

  const currentUser = getCurrentUser();
  const playerRating = layout === "ru" ? currentUser.ratingRu : currentUser.ratingEn;

  // Single player racer
  const [player, setPlayer] = useState<Racer>({
    id: "player",
    name: currentUser.nickname,
    avatar: currentUser.avatar,
    rating: playerRating,
    progressPercent: 0,
    cpm: 0,
    accuracy: 100,
    isFinished: false,
    team: "blue",
  });

  // 1v1 Rival bot
  const [rival, setRival] = useState<Racer>(() => createRivalBot(playerRating, layout));

  // 2v2 Team racers
  const [teamBlue, setTeamBlue] = useState<Racer[]>([]);
  const [teamRed, setTeamRed] = useState<Racer[]>([]);

  // Race text & typing buffer
  const [raceText, setRaceText] = useState(() => getRandomArenaText(layout, mode));
  const [inputBuffer, setInputBuffer] = useState("");
  const [deltaElo, setDeltaElo] = useState<number>(0);
  const [winner, setWinner] = useState<"player" | "rival" | "blue" | "red" | null>(null);

  const startTimeRef = useRef<number | null>(null);
  const botIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // 1. Searching / Matchmaking phase
  useEffect(() => {
    const timer = setTimeout(() => {
      if (mode === "2v2") {
        const roster = create2v2MatchRoster(
          { name: currentUser.nickname, avatar: currentUser.avatar, rating: playerRating },
          layout
        );
        setTeamBlue(roster.teamBlue);
        setTeamRed(roster.teamRed);
      } else {
        setRival(createRivalBot(playerRating, layout));
      }
      setPhase("countdown");
    }, 1500);

    return () => clearTimeout(timer);
  }, [layout, mode, playerRating, currentUser.nickname, currentUser.avatar]);

  // 2. Countdown phase
  useEffect(() => {
    if (phase !== "countdown") return;
    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setPhase("racing");
          startTimeRef.current = Date.now();
          setTimeout(() => inputRef.current?.focus(), 50);
          return 0;
        }
        return prev - 1;
      });
    }, 900);
    return () => clearInterval(interval);
  }, [phase]);

  // 3. Finish Match handler
  const handleFinishMatch = useCallback(
    (isWin: boolean) => {
      if (botIntervalRef.current) clearInterval(botIntervalRef.current);
      setPhase("finished");

      const delta = calculateEloChange(playerRating, rival.rating, isWin);
      setDeltaElo(delta);

      if (mode === "2v2") {
        setWinner(isWin ? "blue" : "red");
        updateUserRating(layout, delta, isWin, "2v2");
        if (isWin) {
          unlockAchievement("team_win");
          awardMedal("silver");
        }
      } else if (mode === "tournament") {
        setWinner(isWin ? "player" : "rival");
        if (isWin) {
          if (tournamentStage === "quarter") {
            setDeltaElo(delta);
          } else if (tournamentStage === "semi") {
            setDeltaElo(delta * 2);
          } else if (tournamentStage === "final") {
            updateUserRating(layout, delta * 3, true, "tournament");
            unlockAchievement("tournament_podium");
            awardMedal("gold");
            addXpAndCoins(300, 150);
          }
        }
      } else if (mode === "etude") {
        setWinner(isWin ? "player" : "rival");
        if (isWin) {
          awardMedal("gold");
          unlockAchievement("chess_etude");
          addXpAndCoins(100, 50);
        }
      } else {
        // Standard 1v1
        setWinner(isWin ? "player" : "rival");
        updateUserRating(layout, delta, isWin, "1v1");
      }

      saveMatchResult({
        id: `match-${Date.now()}`,
        timestamp: new Date().toISOString(),
        layout,
        mode,
        timeControl,
        textSnippet: raceText.slice(0, 45) + "...",
        myCpm: player.cpm,
        myAccuracy: player.accuracy,
        rivalName: mode === "2v2" ? "Команда Красных" : rival.name,
        rivalAvatar: mode === "2v2" ? "🏎️" : rival.avatar,
        rivalCpm: rival.cpm,
        isWin,
        deltaElo: delta,
        myRatingAfter: playerRating + delta,
        medalAwarded: isWin ? (mode === "tournament" ? "gold" : "silver") : undefined,
      });
    },
    [layout, mode, player.accuracy, player.cpm, playerRating, raceText, rival, timeControl, tournamentStage]
  );

  // 4. Bot progress loop
  useEffect(() => {
    if (phase !== "racing") return;

    botIntervalRef.current = setInterval(() => {
      const textLen = raceText.length;

      if (mode === "2v2") {
        // Update teammate and 2 rivals
        setTeamBlue((prev) =>
          prev.map((r) => {
            if (r.id === "player") return r;
            const cpm = r.cpm || 220;
            const step = ((cpm / 60) / textLen) * 100 * 0.3;
            return {
              ...r,
              progressPercent: Math.min(100, r.progressPercent + step),
            };
          })
        );

        setTeamRed((prev) => {
          let redFinishedFirst = false;
          const updated = prev.map((r) => {
            const step = ((r.cpm / 60) / textLen) * 100 * 0.3;
            const nextPct = Math.min(100, r.progressPercent + step);
            if (nextPct >= 100) redFinishedFirst = true;
            return { ...r, progressPercent: nextPct };
          });

          if (redFinishedFirst && !player.isFinished) {
            setTimeout(() => handleFinishMatch(false), 200);
          }
          return updated;
        });
      } else {
        // 1v1 / tournament / etude bot progress
        setRival((prev) => {
          if (prev.progressPercent >= 100) {
            clearInterval(botIntervalRef.current!);
            return prev;
          }

          const charsPerSecond = prev.cpm / 60;
          const pctPerTick = (charsPerSecond / textLen) * 100 * 0.3;
          const nextPct = Math.min(100, prev.progressPercent + pctPerTick);

          if (nextPct >= 100 && !player.isFinished) {
            setTimeout(() => handleFinishMatch(false), 200);
          }

          return {
            ...prev,
            progressPercent: nextPct,
            isFinished: nextPct >= 100,
          };
        });
      }
    }, 300);

    return () => {
      if (botIntervalRef.current) clearInterval(botIntervalRef.current);
    };
  }, [phase, player.isFinished, raceText.length, mode, handleFinishMatch]);

  // 5. Handle player keystrokes
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (phase !== "racing") return;

    if (e.key === "Backspace") {
      e.preventDefault();
      if (inputBuffer.length > 0) {
        setInputBuffer((prev) => prev.slice(0, -1));
      }
      return;
    }

    if (e.key.length > 1 || e.ctrlKey || e.altKey || e.metaKey) return;
    e.preventDefault();

    const nextChar = e.key;
    const currentIndex = inputBuffer.length;
    const expectedChar = raceText[currentIndex];

    if (nextChar === expectedChar) {
      const nextBuffer = inputBuffer + nextChar;
      setInputBuffer(nextBuffer);

      const elapsed = startTimeRef.current
        ? Math.max(0.5, (Date.now() - startTimeRef.current) / 1000)
        : 1;
      const currentCpm = Math.round((nextBuffer.length * 60) / elapsed);
      const progressPct = (nextBuffer.length / raceText.length) * 100;

      setPlayer((prev) => ({
        ...prev,
        cpm: currentCpm,
        progressPercent: progressPct,
        isFinished: progressPct >= 100,
      }));

      // In 2v2, update player in teamBlue
      if (mode === "2v2") {
        setTeamBlue((prev) =>
          prev.map((r) =>
            r.id === "player"
              ? { ...r, cpm: currentCpm, progressPercent: progressPct, isFinished: progressPct >= 100 }
              : r
          )
        );
      }

      // Player won!
      if (nextBuffer.length >= raceText.length) {
        handleFinishMatch(true);
      }
    }
  };

  const restartRace = () => {
    setInputBuffer("");
    setRaceText(getRandomArenaText(layout, mode));
    setWinner(null);
    setPlayer((prev) => ({ ...prev, progressPercent: 0, cpm: 0, isFinished: false }));
    setRival(createRivalBot(playerRating, layout));
    setCountdown(3);
    setPhase("countdown");
  };

  const advanceTournamentRound = () => {
    if (tournamentStage === "quarter") setTournamentStage("semi");
    else if (tournamentStage === "semi") setTournamentStage("final");
    restartRace();
  };

  const allRacersList =
    mode === "2v2" ? [...teamBlue, ...teamRed] : [player, rival];

  return (
    <div className="match-room-container">
      {/* Header bar */}
      <div className="match-room-header">
        <div className="match-room-title-box">
          <span className="room-mode-tag">
            {mode === "2v2"
              ? "КОМАНДНАЯ БИТВА 2 НА 2"
              : mode === "tournament"
              ? `ЕЖЕНЕДЕЛЬНЫЙ ГРАН-ПРИ (${
                  tournamentStage === "quarter"
                    ? "1/4 ФИНАЛА"
                    : tournamentStage === "semi"
                    ? "ПОЛУФИНАЛ"
                    : "ГРАНД-ФИНАЛ"
                })`
              : mode === "etude"
              ? "ШАХМАТНЫЙ ЭТЮД ДНЯ"
              : "РЕЙТИНГОВАЯ ДУЭЛЬ 1 НА 1"}
          </span>
          <span className="room-time-badge">
            {timeControl === "bullet" ? "⚡ Буллет (30 с)" : timeControl === "rapid" ? "⏳ Рапид (120 с)" : "⏱️ Блиц (60 с)"}
          </span>
        </div>

        <button type="button" onClick={onExit} className="button button--secondary match-room-exit-btn">
          Покинуть арену
        </button>
      </div>

      {/* Searching phase */}
      {phase === "searching" ? (
        <div className="match-searching-overlay">
          <div className="searching-radar">
            <div className="radar-circle" />
            <span className="radar-icon">📡</span>
          </div>
          <h2 className="searching-title">
            {mode === "2v2"
              ? "Подбор напарника и команды соперников..."
              : mode === "tournament"
              ? "Жеребьёвка турнирной сетки..."
              : "Поиск равного соперника по Elo..."}
          </h2>
          <p className="searching-subtitle">
            Калибровка рейтинга: {playerRating} Elo · Раскладка: {layout.toUpperCase()}
          </p>
        </div>
      ) : null}

      {/* Countdown overlay */}
      {phase === "countdown" ? (
        <div className="match-countdown-overlay">
          <span className="countdown-number">{countdown}</span>
          <p className="countdown-hint">Приготовьте пальцы на исходной позиции (ФЫВА / ОЛДЖ)!</p>
        </div>
      ) : null}

      {/* Active Race Track */}
      {phase === "racing" || phase === "finished" ? (
        <div className="match-live-section">
          {/* Visual Dual/Quad Race Track */}
          <RaceTrack racers={allRacersList} />

          {/* Typing Text Box */}
          <div className="arena-race-box">
            <p className="arena-target-text" aria-label="Текст для набора">
              {raceText.split("").map((char, index) => {
                let statusClass = "char-pending";
                if (index < inputBuffer.length) {
                  statusClass =
                    inputBuffer[index] === char ? "char-correct" : "char-wrong";
                } else if (index === inputBuffer.length) {
                  statusClass = "char-current";
                }

                return (
                  <span key={index} className={`race-char ${statusClass}`}>
                    {char === " " ? "␣" : char}
                  </span>
                );
              })}
            </p>

            <input
              ref={inputRef}
              type="text"
              value=""
              onChange={() => {}}
              onKeyDown={handleKeyDown}
              className="arena-live-input"
              autoFocus
              aria-label="Поле набора текста для дуэли"
              placeholder={phase === "racing" ? "Печатайте текст здесь..." : "Заезд завершён"}
              disabled={phase !== "racing"}
            />
          </div>
        </div>
      ) : null}

      {/* Match Result Overlay */}
      {phase === "finished" ? (
        <div className="match-result-modal-backdrop">
          <div className="match-result-modal">
            <div className="result-modal-icon">
              {winner === "player" || winner === "blue" ? "🏆" : "🏎️"}
            </div>
            <h2 className="result-modal-title">
              {winner === "player" || winner === "blue"
                ? mode === "tournament" && tournamentStage === "final"
                  ? "ЧЕМПИОН ЕЖЕНЕДЕЛЬНОГО ТУРНИРА!"
                  : "ПОБЕДА В ЗАЕЗДЕ!"
                : "ПОРАЖЕНИЕ В ЗАЕЗДЕ"}
            </h2>
            <p className="result-modal-desc">
              {winner === "player" || winner === "blue"
                ? mode === "tournament"
                  ? "Блестящая победа в раунде плей-офф! Рейтинг и медали зачислены."
                  : "Вы пришли к финишу первым благодаря чистому темпу и точности."
                : "Соперник оказался быстрее на долю секунды. Проанализируйте темп и возьмите реванш!"}
            </p>

            <div className="result-stats-row">
              <div className="result-stat-chip">
                <span className="stat-label">Ваша скорость</span>
                <span className="stat-val">{player.cpm} CPM</span>
              </div>
              <div className="result-stat-chip">
                <span className="stat-label">
                  {mode === "2v2" ? "Команда соперников" : "Соперник"}
                </span>
                <span className="stat-val">{rival.cpm} CPM</span>
              </div>
              <div className="result-stat-chip">
                <span className="stat-label">Изменение Elo</span>
                <span className={`stat-val ${deltaElo >= 0 ? "elo-plus" : "elo-minus"}`}>
                  {deltaElo >= 0 ? `+${deltaElo}` : deltaElo} Elo
                </span>
              </div>
            </div>

            {/* Medals awarded */}
            {(winner === "player" || winner === "blue") ? (
              <div className="result-medal-award-box">
                <span className="award-medal-icon">
                  {mode === "tournament" && tournamentStage === "final" ? "🥇" : "🥈"}
                </span>
                <div>
                  <h4 className="award-title">
                    {mode === "tournament" && tournamentStage === "final"
                      ? "Золотая медаль чемпионата!"
                      : "Серебряная медаль дуэли!"}
                  </h4>
                  <p className="award-sub">Трофей добавлен в вашу коллекцию на полку медалей в Профиле.</p>
                </div>
              </div>
            ) : null}

            <div className="result-modal-actions">
              {mode === "tournament" && (winner === "player") && tournamentStage !== "final" ? (
                <button
                  type="button"
                  onClick={advanceTournamentRound}
                  className="button button--primary"
                >
                  <span>Следующий раунд ({tournamentStage === "quarter" ? "Полуфинал" : "Финал"})</span>
                  <IconArrowRight size={16} />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={restartRace}
                  className="button button--primary"
                >
                  <IconRepeat size={16} />
                  <span>Ещё один заезд</span>
                </button>
              )}

              <button
                type="button"
                onClick={onExit}
                className="button button--secondary"
              >
                Вернуться в лобби
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default MatchRoom;
