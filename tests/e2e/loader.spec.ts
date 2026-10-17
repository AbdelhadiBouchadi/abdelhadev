// The loader (docs/choreography.md, "Loader"; decision T7): real progress, the floors and the
// ceiling, the content painted and inert under it, reduced motion, no JavaScript.
import { expect, test } from "@playwright/test";
import { loaderRecord, recordLoader, shellIdle, visited } from "./shell-helpers";

const FLOOR_FIRST = 1600;
const FLOOR_ROUTE = 700;
const CEILING = 4500;
/** Final progress push (0.45 s) plus the exit up to the intro (0.55 s), less 50 ms for GSAP's
    ticker clock against performance.now(). */
const EXIT_TO_READY = 950;

test("first visit: the full sequence, at least the floor, before the ceiling", async ({ page }) => {
  await recordLoader(page);
  await page.goto("/fr");

  // The real page is in the DOM and painted under the overlay (spike S3), and inert.
  await expect(page.locator("[data-loader]")).toBeVisible();
  const hero = page.locator("main h1");
  await expect(hero).toHaveText(/Abdelhadi Bouchadi/);
  expect(
    await hero.evaluate((el) => {
      const s = getComputedStyle(el);
      return s.visibility === "visible" && s.opacity === "1" && el.getBoundingClientRect().height;
    }),
  ).toBeGreaterThan(0);
  await expect(page.locator("main")).toHaveAttribute("inert", "");
  await expect(page.locator("header")).toHaveAttribute("inert", "");
  await expect(page.locator("[data-loader] [role='status']")).toHaveCount(1);

  await shellIdle(page);
  const rec = await loaderRecord(page);
  expect(rec.horizonMoved, "the horizon draws in on a first visit").toBe(true);
  expect(rec.ready ?? 0).toBeGreaterThanOrEqual(FLOOR_FIRST + EXIT_TO_READY);
  expect(rec.ready ?? Infinity, "intro starts before the ceiling").toBeLessThan(CEILING);
  expect(rec.off ?? Infinity, "content covered for at most 5 s").toBeLessThan(5000);
  expect(await page.locator("[inert]").count()).toBe(0);
  await expect(page.locator("[data-loader]")).toBeHidden();
  await expect(page.locator("[data-loader] [role='status']")).toHaveText(
    "Chargement, 100 pour cent",
  );
});

test("a visited session plays the short sequence without the draw-in", async ({ page }) => {
  await visited(page);
  await recordLoader(page);
  await page.goto("/en/work");
  await shellIdle(page);
  const rec = await loaderRecord(page);
  expect(rec.horizonMoved, "no draw-in on the short sequence").toBe(false);
  // `ready` comes after the floor, the final 0.45 s push and 0.55 s of the exit. The floor values
  // themselves are unit tested (tests/unit/loader.test.ts); timings here vary with machine load.
  expect(rec.ready ?? 0).toBeGreaterThanOrEqual(FLOOR_ROUTE + EXIT_TO_READY);
  expect(rec.ready ?? Infinity).toBeLessThan(CEILING + EXIT_TO_READY);
  await expect(page.locator("[data-loader] [role='status']")).toHaveText("Loading, 100 percent");
});

test.describe("reduced motion", () => {
  test.use({ reducedMotion: "reduce" });

  test("no drawing, no rise, a short fade", async ({ page }) => {
    await recordLoader(page);
    await page.goto("/fr");
    // The letters are visible from the start and the sun is up.
    const letterOpacity = await page
      .locator("[data-loader] [data-letter]")
      .first()
      .evaluate((el) => getComputedStyle(el).opacity);
    expect(letterOpacity).toBe("1");
    await shellIdle(page);
    const rec = await loaderRecord(page);
    expect(rec.horizonMoved).toBe(false);
    expect(rec.off ?? Infinity).toBeLessThan(CEILING);
    // The panel faded in place: it never slid.
    const transform = await page
      .locator("[data-loader-panel]")
      .evaluate((el) => getComputedStyle(el).transform);
    expect(transform === "none" || transform === "matrix(1, 0, 0, 1, 0, 0)").toBe(true);
  });
});

test.describe("without JavaScript", () => {
  test.use({ javaScriptEnabled: false });

  test("there is no loader and nothing is inert", async ({ page }) => {
    await page.goto("/fr");
    await expect(page.locator("[data-loader]")).toBeHidden();
    expect(await page.locator("[inert]").count()).toBe(0);
    await expect(page.locator("main h1")).toBeVisible();
  });
});
