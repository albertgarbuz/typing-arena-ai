"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";

import { IconArrowRight, IconClose, IconMenu } from "@/components/icons";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  getCurrentUser,
  getDefaultUser,
  getLeague,
  getUserRaw,
  getUserServerSnapshot,
  subscribeUser,
  type UserProfile,
} from "@/lib/auth/user";

export interface NavRoute {
  href: string;
  label: string;
  badge?: string;
  icon?: string;
}

export const MAIN_NAV_ROUTES: NavRoute[] = [
  { href: "/learn", label: "Обучение", badge: "100" },
  { href: "/test", label: "Тест скорости" },
  { href: "/arena", label: "Арена", icon: "⚔️", badge: "LIVE" },
  { href: "/stats", label: "Статистика" },
  { href: "/methodology", label: "Методика" },
];

const DESKTOP_MEDIA_QUERY = "(min-width: 960px)";

export function SiteHeader() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);

  // Sync user profile for header chip
  const userRaw = useSyncExternalStore(subscribeUser, getUserRaw, getUserServerSnapshot);
  const user: UserProfile = useMemo(() => {
    try {
      const parsed = JSON.parse(userRaw);
      const def = getDefaultUser();
      return { ...def, ...parsed };
    } catch {
      return getCurrentUser();
    }
  }, [userRaw]);

  const league = getLeague(user.ratingRu);

  useEffect(() => {
    if (!menuOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMenuOpen(false);
        menuButtonRef.current?.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    const mediaQuery =
      typeof window.matchMedia === "function" ? window.matchMedia(DESKTOP_MEDIA_QUERY) : null;
    const handleMediaChange = (event: MediaQueryListEvent) => {
      if (event.matches) setMenuOpen(false);
    };
    mediaQuery?.addEventListener?.("change", handleMediaChange);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      mediaQuery?.removeEventListener?.("change", handleMediaChange);
    };
  }, [menuOpen]);

  const closeMenu = () => setMenuOpen(false);

  return (
    <header className={menuOpen ? "site-header site-header--menu-open" : "site-header"}>
      <div className="site-header__inner layout-container">
        {/* Brand Logo */}
        <Link href="/" className="brand" onClick={closeMenu}>
          <span className="brand__mark" aria-hidden="true">
            TA
          </span>
          <span className="brand__name">Typing Arena</span>
          <span className="brand__pill">AI</span>
        </Link>

        {/* Clean, Non-Duplicated Main Navigation */}
        <nav className="site-nav" aria-label="Основная навигация">
          <ul className="site-nav__list">
            {MAIN_NAV_ROUTES.map((route) => {
              const isActive =
                pathname === route.href ||
                (route.href === "/learn" && pathname?.startsWith("/learn"));

              return (
                <li key={route.href} className="site-nav__item">
                  <Link
                    href={route.href}
                    className={`site-nav__link ${isActive ? "site-nav__link--active" : ""} ${
                      route.href === "/arena" ? "site-nav__link--arena" : ""
                    }`}
                  >
                    {route.icon ? <span className="site-nav__icon">{route.icon}</span> : null}
                    <span>{route.label}</span>
                    {route.badge ? (
                      <span
                        className={`nav-badge ${
                          route.badge === "LIVE" ? "nav-badge--live" : "nav-badge--count"
                        }`}
                      >
                        {route.badge}
                      </span>
                    ) : null}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Right Actions: User Profile Chip & Theme Toggle */}
        <div className="site-header__actions">
          {/* User Profile Header Chip */}
          <Link
            href="/profile"
            className="header-user-chip"
            title="Перейти в Личный кабинет"
          >
            <span className="user-avatar-chip">{user.avatar || "🦊"}</span>
            <div className="user-meta-chip">
              <span className="user-name-chip">{user.nickname || "Клавогонщик"}</span>
              <span className="user-rank-chip" style={{ color: league.color }}>
                {user.ratingRu} Elo · Ур. {user.level}
              </span>
            </div>
            <span className="user-coins-chip" title="Баллы мастерства">
              🪙 {user.coins || 0}
            </span>
          </Link>

          <ThemeToggle />

          <button
            ref={menuButtonRef}
            type="button"
            className="site-header__menu-button"
            aria-label={menuOpen ? "Закрыть меню" : "Открыть меню"}
            aria-expanded={menuOpen}
            aria-controls="mobile-navigation"
            onClick={() => setMenuOpen((open) => !open)}
          >
            {menuOpen ? <IconClose size={22} /> : <IconMenu size={22} />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation Drawer */}
      {menuOpen ? (
        <nav id="mobile-navigation" className="mobile-nav" aria-label="Мобильная навигация">
          <ul className="mobile-nav__list layout-container">
            <li className="mobile-nav__item">
              <Link className="mobile-nav__link" href="/profile" onClick={closeMenu}>
                <span className="mobile-nav__label">
                  👤 Личный кабинет ({user.nickname} · {user.ratingRu} Elo)
                </span>
                <IconArrowRight className="mobile-nav__icon" size={18} />
              </Link>
            </li>
            <li className="mobile-nav__item">
              <Link className="mobile-nav__link" href="/arena" onClick={closeMenu}>
                <span className="mobile-nav__label">⚔️ Арена соревнований (LIVE)</span>
                <IconArrowRight className="mobile-nav__icon" size={18} />
              </Link>
            </li>
            <li className="mobile-nav__item">
              <Link className="mobile-nav__link" href="/learn" onClick={closeMenu}>
                <span className="mobile-nav__label">📚 Курс обучения (100 уроков)</span>
                <IconArrowRight className="mobile-nav__icon" size={18} />
              </Link>
            </li>
            <li className="mobile-nav__item">
              <Link className="mobile-nav__link" href="/test" onClick={closeMenu}>
                <span className="mobile-nav__label">⚡ Тест скорости печати</span>
                <IconArrowRight className="mobile-nav__icon" size={18} />
              </Link>
            </li>
            <li className="mobile-nav__item">
              <Link className="mobile-nav__link" href="/stats" onClick={closeMenu}>
                <span className="mobile-nav__label">📊 Статистика и аналитика</span>
                <IconArrowRight className="mobile-nav__icon" size={18} />
              </Link>
            </li>
            <li className="mobile-nav__item">
              <Link className="mobile-nav__link" href="/methodology" onClick={closeMenu}>
                <span className="mobile-nav__label">📐 Методика и метрики</span>
                <IconArrowRight className="mobile-nav__icon" size={18} />
              </Link>
            </li>
            <li className="mobile-nav__item">
              <Link className="mobile-nav__link" href="/legal" onClick={closeMenu}>
                <span className="mobile-nav__label">📜 Оферта и защита данных (152-ФЗ)</span>
                <IconArrowRight className="mobile-nav__icon" size={18} />
              </Link>
            </li>
          </ul>
          <p className="mobile-nav__note layout-container">Typing Arena AI · спортивный тренажёр печати</p>
        </nav>
      ) : null}
    </header>
  );
}

export default SiteHeader;
