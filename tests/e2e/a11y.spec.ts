import AxeBuilder from "@axe-core/playwright";
import { mkdirSync, writeFileSync } from "node:fs";
import { expect, test, type Page, type TestInfo } from "@playwright/test";
import { ROUTES, slugOf } from "./routes";
import { scrollToY, shellIdle, transitionsSettled, visited } from "./shell-helpers";

const TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa", "best-practice"];

/** Serious and critical violations. One known finding is recorded instead of failing:
    WordsLight's unlit words, at the prototype's 0.14 opacity before the scroll lights them
    (1.32:1 on paper), reported to the owner in 02 and 03 (docs/primitives.md, WordsLight). They
    are written to test-results/a11y/ and annotated on the test; every other node still fails. */
async function blocking(page: Page, info?: TestInfo, at = "") {
  const { violations } = await new AxeBuilder({ page }).withTags(TAGS).analyze();
  const recorded: { target: string; ratio?: number }[] = [];
  const failing: string[] = [];
  for (const v of violations) {
    if (v.impact !== "serious" && v.impact !== "critical") continue;
    const nodes: string[] = [];
    for (const node of v.nodes) {
      const target = node.target.join(" ");
      const unlit =
        v.id === "color-contrast" &&
        (await page.evaluate(
          (selector) => document.querySelector(selector)?.closest("[data-words-light]") != null,
          String(node.target[0]),
        ));
      if (unlit) {
        const data: { contrastRatio?: number } | undefined = node.any[0]?.data;
        recorded.push({ target, ratio: data?.contrastRatio });
      } else {
        nodes.push(target);
      }
    }
    if (nodes.length > 0) failing.push(`${v.id}: ${nodes.join(", ")}`);
  }
  if (info && recorded.length > 0) {
    mkdirSync("test-results/a11y", { recursive: true });
    const file = `test-results/a11y/words-light-${slugOf(new URL(page.url()).pathname)}-${info.project.name}-${at}.json`;
    writeFileSync(file, `${JSON.stringify(recorded, null, 2)}\n`);
    const ratios = [...new Set(recorded.map((r) => r.ratio))].join(", ");
    info.annotations.push({
      type: "axe words-light (recorded, not failing)",
      description: `${String(recorded.length)} unlit word(s) at ${at}, ratio ${ratios}`,
    });
  }
  return failing;
}

test.beforeEach(async ({ page }) => {
  // Two axe passes per page, after the loader.
  test.setTimeout(60_000);
  await visited(page);
});

for (const route of ROUTES) {
  test(`a11y ${route.path}`, async ({ page }, info) => {
    await page.goto(route.path);
    // After the loader: axe sees the page, not the overlay, and nothing is inert.
    await shellIdle(page);

    // Day sections at the top, then the night footer in view (the shell has changed tone). Axe
    // runs once the tone colours have finished their transition.
    await transitionsSettled(page);
    expect(await blocking(page, info, "top")).toEqual([]);
    await scrollToY(page, await page.evaluate(() => document.documentElement.scrollHeight));
    await expect(page.locator("header")).toHaveAttribute("data-tone", "night");
    await transitionsSettled(page);
    expect(await blocking(page, info, "bottom")).toEqual([]);

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
