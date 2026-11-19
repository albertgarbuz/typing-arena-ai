"use client";

import { useSyncExternalStore } from "react";
import { normalizeTheme, oppositeTheme, THEME_STORAGE_KEY } from "@/lib/theme";

const THEME_EVENT = "typing-arena:theme";

function subscribe(callback: () => void) {
  const onStorage = (event: StorageEvent) => {
    if (event.key !== THEME_STORAGE_KEY && event.key !== null) return;
    let value: string | null = null;
    try { value = localStorage.getItem(THEME_STORAGE_KEY); } catch { /* optional storage */ }
    const next = normalizeTheme(value);
    document.documentElement.dataset.theme = next;
    document.documentElement.style.colorScheme = next;
    callback();
  };
  window.addEventListener(THEME_EVENT, callback);
  window.addEventListener("storage", onStorage);
  return () => {
    window.removeEventListener(THEME_EVENT, callback);
    window.removeEventListener("storage", onStorage);
  };
}

function getSnapshot() {
  return normalizeTheme(document.documentElement.dataset.theme);
}
function getServerSnapshot() { return "dark" as const; }

export function ThemeToggle() {
  const theme = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const label = theme === "dark" ? "Включить светлую тему" : "Включить тёмную тему";

  function toggle() {
    const next = oppositeTheme(getSnapshot());
    document.documentElement.dataset.theme = next;
    document.documentElement.style.colorScheme = next;
    try { localStorage.setItem(THEME_STORAGE_KEY, next); } catch { /* theme still works without storage */ }
    window.dispatchEvent(new Event(THEME_EVENT));
  }

  return (
    <button type="button" className="theme-toggle" onClick={toggle} aria-label={label} title={label} data-testid="theme-toggle">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        {theme === "dark" ? <><circle cx="12" cy="12" r="4" /><path d="M12 2v2m0 16v2M2 12h2m16 0h2M4.93 4.93l1.42 1.42m11.3 11.3 1.42 1.42M4.93 19.07l1.42-1.42m11.3-11.3 1.42-1.42" /></> : <path d="M20.5 14.5A8.5 8.5 0 0 1 9.5 3.5 8.5 8.5 0 1 0 20.5 14.5Z" />}
      </svg>
    </button>
  );
}
