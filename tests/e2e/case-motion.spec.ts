// Videos and stills of the case study's motion in test-results/motion/, to compare with
// docs/prototype/dentaflow.html.
import { mkdirSync, rmSync } from "node:fs";
import { test, type Page } from "@playwright/test";
import { DESKTOP, MOTION_OUT, PHONE, record, wheel } from "./motion-helpers";
import { scrollToY, shellIdle, visited } from "./shell-helpers";

const CASE = "/fr/projets/dentaflow";

test.describe.configure({ mode: "serial" });
test.beforeEach(() => {
  test.skip(test.info().project.name !== "1440", "recorded once");
  test.setTimeout(90_000);
  mkdirSync(MOTION_OUT, { recursive: true });
});

/** Puts the top of `selector` `offset` px below the top of the viewport. */
async function at(page: Page, selector: string, offset = 0) {
  const top = await page
    .locator(selector)
    .evaluate((el) => el.getBoundingClientRect().top + window.scrollY);
  await scrollToY(page, Math.max(0, top - offset));
  await page.mouse.move(700, 450);
  await page.waitForTimeout(500);
}

test("case hero intro after the loader", async ({ browser }) => {
  await record(browser, "case-hero-1440", DESKTOP, async (page) => {
    await page.goto(CASE);
    await shellIdle(page);
    await page.waitForTimeout(2600);
  });
});

test("case tour: the stage follows the step being read", async ({ browser }) => {
  await record(browser, "case-tour-1440", DESKTOP, async (page) => {
    await page.goto(CASE);
    await shellIdle(page);
    await at(page, "[data-tour]", 300);
    await wheel(page, 3600, 60);
  });
  // The cap is three stills: the tour's end frame is mid-page, so only the video is kept.
  rmSync(`${MOTION_OUT}/case-tour-1440.png`, { force: true });
});

test("case architecture: nodes arrive and wires draw", async ({ browser }) => {
  await record(browser, "case-arch-1440", DESKTOP, async (page) => {
    await page.goto(CASE);
    await shellIdle(page);
    await at(page, "#architecture", 900);
    await wheel(page, 1100, 30);
  });
});

test("case study still at 390", async ({ browser }) => {
  const context = await browser.newContext({
    viewport: PHONE,
    isMobile: true,
    hasTouch: true,
    deviceScaleFactor: 2,
    reducedMotion: "reduce",
  });
  const page = await context.newPage();
  await visited(page);
  await page.goto(CASE);
  await shellIdle(page);
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: `${MOTION_OUT}/case-390.png`, fullPage: true });
  await context.close();
});
