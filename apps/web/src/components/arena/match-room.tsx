"use client";

import { useCallback, useEffect, useEffectEvent, useRef, useState } from "react";
import Link from "next/link";
import { RaceTrack } from "./race-track";
import {
  calculateEloChange,
  create2v2MatchRoster,
  createRivalBot,
  getRandomArenaText,
  getArenaBest,
  saveMatchResult,
} from "@/lib/arena/engine";
import type { MatchMode, Racer, TimeControl } from "@/lib/arena/types";
import {
  getChessRank,
  addXpAndCoins,
  awardMedal,
  getCurrentUser,
  unlockAchievement, advanceCampaign, earnDailyReward, SPEED_TITLES,
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

  const [currentUser, setCurrentUser] = useState(getCurrentUser);
  const settled = useRef(false);
  const [recordGain, setRecordGain] = useState(0);
  const [dailyWon, setDailyWon] = useState(false);
  const [promotion, setPromotion] = useState("");
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
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [deltaElo, setDeltaElo] = useState<number>(0);
  const [winner, setWinner] = useState<"player" | "rival" | "blue" | "red" | null>(null);

  const attempts = useRef({ total: 0, errors: 0 });
  const startTimeRef = useRef<number | null>(null);
  const botIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // 1. Searching / Matchmaking phase
  useEffect(() => {
    if (phase !== "searching") return;
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
  }, [phase, layout, mode, playerRating, currentUser.nickname, currentUser.avatar]);

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
    (isWin: boolean, finalCpm = player.cpm, finalAccuracy = player.accuracy, correct = Math.round(player.progressPercent * raceText.length / 100)) => {
      if (settled.current) return;
      settled.current = true;
      if (botIntervalRef.current) clearInterval(botIntervalRef.current);
      setPhase("finished");

      const delta = calculateEloChange(playerRating, rival.rating, isWin);
      setDeltaElo(delta);

      if (mode === "2v2") {
        setWinner(isWin ? "blue" : "red");
        updateUserRating(layout, delta, isWin, "2v2");
        if (isWin) {
          unlockAchievement("team_win");

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

            addXpAndCoins(300, 150);
          }
        }
        if (!isWin) updateUserRating(layout, delta, false, "tournament");
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

      advanceCampaign(correct, finalAccuracy, finalCpm);
      setDailyWon(earnDailyReward(correct, finalAccuracy));
      if (correct > 0) for (const code of Object.keys(SPEED_TITLES)) {
        if (finalCpm >= Number(code.slice(6))) unlockAchievement(code);
      }
      const updated = getCurrentUser();
      const newRating = layout === "ru" ? updated.ratingRu : updated.ratingEn;
      const rank = getChessRank(newRating);
      setPromotion(rank.minElo > getChessRank(playerRating).minElo ? rank.title : "");
      setDeltaElo(newRating - playerRating);
      const best = getArenaBest(layout);
      setRecordGain(best > 0 ? Math.max(0, finalCpm - best) : 0);
      saveMatchResult({
        id: `match-${Date.now()}`,
        timestamp: new Date().toISOString(),
        layout,
        mode,
        timeControl,
        textSnippet: raceText.slice(0, 45) + "...",
        myCpm: finalCpm,
        myAccuracy: finalAccuracy,
        rivalName: mode === "2v2" ? "Команда Красных" : rival.name,
        rivalAvatar: mode === "2v2" ? "🏎️" : rival.avatar,
        rivalCpm: rival.cpm,
        isWin,
        deltaElo: newRating - playerRating,
        myRatingAfter: newRating,
        medalAwarded: !isWin || (mode === "tournament" && tournamentStage !== "final") ? undefined : mode === "etude" || mode === "tournament" ? "gold" : "silver",
      });
    },
    [layout, mode, player.progressPercent, player.accuracy, player.cpm, playerRating, raceText, rival, timeControl, tournamentStage]
  );

  useEffect(() => {
    if (phase !== "racing" || !startTimeRef.current) return;
    const duration = timeControl === "bullet" ? 30 : timeControl === "rapid" ? 120 : 60;
    const remaining = Math.max(0, duration - Math.floor((Date.now() - startTimeRef.current) / 1000));
    setSecondsLeft(remaining);
    if (!remaining) {
      const opposition = mode === "2v2" ? Math.max(...teamRed.map(r => r.progressPercent)) : rival.progressPercent;
      handleFinishMatch(player.progressPercent > opposition);
    }
  }, [phase, timeControl, mode, teamRed, rival.progressPercent, player.progressPercent, handleFinishMatch]);

  const finishFromClock = useEffectEvent(() => handleFinishMatch(false));

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
            queueMicrotask(() => finishFromClock());
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
            queueMicrotask(() => finishFromClock());
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
  }, [phase, player.isFinished, raceText.length, mode]);

  // 5. Handle player keystrokes
  const handleInput = (nextBuffer: string) => {
    if (phase !== "racing" || settled.current) return;
    const valid = raceText.startsWith(nextBuffer);
    {
      setInputBuffer(nextBuffer);

      const elapsed = startTimeRef.current
        ? Math.max(0.5, (Date.now() - startTimeRef.current) / 1000)
        : 1;
      const added = Math.max(0, nextBuffer.length - inputBuffer.length);
      attempts.current.total += added;
      for (let i = nextBuffer.length - added; i < nextBuffer.length; i++) {
        if (nextBuffer[i] !== raceText[i]) attempts.current.errors++;
      }
      const accuracy = attempts.current.total ? Math.round(100 * (1 - attempts.current.errors / attempts.current.total)) : 100;
      let correct = 0;
      while (correct < nextBuffer.length && nextBuffer[correct] === raceText[correct]) correct++;
      const currentCpm = Math.round(correct * 60 / elapsed);
      const progressPct = correct / raceText.length * 100;

      setPlayer((prev) => ({
        ...prev,
        accuracy, cpm: currentCpm,
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
      if (valid && nextBuffer.length === raceText.length) {
        handleFinishMatch(true, currentCpm, accuracy, correct);
      }
    }
  };

  const restartRace = () => {
    setCurrentUser(getCurrentUser());
    settled.current = false;
    attempts.current = { total: 0, errors: 0 };
    setPromotion("");
    setDailyWon(false);
    setInputBuffer("");
    setRaceText(getRandomArenaText(layout, mode));
    setWinner(null);
    setPlayer((prev) => ({ ...prev, progressPercent: 0, cpm: 0, isFinished: false }));
    setRival(createRivalBot(playerRating, layout));
    setCountdown(3);
    setPhase("searching");
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
              ? "ИСПЫТАНИЕ ТОЧНОСТИ"
              : "РЕЙТИНГОВАЯ ДУЭЛЬ 1 НА 1"}
          </span>
          <span className="room-time-badge">
            {timeControl === "bullet" ? "⚡ Импульс (30 с)" : timeControl === "rapid" ? "⏳ Марафон (120 с)" : "⏱️ Турбо (60 с)"}
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
          <div aria-hidden="true" className="kinetic-keys">{(layout === "ru" ? ["Ф","Ы","В","А"] : ["A","S","D","F"]).map(key => <i key={key}>{key}</i>)}</div>
          <span key={countdown} className="countdown-number">{countdown}</span>
          <p className="countdown-hint">Приготовьте пальцы на исходной позиции (ФЫВА / ОЛДЖ)!</p>
        </div>
      ) : null}

      {/* Active Race Track */}
      {phase === "racing" || phase === "finished" ? (
        <div className="match-live-section">
          {/* Visual Dual/Quad Race Track */}
          <RaceTrack racers={allRacersList} />

          <p className="room-time-badge">{phase === "racing" ? `До финиша · ${secondsLeft} с` : "Финиш"}</p>
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
                    {char}
                  </span>
                );
              })}
            </p>

            <input
              ref={inputRef}
              type="text"
              value={inputBuffer}
              onChange={(event) => handleInput(event.target.value)}
              onPaste={(event) => event.preventDefault()}
              onDrop={(event) => event.preventDefault()}
              maxLength={raceText.length}
              autoComplete="off" autoCapitalize="off" autoCorrect="off" spellCheck={false}
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
            {dailyWon && <p className="quest-award" role="status">✦ Задание дня выполнено · +30 монет</p>}
            {promotion && <p className="arena-promotion" role="status">Новый ранг · {promotion}</p>}
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
            {recordGain > 0 && <div className="record-reveal" role="status"><span aria-hidden="true">{raceText.slice(-5)}</span><strong>+{recordGain}</strong> знаков/мин к личному рекорду</div>}
            <p className="result-modal-desc">
              {winner === "player" || winner === "blue"
                ? mode === "tournament"
                  ? (tournamentStage === "final" ? "Вы выиграли финал Кубка импульса." : "Вы прошли в следующий раунд.")
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
            {(winner === "player" || winner === "blue") && (mode !== "tournament" || tournamentStage === "final") ? (
              <div className="result-medal-award-box">
                <span className="award-medal-icon">
                  {mode === "tournament" && tournamentStage === "final" ? "🥇" : mode === "etude" ? "🥇" : "🥈"}
                </span>
                <div>
                  <h4 className="award-title">
                    {mode === "tournament" && tournamentStage === "final"
                      ? "Золотая медаль чемпионата!"
                      : mode === "etude" ? "Золотая медаль за точность!" : "Серебряная медаль заезда!"}
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
                  onClick={() => { setTournamentStage("quarter"); restartRace(); }}
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
