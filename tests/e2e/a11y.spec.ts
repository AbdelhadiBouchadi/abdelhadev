import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import { ROUTES } from "./routes";
import { scrollToY, shellIdle, transitionsSettled, visited } from "./shell-helpers";

const TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa", "best-practice"];

async function blocking(page: Page) {
  const all = await new AxeBuilder({ page })
    .withTags(TAGS)
    .disableRules(["color-contrast"])
    .analyze();
  const contrast = await new AxeBuilder({ page })
    .withRules(["color-contrast"])
    // scroll-driven words reach full opacity before being read; verified under reduced motion and no-JS
    .exclude("[data-words-light]")
    .analyze();
  return [...all.violations, ...contrast.violations]
    .filter((v) => v.impact === "serious" || v.impact === "critical")
    .map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`);
}

test.beforeEach(async ({ page }) => {
  // Two axe passes per page, after the loader.
  test.setTimeout(60_000);
  await visited(page);
});

for (const route of ROUTES) {
  test(`a11y ${route.path}`, async ({ page }) => {
    await page.goto(route.path);
    // After the loader: axe sees the page, not the overlay, and nothing is inert.
    await shellIdle(page);

    // Day sections at the top, then the night footer in view (the shell has changed tone). Axe
    // runs once the tone colours have finished their transition.
    await transitionsSettled(page);
    expect(await blocking(page)).toEqual([]);
    await scrollToY(page, await page.evaluate(() => document.documentElement.scrollHeight));
    await expect(page.locator("header")).toHaveAttribute("data-tone", "night");
    await transitionsSettled(page);
    expect(await blocking(page)).toEqual([]);

    await expect(page.locator("html")).toHaveAttribute("lang", route.locale);
    await expect(page.locator("h1")).toHaveCount(1);
  });
}

test("the skip link is the first focusable element and moves focus to main", async ({ page }) => {
  await page.goto("/fr");
  await shellIdle(page);
  await page.keyboard.press("Tab");
  const skip = page.getByRole("link", { name: "Aller au contenu" });
  await expect(skip).toBeFocused();
  await expect(skip).toBeInViewport();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/#main$/);
});

test("focus is visible", async ({ page }) => {
  await page.goto("/fr");
  await shellIdle(page);
  await page.keyboard.press("Tab");
  await page.keyboard.press("Tab");
  const outline = await page.evaluate(() => {
    const el = document.activeElement;
    return el ? getComputedStyle(el).outlineStyle : "none";
  });
  expect(outline).not.toBe("none");
});
