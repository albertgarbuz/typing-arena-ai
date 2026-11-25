"use client";

import "./race.css";

import { useMemo, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { MatchRoom } from "@/components/arena/match-room";
import { getMatchHistory } from "@/lib/arena/engine";
import type { MatchMode, TimeControl } from "@/lib/arena/types";
import {
  getCurrentUser,
  getDefaultUser,
  getChessRank,
  getLeague,
  getUserRaw,
  getUserServerSnapshot,
  subscribeUser,
  type UserProfile,
} from "@/lib/auth/user";
import type { Layout } from "@/lib/typing/types";
import { IconArrowRight } from "@/components/icons";

export default function ArenaLobbyPage() {
  const [layout, setLayout] = useState<Layout>("ru");
  const [mode, setMode] = useState<MatchMode>("1v1");
  const [timeControl, setTimeControl] = useState<TimeControl>("blitz");
  const [inMatch, setInMatch] = useState(false);

  // Sync user profile
  const userRaw = useSyncExternalStore(subscribeUser, getUserRaw, getUserServerSnapshot);
  const user: UserProfile = useMemo(() => {
    try {
      const parsed = JSON.parse(userRaw);
      return {
        ...getDefaultUser(),
        ...parsed,
      };
    } catch {
      return getCurrentUser();
    }
  }, [userRaw]);

  const rating = layout === "ru" ? user.ratingRu : user.ratingEn;
  const league = getLeague(rating);
  const chessRank = getChessRank(rating);
  const history = getMatchHistory();

  const startSelectedMatch = (selectedMode: MatchMode) => {
    setMode(selectedMode);
    setInMatch(true);
  };

  if (inMatch) {
    return (
      <>
        <SiteHeader />
        <main id="main-content" className="arena-page-main">
          <div className="layout-container">
            <MatchRoom
              layout={layout}
              mode={mode}
              timeControl={timeControl}
              onExit={() => setInMatch(false)}
            />
          </div>
        </main>
        <SiteFooter />
      </>
    );
  }

  return (
    <>
      <SiteHeader />
      <main id="main-content" className="arena-page-main">
        <div className="layout-container arena-shell">
          {/* Top Banner */}
          <div className="arena-hero-banner">
            <div className="arena-hero-banner__text">
              <span className="eyebrow">КИБЕРСПОРТИВНАЯ АРЕНА</span>
              <h1 className="arena-title">Клавогоночная Арена</h1>
              <p className="arena-lead">
                Тренируйтесь с ботами в дуэлях, командных заездах и турнирной сетке.
                Для игры с другом отправьте ссылку на испытание.
              </p>
            </div>

            <div className="velocity-stage" aria-hidden="true">
              {(layout === "ru" ? ["Й", "Ц", "У", "К"] : ["Q", "W", "E", "R"]).map(letter =>
                <span className="velocity-lane" key={letter}><i>{letter}</i></span>
              )}
            </div>
            {/* User League & Rank Widget */}
            <div className="arena-rank-card">
              <div className="arena-rank-card__badge" style={{ borderColor: chessRank.color }}>
                <span className="arena-rank-card__icon">🏆</span>
                <div className="arena-rank-card__info">
                  <span className="arena-rank-card__league" style={{ color: chessRank.color }}>
                    {chessRank.title}
                  </span>
                  <span className="arena-rank-card__elo">
                    {rating} очков · {league.name}
                  </span>
                </div>
              </div>

              {/* Layout Switcher */}
              <div className="layout-tabs" role="tablist" aria-label="Выбор раскладки">
                <button
                  type="button"
                  role="tab"
                  aria-selected={layout === "ru"}
                  onClick={() => setLayout("ru")}
                  className={`layout-tabs__tab ${
                    layout === "ru" ? "layout-tabs__tab--active" : ""
                  }`}
                >
                  <span className="layout-tabs__code">RU</span>
                  <span className="layout-tabs__name">ЙЦУКЕН</span>
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={layout === "en"}
                  onClick={() => setLayout("en")}
                  className={`layout-tabs__tab ${
                    layout === "en" ? "layout-tabs__tab--active" : ""
                  }`}
                >
                  <span className="layout-tabs__code">EN</span>
                  <span className="layout-tabs__name">QWERTY</span>
                </button>
              </div>
            </div>
          </div>

          {/* Chess Time Control Selector */}
          <div className="chess-time-controls-panel">
            <span className="time-controls-label">Длительность заезда:</span>
            <div className="time-controls-buttons" role="radiogroup">
              <button
                type="button"
                onClick={() => setTimeControl("bullet")}
                className={`time-control-pill ${
                  timeControl === "bullet" ? "time-control-pill--active" : ""
                }`}
              >
                ⚡ Импульс (30 сек)
              </button>
              <button
                type="button"
                onClick={() => setTimeControl("blitz")}
                className={`time-control-pill ${
                  timeControl === "blitz" ? "time-control-pill--active" : ""
                }`}
              >
                ⏱️ Турбо (60 сек)
              </button>
              <button
                type="button"
                onClick={() => setTimeControl("rapid")}
                className={`time-control-pill ${
                  timeControl === "rapid" ? "time-control-pill--active" : ""
                }`}
              >
                ⏳ Марафон (120 сек)
              </button>
            </div>
          </div>

          {/* Competitive Modes Grid */}
          <div className="arena-modes-grid">
            {/* Mode 1: 1v1 Ranked Duel */}
            <div className="arena-mode-card arena-mode-card--highlight">
              <div className="arena-mode-card__top">
                <span className="mode-badge-live">ДУЭЛЬ 1 НА 1</span>
                <span className="mode-icon">⚡</span>
              </div>
              <h2 className="arena-mode-card__title">Дуэль скорости</h2>
              <p className="arena-mode-card__desc">
                Поединок один на один с ботом. Результат сохраняется в вашем браузере.
              </p>
              <button
                type="button"
                onClick={() => startSelectedMatch("1v1")}
                className="button button--primary arena-btn-play"
              >
                <span>Начать дуэль</span>
                <IconArrowRight size={18} />
              </button>
            </div>

            {/* Mode 2: 2v2 Team Battle */}
            <div className="arena-mode-card arena-mode-card--team">
              <div className="arena-mode-card__top">
                <span className="mode-badge">КОМАНДЫ 2Х2</span>
                <span className="mode-icon">🤝</span>
              </div>
              <h2 className="arena-mode-card__title">Командный шторм 2 на 2</h2>
              <p className="arena-mode-card__desc">
                Вы и бот-напарник против команды ботов. Побеждает команда с большей суммарной скоростью.
              </p>
              <button
                type="button"
                onClick={() => startSelectedMatch("2v2")}
                className="button button--primary arena-btn-play"
              >
                <span>Командный бой 2х2</span>
                <IconArrowRight size={18} />
              </button>
            </div>

            {/* Mode 3: Weekly Grand Prix Tournament */}
            <div className="arena-mode-card arena-mode-card--tournament">
              <div className="arena-mode-card__top">
                <span className="mode-badge mode-badge--gold">ТУРНИР НЕДЕЛИ</span>
                <span className="mode-icon">🏆</span>
              </div>
              <h2 className="arena-mode-card__title">Кубок Импульса</h2>
              <p className="arena-mode-card__desc">
                Тренировочная сетка с ботами: 1/4 финала → Полуфинал → Гранд-финал.
                Победитель забирает Золотую медаль 🥇, Кубок 🏆 и +300 монет мастерства.
              </p>
              <button
                type="button"
                onClick={() => startSelectedMatch("tournament")}
                className="button button--primary arena-btn-play"
              >
                <span>Вступить в турнир</span>
                <IconArrowRight size={18} />
              </button>
            </div>

            {/* Mode 4: Chess Keyboard Etude */}
            <div className="arena-mode-card">
              <div className="arena-mode-card__top">
                <span className="mode-badge">ТАКТИКА ДНЯ</span>
                <span className="mode-icon">♟️</span>
              </div>
              <h2 className="arena-mode-card__title">Испытание точности</h2>
              <p className="arena-mode-card__desc">
                Тактическая связка повышенной сложности: редкие знаки и пунктуация.
                Требуется 100% точность для победы.
              </p>
              <button
                type="button"
                onClick={() => startSelectedMatch("etude")}
                className="button button--secondary arena-btn-play"
              >
                <span>Начать испытание</span>
                <IconArrowRight size={18} />
              </button>
            </div>

            <div className="arena-mode-card arena-mode-card--fullwidth">
              <h2 className="arena-mode-card__title">Вызвать друга</h2>
              <p className="arena-mode-card__desc">
                Пройдите тест и поделитесь ссылкой. Друг получит тот же текст и сможет сравнить результат.
              </p>
              <Link href="https://typing-arena-ai.albert-garbuz89.chatgpt.site/duel/" className="button button--primary">Дуэль в реальном времени</Link>
              <Link href="https://typing-arena-ai.albert-garbuz89.chatgpt.site/challenge/" className="button button--secondary">Открыть испытание</Link>
            </div>
          </div>

          {/* History of Recent Races */}
          <div className="arena-history-section">
            <h2 className="arena-history-title">История последних заездов</h2>

            {history.length > 0 ? (
              <div className="arena-history-list">
                {history.map((m) => (
                  <div
                    key={m.id}
                    className={`history-race-item ${
                      m.isWin ? "history-race-item--win" : "history-race-item--loss"
                    }`}
                  >
                    <div className="history-race-item__left">
                      <span className="history-race-badge">
                        {m.isWin ? "ПОБЕДА" : "ПОРАЖЕНИЕ"}
                      </span>
                      {m.medalAwarded ? (
                        <span className="history-medal-badge" title="Заработанная медаль">
                          {m.medalAwarded === "gold" ? "🥇" : "🥈"}
                        </span>
                      ) : null}
                      <span className="history-race-rival">
                        против <strong>{m.rivalName}</strong> ({m.rivalAvatar})
                      </span>
                    </div>

                    <div className="history-race-item__stats">
                      <span>Ваш CPM: <strong>{m.myCpm}</strong></span>
                      <span>CPM соперника: <strong>{m.rivalCpm}</strong></span>
                      <span
                        className={`history-race-elo ${
                          m.deltaElo >= 0 ? "elo-plus" : "elo-minus"
                        }`}
                      >
                        {m.deltaElo >= 0 ? `+${m.deltaElo}` : m.deltaElo} очков
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="arena-history-empty">
                <p>Вы пока не провели ни одной гонки на Арене.</p>
                <p className="subtext">
                  Выберите режим выше и проверьте свою скорость в соревновании с равными соперниками!
                </p>
              </div>
            )}
          </div>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
