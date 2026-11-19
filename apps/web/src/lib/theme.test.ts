import { describe, expect, it } from "vitest";
import { normalizeTheme, oppositeTheme, THEME_BOOT_SCRIPT, THEME_STORAGE_KEY } from "./theme";
import { runInNewContext } from "node:vm";

describe("theme normalization", () => {
  it.each([null, undefined, "", "system", "unexpected", 42, {}, "DARK"])("defaults safely to dark for %j", value => {
    expect(normalizeTheme(value)).toBe("dark");
  });
  it("accepts light and dark", () => {
    expect(normalizeTheme("light")).toBe("light");
    expect(normalizeTheme("dark")).toBe("dark");
  });
  it("toggles reversibly", () => {
    expect(oppositeTheme("dark")).toBe("light");
    expect(oppositeTheme(oppositeTheme("light"))).toBe("light");
  });
});

describe("pre-paint bootstrap", () => {
  it.each(["dark", "light", null, "invalid"])("applies persisted preference %j before hydration", stored => {
    const document = { documentElement: { dataset: {} as Record<string,string>, style: {} as Record<string,string> } };
    const localStorage = { getItem: (key: string) => key === THEME_STORAGE_KEY ? stored : null };
    runInNewContext(THEME_BOOT_SCRIPT, { document, localStorage });
    expect(document.documentElement.dataset.theme).toBe(normalizeTheme(stored));
    expect(document.documentElement.style.colorScheme).toBe(normalizeTheme(stored));
  });
  it("survives blocked local storage", () => {
    const document = { documentElement: { dataset: {} as Record<string,string>, style: {} as Record<string,string> } };
    runInNewContext(THEME_BOOT_SCRIPT, { document, localStorage: { getItem() { throw new Error("Storage blocked"); } } });
    expect(document.documentElement.dataset.theme).toBe("dark");
  });
});
