"use client";

import type { Racer } from "@/lib/arena/types";

interface RaceTrackProps {
  racers?: Racer[];
  player?: Racer;
  rival?: Racer;
}

export function RaceTrack({ racers, player, rival }: RaceTrackProps) {
  const lanes: Racer[] =
    racers && racers.length > 0
      ? racers
      : player && rival
      ? [player, rival]
      : [];

  return (
    <div className="race-arena-track" role="region" aria-label="Гоночная трасса">
      {lanes.map((racer, idx) => {
        const isPlayer = racer.id === "player" || idx === 0;
        const isTeamBlue = racer.team === "blue";
        const isTeamRed = racer.team === "red";

        const laneClass = isPlayer
          ? "race-lane--player"
          : isTeamBlue
          ? "race-lane--teammate"
          : "race-lane--rival";

        return (
          <div key={racer.id || idx} className={`race-lane ${laneClass}`}>
            <div className="race-lane__meta">
              <span className="race-lane__avatar">{racer.avatar}</span>
              <div className="race-lane__info">
                <div className="race-lane__title-row">
                  <span className="race-lane__name">
                    {racer.name} {isPlayer ? "(Вы)" : ""}
                  </span>
                  {racer.team ? (
                    <span
                      className={`team-pill ${
                        isTeamBlue ? "team-pill--blue" : "team-pill--red"
                      }`}
                    >
                      {isTeamBlue ? "🔵 Синие" : "🔴 Красные"}
                    </span>
                  ) : null}
                  {racer.chessRank ? (
                    <span className="chess-rank-mini">{racer.chessRank}</span>
                  ) : null}
                </div>
                <span className="race-lane__stat">
                  {racer.cpm} CPM {racer.rating ? `· ${racer.rating} Elo` : ""}
                </span>
              </div>
            </div>

            <div className="race-lane__track-rail">
              <div
                className={`race-lane__car ${isPlayer ? "" : "race-lane__car--rival"}`}
                style={{
                  left: `${Math.min(96, Math.max(0, racer.progressPercent))}%`,
                }}
              >
                <span className="race-lane__vehicle">
                  {isTeamBlue ? "🏎️" : isTeamRed ? "🏎️" : "🏎️"}
                </span>
                <span className="race-lane__pct">
                  {Math.round(racer.progressPercent)}%
                </span>
              </div>
              <div
                className={`race-lane__bar-fill ${
                  isPlayer
                    ? "race-lane__bar-fill--player"
                    : isTeamBlue
                    ? "race-lane__bar-fill--teammate"
                    : "race-lane__bar-fill--rival"
                }`}
                style={{
                  width: `${Math.min(100, Math.max(0, racer.progressPercent))}%`,
                }}
              />
            </div>

            <div className="race-lane__flag" title="Финиш">
              🏁
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default RaceTrack;
