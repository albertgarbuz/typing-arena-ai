export type Theme = "dark" | "light";
export const THEME_STORAGE_KEY = "typing-arena-theme";

export function normalizeTheme(value: unknown): Theme {
  return value === "light" ? "light" : "dark";
}

export function oppositeTheme(theme: Theme): Theme {
  return theme === "dark" ? "light" : "dark";
}

// Runs before first paint. Storage may be blocked in private browser contexts.
// Contains only application constants, never user content.
export const THEME_BOOT_SCRIPT = `(()=>{let t='dark';try{t=localStorage.getItem('${THEME_STORAGE_KEY}')==='light'?'light':'dark'}catch{}document.documentElement.dataset.theme=t;document.documentElement.style.colorScheme=t})()`;
