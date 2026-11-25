"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";

import { IconArrowRight, IconClose, IconMenu } from "@/components/icons";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  getCurrentUser,
  getDefaultUser,
  getUserRaw,
  getUserServerSnapshot,
  subscribeUser,
  type UserProfile,
} from "@/lib/auth/user";

export interface NavRoute {
  href: string;
  label: string;
}

export const MAIN_NAV_ROUTES: NavRoute[] = [
  { href: "/learn", label: "Обучение" },
  { href: "/test", label: "Тест скорости" },
  { href: "/arena", label: "Арена" },
  { href: "/players", label: "Игроки" },
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

  const currentPath = (pathname || "/").replace(/\/$/, "");
  const active = (href: string) => currentPath === href || currentPath.startsWith(href + "/");

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
        <Link href="/" className="brand" onClick={event => {
          closeMenu();
          if (!currentPath && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey) {
            window.dispatchEvent(new Event("typing-arena:replay"));
            window.scrollTo(0, 0);
          }
        }}>
          <span className="brand__mark" aria-hidden="true">
            TA
          </span>
          <span className="brand__name">Typing Arena</span>

        </Link>

        {/* Clean, Non-Duplicated Main Navigation */}
        <nav className="site-nav" aria-label="Основная навигация">
          <ul className="site-nav__list">
            {MAIN_NAV_ROUTES.map((route) => {
              const isActive = active(route.href);
              return (
                <li key={route.href} className="site-nav__item">
                  <Link
                    aria-current={isActive ? "page" : undefined}
                    href={route.href}
                    className={`site-nav__link ${isActive ? "site-nav__link--active" : ""} ${
                      route.href === "/arena" ? "site-nav__link--arena" : ""
                    }`}
                  >
                    {route.label}
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
            title={user.nickname + " · Личный кабинет"}
            aria-label={"Личный кабинет: " + user.nickname}
          >
            <span className="user-avatar-chip">{user.avatar || "🦊"}</span>
            <div className="user-meta-chip">
              <span className="user-name-chip">{user.nickname || "Клавогонщик"}</span>
              <span className="user-rank-chip">
                Уровень {user.level}
              </span>
            </div>
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
            {[...MAIN_NAV_ROUTES, {href: "/profile", label: "Личный кабинет"}].map(route => (
              <li className="mobile-nav__item" key={route.href}>
                <Link href={route.href} onClick={closeMenu} aria-current={active(route.href) ? "page" : undefined} className="mobile-nav__link">
                  {route.label}<IconArrowRight size={16} />
                </Link>
              </li>
            ))}
          </ul>

        </nav>
      ) : null}
    </header>
  );
}

export default SiteHeader;
