// Motion evidence for the work page (prompts/04-work.md, "Evidence"), in test-results/motion/, to
// compare with docs/prototype/work.html: three clips at 1440 (the hero intro, the rail following
// the scroll, the screens opening), each with its end-state still, and one full-page still at 390.
import { mkdirSync, rmSync } from "node:fs";
import { test, type Page } from "@playwright/test";
import { DESKTOP, MOTION_OUT, PHONE, record, wheel } from "./motion-helpers";
import { scrollToY, shellIdle, visited } from "./shell-helpers";

const WORK = "/fr/projets";

test.describe.configure({ mode: "serial" });
test.beforeEach(() => {
  test.skip(test.info().project.name !== "1440", "recorded once");
  test.setTimeout(90_000);
  mkdirSync(MOTION_OUT, { recursive: true });
});

/** Jumps so the top of `selector` sits `offset` px below the top of the viewport. */
async function at(page: Page, selector: string, offset = 0) {
  const top = await page
    .locator(selector)
    .evaluate((el) => el.getBoundingClientRect().top + window.scrollY);
  await scrollToY(page, Math.max(0, top - offset));
  await page.mouse.move(700, 450);
  await page.waitForTimeout(500);
}

test("work hero intro after the loader", async ({ browser }) => {
  await record(browser, "work-hero-1440", DESKTOP, async (page) => {
    await page.goto(WORK);
    await shellIdle(page);
    await page.waitForTimeout(2600);
  });
});

test("work rail following the scroll", async ({ browser }) => {
  await record(browser, "work-rail-1440", DESKTOP, async (page) => {
    await page.goto(WORK);
    await shellIdle(page);
    await at(page, "#dentaflow", 200);
    await wheel(page, 3400, 60);
  });
});

test("work screens opening", async ({ browser }) => {
  await record(browser, "work-media-1440", DESKTOP, async (page) => {
    await page.goto(WORK);
    await shellIdle(page);
    await at(page, "#dentaflow .media", 900);
    await wheel(page, 1500, 30);
  });
  // The cap is three stills: this clip's end frame is the rail clip's, so only the video is kept.
  rmSync(`${MOTION_OUT}/work-media-1440.png`, { force: true });
});

test("work page still at 390", async ({ browser }) => {
  const context = await browser.newContext({
    viewport: PHONE,
    isMobile: true,
    hasTouch: true,
    deviceScaleFactor: 2,
    reducedMotion: "reduce",
  });
  const page = await context.newPage();
  await visited(page);
  await page.goto(WORK);
  await shellIdle(page);
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: `${MOTION_OUT}/work-390.png`, fullPage: true });
  await context.close();
});
