"use client";

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
  const [privateRoomCode, setPrivateRoomCode] = useState("");
  const [isCreatingRoom, setIsCreatingRoom] = useState(false);

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
                Соревнуйтесь в реальном времени с живыми соперниками, собирайте команду 2х2
                или сражайтесь в еженедельном турнире. Шахматный расчет Elo и честные дуэли.
              </p>
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
                    {rating} Elo · {league.name}
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
            <span className="time-controls-label">Шахматный контроль времени:</span>
            <div className="time-controls-buttons" role="radiogroup">
              <button
                type="button"
                onClick={() => setTimeControl("bullet")}
                className={`time-control-pill ${
                  timeControl === "bullet" ? "time-control-pill--active" : ""
                }`}
              >
                ⚡ Буллет (30 сек)
              </button>
              <button
                type="button"
                onClick={() => setTimeControl("blitz")}
                className={`time-control-pill ${
                  timeControl === "blitz" ? "time-control-pill--active" : ""
                }`}
              >
                ⏱️ Блиц (60 сек)
              </button>
              <button
                type="button"
                onClick={() => setTimeControl("rapid")}
                className={`time-control-pill ${
                  timeControl === "rapid" ? "time-control-pill--active" : ""
                }`}
              >
                ⏳ Рапид (120 сек)
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
              <h2 className="arena-mode-card__title">Рейтинговый заезд</h2>
              <p className="arena-mode-card__desc">
                Классический поединок один на один с соперником вашей весовой категории.
                Победа повышает Elo и дарует серебряные медали.
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
              <h2 className="arena-mode-card__title">Командная битва 2 на 2</h2>
              <p className="arena-mode-card__desc">
                Сражайтесь в тандеме! Вы и напарник (Синие болиды) против команды соперников
                (Красные болиды). Суммарная скорость решает исход.
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
              <h2 className="arena-mode-card__title">Еженедельный Гран-при</h2>
              <p className="arena-mode-card__desc">
                Сетка на выбывание: 1/4 финала → Полуфинал → Гранд-финал.
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
              <h2 className="arena-mode-card__title">Шахматный этюд</h2>
              <p className="arena-mode-card__desc">
                Тактическая связка повышенной сложности: редкие знаки, пунктуация и шахматная нотация.
                Требуется 100% точность для победы.
              </p>
              <button
                type="button"
                onClick={() => startSelectedMatch("etude")}
                className="button button--secondary arena-btn-play"
              >
                <span>Решить этюд</span>
                <IconArrowRight size={18} />
              </button>
            </div>

            {/* Mode 5: Duel with Friend / Private Room */}
            <div className="arena-mode-card arena-mode-card--fullwidth">
              <div className="arena-mode-card__top">
                <span className="mode-badge">ИГРА С ДРУЗЬЯМИ</span>
                <span className="mode-icon">👥</span>
              </div>
              <h2 className="arena-mode-card__title">Приватная комната с друзьями</h2>
              <p className="arena-mode-card__desc">
                Создайте закрытую дуэль и отправьте код другу для заезда в одной сети Wi-Fi или через интернет.
              </p>

              {!isCreatingRoom ? (
                <div className="arena-room-actions">
                  <button
                    type="button"
                    onClick={() => {
                      const code = Math.random().toString(36).substring(2, 7).toUpperCase();
                      setPrivateRoomCode(code);
                      setIsCreatingRoom(true);
                    }}
                    className="button button--secondary"
                  >
                    <span>Сгенерировать код комнаты</span>
                  </button>
                </div>
              ) : (
                <div className="private-room-box">
                  <div className="private-room-code-badge">
                    Код комнаты: <strong>{privateRoomCode}</strong>
                  </div>
                  <p className="private-room-hint">
                    Друг может ввести этот код и мгновенно подключиться к вашему заезду!
                  </p>
                  <button
                    type="button"
                    onClick={() => startSelectedMatch("1v1")}
                    className="button button--primary"
                  >
                    <span>Запустить гонку с другом</span>
                    <IconArrowRight size={16} />
                  </button>
                </div>
              )}
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
                        {m.deltaElo >= 0 ? `+${m.deltaElo}` : m.deltaElo} Elo
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
