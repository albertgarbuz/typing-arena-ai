"use client";

import { useEffect, useRef, useMemo, useState, useSyncExternalStore } from "react";
import { getArenaBest, getMatchHistory } from "@/lib/arena/engine";
import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import {
  ACHIEVEMENTS_LIST, ACHIEVEMENT_GROUPS, MILESTONES, milestoneValue,
  getDefaultUser,
  getChessRank,
  getLeague,
  getUserRaw,
  getUserServerSnapshot,
  loginWithEmail,
  loginWithGoogle,
  logoutUser,
  saveUser,
  CAMPAIGN, dailyGoal, earnedTitles, selectToy, TOYS, SPEED_TITLES,
  SHOP_AVATARS,
  SHOP_TITLES,
  subscribeUser,
  unlockAvatar,
  unlockTitle,
  type UserProfile,
} from "@/lib/auth/user";
import { getProgressRaw, subscribeStorage } from "@/lib/typing/storage";
import { IconArrowRight, IconCheck, IconTarget } from "@/components/icons";

export default function ProfilePage() {
  const userRaw = useSyncExternalStore(subscribeUser, getUserRaw, getUserServerSnapshot);
  const user: UserProfile = useMemo(() => {
    try {
      const parsed = JSON.parse(userRaw);
      const def = getDefaultUser();
      return {
        ...def,
        ...parsed,
        medals: { ...def.medals, ...(parsed?.medals || {}) },
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
  }, [userRaw]);

  const [cardLink,setCardLink] = useState("");
  const portrait = useSyncExternalStore(subscribeStorage, () => {
    try {
      const key = [user.authProvider || "guest",user.email || user.id || "guest",user.createdAt || ""].join("/");
      const album = JSON.parse(localStorage.getItem("typing-arena-club-v1/"+key) || "{}").media;
      const photo = Array.isArray(album) && album.find(item=>item?.kind==="photo")?.url;
      return typeof photo === "string" && /^data:image\/jpeg;base64,/.test(photo) ? photo : "";
    } catch { return ""; }
  }, () => "");
  const goal = dailyGoal();
  const toy = TOYS.find(item => item.id === user.activeToy);
  const [play, setPlay] = useState(0);

  // Editing state
  const [isEditing, setIsEditing] = useState(false);
  const [nicknameInput, setNicknameInput] = useState(user.nickname);
  const [bioInput, setBioInput] = useState(user.bio || "");
  const [goalCpmInput, setGoalCpmInput] = useState(user.goalCpm);
  const [selectedAvatar, setSelectedAvatar] = useState(user.avatar);
  const [selectedTitle, setSelectedTitle] = useState(user.activeTitle);

  // Auth modal state
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<"google" | "email">("google");
  const [emailForm, setEmailForm] = useState({ nickname: "", email: "", password: "", agree: true });
  const [authSuccessNotice, setAuthSuccessNotice] = useState("");

  // Active profile subtab
  const socialFrame = useRef<HTMLIFrameElement>(null);
  const [socialHeight, setSocialHeight] = useState(420);
  useEffect(() => {
    const resize = (event: MessageEvent) => {
      if (event.origin===location.origin && event.source===socialFrame.current?.contentWindow &&
          event.data?.type==="arena-profile-height" && Number.isFinite(event.data.height))
        setSocialHeight(Math.min(1600, Math.max(220,Math.ceil(event.data.height)+4)));
    };
    window.addEventListener("message",resize);
    return ()=>window.removeEventListener("message",resize);
  },[]);
  const [achievementGroup,setAchievementGroup] = useState("Основные");
  const [profileTab, setProfileTab] = useState<"achievements" | "shop" | "chess">("achievements");

  // Exercise Progress
  const progressRaw = useSyncExternalStore(subscribeStorage, getProgressRaw, () => "{}");
  const progress = useMemo(() => {
    try {
      const data = JSON.parse(progressRaw);
      return (data?.completedExercises || {}) as Record<
        string,
        { accuracy: number; cpm: number; passedAt: string }
      >;
    } catch {
      return {};
    }
  }, [progressRaw]);

  const completedLessonsCount = new Set([...Object.keys(progress), ...(user.creditedLessons || [])]).size;

  // Check today's lesson completion
  const todayStr = new Date().toISOString().slice(0, 10);
  const completedToday = Object.values(progress).some(
    (p) => p.passedAt && p.passedAt.startsWith(todayStr)
  );

  const leagueRu = getLeague(user.ratingRu);
  const chessRank = getChessRank(user.ratingRu);

  const best = useSyncExternalStore(subscribeUser, () => getArenaBest("ru"), () => 0);
  const lastDelta = useSyncExternalStore(subscribeUser, () => {
    const [last, previous] = getMatchHistory().filter(r => r.layout === "ru");
    return previous ? last.myCpm - previous.myCpm : null;
  }, () => null);
  const nextRank = [1000,1200,1400,1700,2000].find(value => value > user.ratingRu);
  const xpInCurrentLevel = user.xp % 200;
  const xpNeeded = 200;
  const xpPercent = Math.min(100, Math.round((xpInCurrentLevel / xpNeeded) * 100));

  const winRate =
    user.totalMatches > 0
      ? Math.round((user.wins / user.totalMatches) * 100)
      : 0;

  const handleSaveProfile = () => {
    saveUser({
      ...user,
      nickname: nicknameInput.trim() || user.nickname,
      bio: bioInput.trim() || user.bio,
      avatar: selectedAvatar,
      activeTitle: selectedTitle,
      goalCpm: goalCpmInput,
    });
    setIsEditing(false);
  };

  const handleGoogleAuth = () => {
    loginWithGoogle({
      name: user.nickname !== "Клавогонщик" ? user.nickname : "Алексей Иванов",
      email: "user@gmail.com",
      avatar: "🏎️",
    });
    setShowAuthModal(false);
    setAuthSuccessNotice("Успешный вход через аккаунт Google!");
    setTimeout(() => setAuthSuccessNotice(""), 4000);
  };

  const handleEmailAuth = (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailForm.agree) {
      alert("Необходимо согласиться с договором оферты и обработкой персональных данных.");
      return;
    }
    if (!emailForm.nickname || !emailForm.email) return;

    loginWithEmail({
      nickname: emailForm.nickname.trim(),
      email: emailForm.email.trim(),
    });
    setShowAuthModal(false);
    setAuthSuccessNotice("Регистрация завершена! Профиль активирован.");
    setTimeout(() => setAuthSuccessNotice(""), 4000);
  };

  const handleBuyAvatar = (av: string, cost: number) => {
    if (unlockAvatar(av, cost)) {
      setSelectedAvatar(av);
    } else {
      alert(`Недостаточно монет мастерства. Нужно ${cost} 🪙, а у вас ${user.coins} 🪙.`);
    }
  };

  const handleBuyTitle = (title: string, cost: number) => {
    if (unlockTitle(title, cost)) {
      setSelectedTitle(title);
    } else {
      alert(`Недостаточно монет мастерства. Нужно ${cost} 🪙, а у вас ${user.coins} 🪙.`);
    }
  };

  return (
    <>
      <SiteHeader />
      <main id="main-content" className="profile-page-main">
        <div className="layout-container profile-shell">
          {/* Notification banner */}
          {authSuccessNotice ? (
            <div className="profile-alert profile-alert--success">
              <IconCheck size={16} /> {authSuccessNotice}
            </div>
          ) : null}

          <iframe ref={socialFrame} title="Мой фотопрофиль" src="../club/?profile=1"
            key={user.nickname+user.createdAt} style={{width:"100%",height:socialHeight,border:0,display:"block",marginBottom:"1rem"}} />
          <section className="daily-quest">
            <div><span className="eyebrow">Задание дня · 30 монет</span>
              <h2>{user.dailyAwardDate === goal.day ? "Сегодняшняя награда получена" : "Точный заезд"}</h2>
              <p>За одну попытку напечатай {goal.letters} верных знаков с точностью от 90%.</p>
            </div>
            <Link href="/test" className="button button--primary">Начать заезд →</Link>
          </section>
          <section className="campaign-board">
            <h2>Путь Феникса</h2><p>Точность от 90% приносит зачётные знаки. 200 за день открывают тренировочный день. Для рекорда скорости набери хотя бы 20 верных знаков за попытку. Дни можно пропускать.</p>
            <p><strong>{user.campaign?.days || 0} зачётных дней</strong> · {user.campaign?.characters || 0} знаков · рекорд {user.campaign?.best || 0} зн/мин</p>
            <div className="campaign-rewards">{CAMPAIGN.map(stage => {
              const owned = user.unlockedAvatars.includes(stage.avatar);
              return <article key={stage.days} data-owned={owned}><span>{stage.avatar}</span><h3>{stage.name}</h3>
                <small>Регулярность {Math.min(100, Math.floor((user.campaign?.days || 0) / stage.days * 100))}% · {stage.characters.toLocaleString("ru-RU")} знаков{stage.speed > 0 && " · "+stage.speed+" зн/мин"}</small>
                {owned ? <button className="button button--secondary" disabled={user.avatar === stage.avatar} onClick={() => saveUser({...user, avatar:stage.avatar})}>{user.avatar === stage.avatar ? "Выбран" : "Надеть"}</button> : <strong>Закрыто</strong>}</article>;
            })}</div>
            <button className="button button--secondary" onClick={() => {
              const url = new URL("../card/",window.location.href);
              const data = {n:user.nickname,a:user.avatar,l:user.level,t:user.activeTitle,m:user.medals,
                r:user.unlockedAvatars.filter(av=>CAMPAIGN.some(s=>s.avatar===av)),d:user.campaign?.days || 0,
                h:user.achievements};
              url.hash = encodeURIComponent(JSON.stringify(data));
              setCardLink(url.href);
              navigator.clipboard?.writeText(url.href).catch(()=>{});
            }}>Поделиться уровнем и наградами</button>
            {cardLink && <label className="card-copy">Ссылка на карточку с текущими наградами<input readOnly value={cardLink} onFocus={e=>e.target.select()} /><a href={cardLink}>Посмотреть карточку ↗</a></label>}
          </section>
          {toy && <button type="button" className="toy-display" onClick={() => setPlay(value => value+1)}>
            <span key={play} className={play ? "toy-motion toy-"+toy.id : ""}>{toy.icon}</span> Играть · {toy.name}
          </button>}
          <section className="profile-performance">
            <div><small>Личный рекорд · Русская арена</small><h2>{best || "—"} <small>знаков/мин</small></h2>
              {lastDelta !== null && <p>Последний заезд: {lastDelta > 0 ? "+" : ""}{lastDelta} знаков/мин к предыдущему</p>}
            </div>
            <div>{nextRank ? <><p>До ранга «{getChessRank(nextRank).title}» — {nextRank - user.ratingRu} очков</p>
              <progress aria-label="Прогресс до следующего ранга" value={user.ratingRu-chessRank.minElo} max={nextRank-chessRank.minElo} /></> : <p>Высшая лига · {chessRank.title}</p>}
              <Link href="/arena" className="button button--primary">Продолжить на арене</Link>
            </div>
          </section>
          <p className="profile-transfer"><Link href="/transfer.html">Перенести профиль со старой арены →</Link></p>
          {/* User Hero Header */}
          <div className="profile-hero-card">
            <div className="profile-hero-card__left">
              <div className="profile-avatar-wrapper">
                <span className="profile-avatar">{portrait ? <img className="club-portrait" src={portrait} alt={"Фото игрока "+user.nickname} /> : user.avatar}</span>
                <span className="profile-chess-badge" style={{ background: chessRank.color }}>
                  {chessRank.code}
                </span>
              </div>

              <div className="profile-user-info">
                <div className="profile-name-row">
                  <h1 className="profile-name">{user.nickname}</h1>
                  <span className="profile-active-title">«{user.activeTitle}»</span>

                  <div className="profile-header-actions">
                    <button
                      type="button"
                      onClick={() => {
                        setNicknameInput(user.nickname);
                        setBioInput(user.bio || "");
                        setSelectedAvatar(user.avatar);
                        setSelectedTitle(user.activeTitle);
                        setIsEditing(!isEditing);
                      }}
                      className="profile-edit-btn"
                    >
                      {isEditing ? "Отмена" : "⚙️ Редактировать"}
                    </button>

                    {user.authProvider === "guest" ? (
                      <button
                        type="button"
                        onClick={() => setShowAuthModal(true)}
                        className="profile-auth-badge-btn"
                      >
                        Войти / Регистрация
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          if (confirm("Вы уверены, что хотите выйти из учетной записи?")) {
                            logoutUser();
                          }
                        }}
                        className="profile-auth-logout-btn"
                        title="Выйти из аккаунта"
                      >
                        {user.authProvider === "google" ? "Google" : "Email"} · Выйти
                      </button>
                    )}
                  </div>
                </div>

                <p className="profile-bio">{user.bio || "Слепой десятипальцевый метод ввода"}</p>
                <p className="profile-email-meta">{user.email}</p>

                {/* Level, XP and Mastery Coins */}
                <div className="profile-level-box">
                  <div className="level-badge-chip">Уровень {user.level}</div>
                  <div className="xp-bar-wrap">
                    <div className="xp-bar-fill" style={{ width: `${xpPercent}%` }} />
                  </div>
                  <span className="xp-text">
                    {xpInCurrentLevel} / {xpNeeded} XP
                  </span>

                  <div className="coins-balance-pill" title="Баллы мастерства за уроки и победы">
                    🪙 {user.coins} монет
                  </div>
                </div>
              </div>
            </div>

            {/* Daily Streak & Quest Widget */}
            <div className="daily-streak-card">
              <div className="streak-header">
                <span className="streak-flame">🔥</span>
                <div>
                  <span className="streak-title">Ударный режим</span>
                  <span className="streak-count">
                    {user.streakDays} {user.streakDays === 1 ? "день" : "дней"} подряд
                  </span>
                </div>
              </div>

              <div className="daily-quest-item">
                <div className="daily-quest-status">
                  {completedToday ? (
                    <span className="quest-check-done">
                      <IconCheck size={14} /> Выполнено сегодня
                    </span>
                  ) : (
                    <span className="quest-check-pending">Задача на сегодня</span>
                  )}
                </div>
                <p className="daily-quest-desc">
                  Пройти минимум 1 урок в курсе слепой печати с точностью от 95%.
                </p>
                {!completedToday ? (
                  <Link href="/learn" className="button button--primary quest-action-btn">
                    <span>Перейти к уроку</span>
                    <IconArrowRight size={14} />
                  </Link>
                ) : (
                  <p className="quest-success-note">
                    Цель закрыта! +40 XP и +20 монет начислены. Завтра серия продолжится!
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Edit Form Panel */}
          {isEditing ? (
            <div className="profile-edit-panel">
              <h2 className="edit-panel-title">Редактирование профиля</h2>
              <div className="edit-form-grid">
                <div className="form-group">
                  <label htmlFor="user-nickname-input">Никнейм:</label>
                  <input
                    id="user-nickname-input"
                    type="text"
                    value={nicknameInput}
                    onChange={(e) => setNicknameInput(e.target.value)}
                    className="form-input"
                    maxLength={30}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="user-bio-input">Девиз / О себе:</label>
                  <input
                    id="user-bio-input"
                    type="text"
                    value={bioInput}
                    onChange={(e) => setBioInput(e.target.value)}
                    className="form-input"
                    placeholder="Например: Стремлюсь к 400 CPM"
                    maxLength={60}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="user-goal-input">Целевая скорость (CPM):</label>
                  <input
                    id="user-goal-input"
                    type="number"
                    value={goalCpmInput}
                    onChange={(e) => setGoalCpmInput(Number(e.target.value))}
                    className="form-input"
                    min={100}
                    max={800}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="user-title-select">Активный титул:</label>
                  <select
                    id="user-title-select"
                    value={selectedTitle}
                    onChange={(e) => setSelectedTitle(e.target.value)}
                    className="form-select"
                  >
                    {user.unlockedTitles.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group form-group--full">
                  <span className="form-label-span">Выберите аватар из открытых:</span>
                  <div className="avatar-picker">
                    {user.unlockedAvatars.map((av) => (
                      <button
                        key={av}
                        type="button"
                        onClick={() => setSelectedAvatar(av)}
                        className={`avatar-choice ${
                          selectedAvatar === av ? "avatar-choice--active" : ""
                        }`}
                      >
                        {av}
                      </button>
                    ))}
                  </div>
                  <p className="form-hint">
                    Новые аватары и титулы можно разблокировать в Магазине мастерства ниже за монеты.
                  </p>
                </div>
              </div>

              <div className="edit-actions-row">
                <button
                  type="button"
                  onClick={handleSaveProfile}
                  className="button button--primary"
                >
                  <IconCheck size={16} /> Сохранить изменения
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="button button--secondary"
                >
                  Отмена
                </button>
              </div>
            </div>
          ) : null}

          {/* Medals & Stats Dashboard */}
          <div className="profile-dashboard-grid">
            {/* Medals Trophy Shelf */}
            <div className="dashboard-card medals-shelf-card">
              <span className="dashboard-card__eyebrow">НАГРАДЫ И ТРОФЕИ</span>
              <h3 className="dashboard-card__title">Полка медалей</h3>
              <div className="medals-display-row">
                <div className="medal-item medal-item--gold">
                  <span className="medal-icon">🥇</span>
                  <span className="medal-value">{user.medals.gold}</span>
                  <span className="medal-label">Золото</span>
                </div>
                <div className="medal-item medal-item--silver">
                  <span className="medal-icon">🥈</span>
                  <span className="medal-value">{user.medals.silver}</span>
                  <span className="medal-label">Серебро</span>
                </div>
                <div className="medal-item medal-item--bronze">
                  <span className="medal-icon">🥉</span>
                  <span className="medal-value">{user.medals.bronze}</span>
                  <span className="medal-label">Бронза</span>
                </div>
              </div>
              <p className="medals-desc">
                Золотые медали вручаются за 1-е место в еженедельном турнире, 100% точность и серию 7 дней.
              </p>
            </div>

            {/* Chess Rank & Elo */}
            <div className="dashboard-card chess-rank-card">
              <span className="dashboard-card__eyebrow">ЛИГИ СКОРОСТИ</span>
              <div className="chess-rank-top">
                <span className="chess-rank-badge-large" style={{ color: chessRank.color }}>
                  {chessRank.badge}
                </span>
                <div>
                  <h3 className="chess-rank-name">{chessRank.title}</h3>
                  <p className="chess-rank-desc">{chessRank.description}</p>
                </div>
              </div>
              <div className="chess-rank-bottom">
                <div className="elo-metric">
                  <span className="elo-metric__val">{user.ratingRu} Elo</span>
                  <span className="elo-metric__sub">Русская раскладка</span>
                </div>
                <div className="elo-metric">
                  <span className="elo-metric__val">{user.ratingEn} Elo</span>
                  <span className="elo-metric__sub">Английская раскладка</span>
                </div>
              </div>
            </div>

            {/* Course & Arena Stats */}
            <div className="dashboard-card activity-summary-card">
              <span className="dashboard-card__eyebrow">АКТИВНОСТЬ</span>
              <h3 className="dashboard-card__title">Прогресс и боевой опыт</h3>
              <div className="activity-stats-grid">
                <div className="activity-stat">
                  <span className="activity-stat__val">{completedLessonsCount} / 100</span>
                  <span className="activity-stat__lbl">Уроков пройдено</span>
                </div>
                <div className="activity-stat">
                  <span className="activity-stat__val">{user.totalMatches}</span>
                  <span className="activity-stat__lbl">Заездов на Арене</span>
                </div>
                <div className="activity-stat">
                  <span className="activity-stat__val">{user.wins}</span>
                  <span className="activity-stat__lbl">Побед в дуэлях</span>
                </div>
                <div className="activity-stat">
                  <span className="activity-stat__val">{winRate}%</span>
                  <span className="activity-stat__lbl">Винрейт</span>
                </div>
              </div>
            </div>
          </div>

          {/* Tabs: Achievements / Shop / Legal & Security */}
          <div className="profile-tabs-wrapper">
            <div className="profile-tabs-header" role="tablist">
              <button
                type="button"
                role="tab"
                aria-selected={profileTab === "achievements"}
                onClick={() => setProfileTab("achievements")}
                className={`profile-tab-btn ${
                  profileTab === "achievements" ? "profile-tab-btn--active" : ""
                }`}
              >
                🏆 Достижения ({user.achievements.length} / {ACHIEVEMENTS_LIST.length})
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={profileTab === "shop"}
                onClick={() => setProfileTab("shop")}
                className={`profile-tab-btn ${
                  profileTab === "shop" ? "profile-tab-btn--active" : ""
                }`}
              >
                🪙 Магазин мастерства (Баланс: {user.coins} 🪙)
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={profileTab === "chess"}
                onClick={() => setProfileTab("chess")}
                className={`profile-tab-btn ${
                  profileTab === "chess" ? "profile-tab-btn--active" : ""
                }`}
              >
                ⚡ Лиги скорости
              </button>
            </div>

            {/* Tab 1: Achievements */}
            {profileTab === "achievements" ? (
              <><div className="achievement-filters" role="group" aria-label="Категории достижений">
                {ACHIEVEMENT_GROUPS.map(group => <button key={group} type="button" aria-pressed={group===achievementGroup}
                  onClick={()=>setAchievementGroup(group)}>{group}</button>)}
              </div><div className="achievements-grid">
                {ACHIEVEMENTS_LIST.filter(ach => (MILESTONES.find(m=>m.code===ach.code)?.group || "Основные") === achievementGroup).map((ach) => {
                  const milestone = MILESTONES.find(m=>m.code===ach.code);
                  const isUnlocked = user.achievements.includes(ach.code);
                  return (
                    <div
                      key={ach.code}
                      className={`achievement-card ${
                        isUnlocked ? "achievement-card--unlocked" : "achievement-card--locked"
                      }`}
                    >
                      <span className="achievement-icon">{ach.icon}</span>
                      <div className="achievement-body">
                        <div className="achievement-top">
                          <h4 className="achievement-name">{ach.title}</h4>
                          <span className="achievement-rewards">
                            +{ach.xpReward} XP · +{ach.coinReward} 🪙
                          </span>
                        </div>
                        <p className="achievement-desc">{ach.description}</p>
                        {SPEED_TITLES[ach.code] && <strong>Титул «{SPEED_TITLES[ach.code]}»</strong>}
                        {isUnlocked ? (
                          <span className="achievement-status-done">
                            <IconCheck size={12} /> Разблокировано
                          </span>
                        ) : (
                          <span className="achievement-status-locked">{milestone ? `${Math.min(milestone.goal,milestoneValue(user,milestone.metric))} из ${milestone.goal}` : ach.code === "streak_7" ? `${Math.min(user.streakDays, 7)} из 7 дней` : ach.code === "lessons_10" ? `${Math.min(completedLessonsCount, 10)} из 10 упражнений` : "Ещё не открыто"}</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div></>
            ) : null}

            {/* Tab 2: Shop */}
            {profileTab === "shop" ? (
              <div className="shop-section">
                <h3>Коллекционные игрушки</h3>
                <div className="shop-items-grid">{TOYS.map(item => {
                  const owned = user.toys?.includes(item.id);
                  const selected = user.activeToy === item.id;
                  return <div className="shop-item-card" key={item.id}><span className="shop-item-icon">{item.icon}</span>
                    <h4>{item.name}</h4><button className="button button--secondary" type="button"
                      disabled={selected || (!owned && user.coins < item.cost)} onClick={() => selectToy(item.id)}>
                      {selected ? "В профиле" : owned ? "В профиль" : item.cost+" монет"}</button></div>;
                })}</div>
                <div className="shop-header">
                  <h3>Аватары за монеты</h3>
                  <span className="shop-balance">Ваш баланс: {user.coins} 🪙 монет</span>
                </div>
                <div className="shop-items-grid">
                  {SHOP_AVATARS.map((item) => {
                    const isOwned = user.unlockedAvatars.includes(item.avatar);
                    const isSelected = user.avatar === item.avatar;

                    return (
                      <div key={item.avatar} className="shop-item-card">
                        <span className="shop-item-icon">{item.avatar}</span>
                        <h4 className="shop-item-name">{item.name}</h4>
                        <p className="shop-item-desc">{item.description}</p>
                        <div className="shop-item-footer">
                          {isOwned ? (
                            <button
                              type="button"
                              onClick={() => {
                                saveUser({ ...user, avatar: item.avatar });
                              }}
                              className={`button ${
                                isSelected ? "button--primary" : "button--secondary"
                              }`}
                            >
                              {isSelected ? "✓ Выбран" : "Выбрать"}
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleBuyAvatar(item.avatar, item.cost)}
                              className="button button--primary"
                            >
                              Купить за {item.cost} 🪙
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="shop-header" style={{ marginTop: "36px" }}>
                  <h3>Почётные титулы</h3>
                </div>
                <div className="shop-titles-grid">
                  {SHOP_TITLES.map((t) => {
                    const isOwned = user.unlockedTitles.includes(t.title);
                    const isSelected = user.activeTitle === t.title;

                    return (
                      <div key={t.title} className="shop-title-card">
                        <div>
                          <h4 className="shop-title-name">«{t.title}»</h4>
                          <p className="shop-title-desc">{t.description}</p>
                        </div>
                        <div>
                          {isOwned ? (
                            <button
                              type="button"
                              onClick={() => {
                                saveUser({ ...user, activeTitle: t.title });
                              }}
                              className={`button ${
                                isSelected ? "button--primary" : "button--secondary"
                              }`}
                            >
                              {isSelected ? "✓ Активен" : "Установить"}
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleBuyTitle(t.title, t.cost)}
                              className="button button--primary"
                            >
                              Купить за {t.cost} 🪙
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : null}

            {/* Tab 3: Chess Rankings info */}
            {profileTab === "chess" ? (
              <div className="chess-table-section">
                <p className="chess-intro">
                  В Typing Arena AI используется спортивная классификация по рейтингу арены.
                  Участвуйте в дуэлях Импульс (30 с), Турбо (60 с) и Марафон (120 с) на Арене, чтобы
                  повышать звание.
                </p>

                <div className="chess-ladder-grid">
                  {[
                    { code: "Легенда", name: "Легенда арены", elo: "2000+", icon: "👑", color: "#FFD700" },
                    { code: "Сверхновая", name: "Сверхновая", elo: "1700+", icon: "⭐", color: "#E040FB" },
                    { code: "Форсаж", name: "Форсаж", elo: "1400+", icon: "⚔️", color: "#00E5FF" },
                    { code: "Импульс", name: "Импульс", elo: "1200+", icon: "⚡", color: "#69F0AE" },
                    { code: "Спринтер", name: "Спринтер", elo: "1000+", icon: "🎯", color: "#FFD54F" },
                    { code: "НОВИЧОК", name: "Начинающий", elo: "0 - 999", icon: "🌱", color: "#90A4AE" },
                  ].map((tier) => {
                    const isCurrent = chessRank.code === tier.code;

                    return (
                      <div
                        key={tier.code}
                        className={`chess-ladder-item ${
                          isCurrent ? "chess-ladder-item--current" : ""
                        }`}
                        style={{ borderLeftColor: tier.color }}
                      >
                        <span className="chess-tier-icon">{tier.icon}</span>
                        <div className="chess-tier-info">
                          <h4 style={{ color: tier.color }}>{tier.name}</h4>
                          <span className="chess-tier-elo">{tier.elo} Elo</span>
                        </div>
                        {isCurrent ? (
                          <span className="current-rank-tag">Текущее звание</span>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : null}
          </div>

        </div>
      </main>

      {/* Auth Modal (Google & Manual Registration) */}
      {showAuthModal ? (
        <div className="modal-overlay" role="dialog" aria-modal="true">
          <div className="modal-dialog">
            <div className="modal-header">
              <h3 className="modal-title">Вход и Регистрация</h3>
              <button
                type="button"
                onClick={() => setShowAuthModal(false)}
                className="modal-close-btn"
              >
                ✕
              </button>
            </div>

            <div className="modal-tabs">
              <button
                type="button"
                className={`modal-tab ${authMode === "google" ? "modal-tab--active" : ""}`}
                onClick={() => setAuthMode("google")}
              >
                🌐 Через Google
              </button>
              <button
                type="button"
                className={`modal-tab ${authMode === "email" ? "modal-tab--active" : ""}`}
                onClick={() => setAuthMode("email")}
              >
                ✉️ Ручная регистрация
              </button>
            </div>

            <div className="modal-body">
              {authMode === "google" ? (
                <div className="google-auth-box">
                  <p className="modal-desc">
                    Войдите в 1 клик с сохранением всех достижений, рейтинга и открытых уроков:
                  </p>
                  <button
                    type="button"
                    onClick={handleGoogleAuth}
                    className="google-sign-in-button"
                  >
                    <svg className="google-icon" viewBox="0 0 24 24" width="20" height="20">
                      <path
                        fill="#4285F4"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                      />
                    </svg>
                    <span>Продолжить с Google</span>
                  </button>
                  <p className="auth-privacy-note">
                    Нажимая кнопку, вы принимаете условия{" "}
                    <Link href="/legal" target="_blank" className="link-inline">
                      Договора оферты
                    </Link>{" "}
                    и соглашаетесь на обработку персональных данных.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleEmailAuth} className="email-auth-form">
                  <div className="form-group">
                    <label htmlFor="reg-nickname">Никнейм:</label>
                    <input
                      id="reg-nickname"
                      type="text"
                      required
                      placeholder="Например: Клавогонщик"
                      value={emailForm.nickname}
                      onChange={(e) =>
                        setEmailForm({ ...emailForm, nickname: e.target.value })
                      }
                      className="form-input"
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="reg-email">Электронная почта:</label>
                    <input
                      id="reg-email"
                      type="email"
                      required
                      placeholder="name@example.com"
                      value={emailForm.email}
                      onChange={(e) =>
                        setEmailForm({ ...emailForm, email: e.target.value })
                      }
                      className="form-input"
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="reg-password">Пароль:</label>
                    <input
                      id="reg-password"
                      type="password"
                      required
                      placeholder="Минимум 6 символов"
                      value={emailForm.password}
                      onChange={(e) =>
                        setEmailForm({ ...emailForm, password: e.target.value })
                      }
                      className="form-input"
                    />
                  </div>

                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={emailForm.agree}
                      onChange={(e) =>
                        setEmailForm({ ...emailForm, agree: e.target.checked })
                      }
                    />
                    <span>
                      Согласен с{" "}
                      <Link href="/legal" target="_blank" className="link-inline">
                        Договором оферты и Политикой конфиденциальности (152-ФЗ)
                      </Link>
                    </span>
                  </label>

                  <button type="submit" className="button button--primary" style={{ width: "100%" }}>
                    Зарегистрироваться и сохранить прогресс
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      ) : null}

      <SiteFooter />
    </>
  );
}
