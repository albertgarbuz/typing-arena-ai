import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const routes = ["/", "/methodology", "/roadmap"];

test("homepage has exact heading, clear scope, working section links", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", error => errors.push(error.message));
  await page.goto("/");
  await expect(page).toHaveTitle(/Typing Arena AI/);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Печатай быстрее. Думай свободнее. Побеждай сильнейших.");
  await expect(page.getByText("Сейчас поиск соперника не запущен.", { exact: false })).toBeVisible();
  await page.getByRole("link", { name: "Посмотреть программу", exact: true }).click();
  await expect(page).toHaveURL(/#program$/);
  await expect(page.locator("#program-title")).toBeInViewport();
  expect(errors).toEqual([]);
});

test("theme switches, persists on refresh and across routes", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await page.getByTestId("theme-toggle").click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  await expect(page.getByTestId("theme-toggle")).toHaveAccessibleName("Включить тёмную тему");
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  await page.goto("/methodology");
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  await page.getByTestId("theme-toggle").click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
});

test("theme remains functional when browser storage is blocked", async ({ page }) => {
  await page.addInitScript(() => {
    Storage.prototype.getItem = () => { throw new Error("Storage blocked for test"); };
    Storage.prototype.setItem = () => { throw new Error("Storage blocked for test"); };
  });
  await page.goto("/");
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await page.getByTestId("theme-toggle").click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
});

test("RU and EN course tabs are functional and keyboard accessible", async ({ page }) => {
  await page.goto("/#program");
  await expect(page.getByTestId("keyboard-sample")).toHaveText("фыва олдж");
  await page.getByTestId("program-tab-en").click();
  await expect(page.getByTestId("keyboard-sample")).toHaveText("asdf jkl;");
  await expect(page.getByTestId("program-tab-en")).toHaveAttribute("aria-selected", "true");
  await page.keyboard.press("ArrowLeft");
  await expect(page.getByTestId("program-tab-ru")).toBeFocused();
  await expect(page.getByTestId("keyboard-sample")).toHaveText("фыва олдж");
  await page.keyboard.press("End");
  await expect(page.getByTestId("program-tab-en")).toBeFocused();
  await expect(page.locator(".program-stage")).toHaveCount(10);
});

test("mobile menu closes via Escape and section selection", async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 800 });
  await page.goto("/");
  const menu = page.getByRole("button", { name: "Открыть меню" });
  await menu.click();
  await expect(page.getByRole("navigation", { name: "Мобильная навигация" })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("navigation", { name: "Мобильная навигация" })).toHaveCount(0);
  await expect(menu).toBeFocused();
  await menu.click();
  await page.getByRole("navigation", { name: "Мобильная навигация" }).getByRole("link", { name: "Арена" }).click();
  await expect(page).toHaveURL(/#arena$/);
  await expect(page.getByRole("navigation", { name: "Мобильная навигация" })).toHaveCount(0);
});

test("section navigation works from an informational page", async ({ page }) => {
  await page.goto("/methodology");
  await page.getByRole("navigation", { name: "Основная навигация" }).getByRole("link", { name: "Обучение", exact: true }).click();
  await expect(page).toHaveURL(/\/#program$/);
  await expect(page.locator("#program-title")).toBeInViewport();
});

test("skip link and reduced motion are respected", async ({ page, browserName }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  // macOS WebKit uses Option+Tab to include links unless full keyboard access is enabled.
  // Exercise the real browser shortcut; do not programmatically focus the tested link.
  await page.keyboard.press(browserName === "webkit" ? "Alt+Tab" : "Tab");
  await expect(page.locator(".skip-link")).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page.locator("#main-content")).toBeFocused();
  expect(await page.evaluate(() => getComputedStyle(document.documentElement).scrollBehavior)).toBe("auto");
});

for (const width of [360, 768, 1280, 1440]) {
  test(`responsive layout at ${width}px has no page overflow`, async ({ page }) => {
    await page.setViewportSize({ width, height: 1000 });
    for (const route of routes) {
      await page.goto(route);
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
      const dimensions = await page.evaluate(() => ({ body: document.documentElement.scrollWidth, viewport: window.innerWidth }));
      expect(dimensions.body, route).toBeLessThanOrEqual(dimensions.viewport + 1);
    }
  });
}

for (const theme of ["dark", "light"] as const) {
  for (const route of routes) {
    test(`WCAG A/AA ${theme} ${route}`, async ({ page }) => {
      await page.addInitScript(value => localStorage.setItem("typing-arena-theme", value), theme);
      await page.goto(route);
      await page.evaluate(() => document.fonts.ready);
      const result = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze();
      expect(result.violations).toEqual([]);
      if (route === "/" && test.info().project.name === "chromium") {
        await page.screenshot({ path: `../../docs/screenshots/home-${theme}-desktop.png` });
        await page.screenshot({ path: `../../docs/screenshots/home-${theme}-full.png`, fullPage: true });
        await page.setViewportSize({ width: 360, height: 800 });
        await page.screenshot({ path: `../../docs/screenshots/home-${theme}-mobile.png`, fullPage: true });
      }
    });
  }
}

test("all published local links resolve and have valid target anchors", async ({ page, request }) => {
  const urls = new Set<string>();
  for (const route of routes) {
    await page.goto(route);
    for (const href of await page.locator("a[href]").evaluateAll(links => links.map(link => (link as HTMLAnchorElement).href))) {
      if (href.startsWith("http://127.0.0.1:3000")) urls.add(href);
    }
  }
  for (const href of urls) {
    const url = new URL(href);
    const response = await request.get(url.pathname);
    expect(response.status(), href).toBe(200);
    if (url.hash) {
      const html = await response.text();
      expect(html, href).toContain(`id="${decodeURIComponent(url.hash.slice(1))}"`);
    }
  }
});

test("unimplemented product routes are honest 404s and headers are set", async ({ request, page }) => {
  const response = await request.get("/");
  expect(response.headers()["x-content-type-options"]).toBe("nosniff");
  expect(response.headers()["x-frame-options"]).toBe("DENY");
  expect(response.headers()["x-powered-by"]).toBeUndefined();
  for (const path of ["/login", "/admin"]) {
    expect((await request.get(path)).status(), path).toBe(404);
  }
  await page.goto("/not-a-real-page");
  await expect(page.getByRole("heading", { name: "Такой страницы пока нет." })).toBeVisible();
  await page.getByRole("link", { name: "На главную", exact: true }).click();
  await expect(page).toHaveURL("http://127.0.0.1:3000/");
});
