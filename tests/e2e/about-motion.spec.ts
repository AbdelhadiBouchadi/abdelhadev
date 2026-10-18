// Motion evidence for the about page (prompts/06-about.md, "Evidence"), in test-results/motion/, to
// compare with docs/prototype/about.html: three clips at 1440 (the dawn intro, the chapters, the
// timeline into "Right now"), the dawn's end-state still at 1440 and one full-page still at 390.
import { mkdirSync, rmSync } from "node:fs";
import { test, type Page } from "@playwright/test";
import { DESKTOP, MOTION_OUT, PHONE, record, wheel } from "./motion-helpers";
import { scrollToY, shellIdle, visited } from "./shell-helpers";

const ABOUT = "/fr/a-propos";

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

test("about dawn intro after the loader", async ({ browser }) => {
  await record(browser, "about-dawn-1440", DESKTOP, async (page) => {
    await page.goto(ABOUT);
    await shellIdle(page);
    await page.waitForTimeout(2800);
  });
});

test("about chapters: the words light up on the sticky stage", async ({ browser }) => {
  await record(browser, "about-chapters-1440", DESKTOP, async (page) => {
    await page.goto(ABOUT);
    await shellIdle(page);
    await at(page, "#chapter-who", 600);
    await wheel(page, 5400, 90);
  });
  // The cap is three stills: the chapters' end frame is mid-page, so only the video is kept.
  rmSync(`${MOTION_OUT}/about-chapters-1440.png`, { force: true });
});

test("about timeline into Right now", async ({ browser }) => {
  await record(browser, "about-timeline-now-1440", DESKTOP, async (page) => {
    await page.goto(ABOUT);
    await shellIdle(page);
    await at(page, "#experience", 900);
    await wheel(page, 2600, 50);
  });
  // The dawn still and the 390 still make the three.
  rmSync(`${MOTION_OUT}/about-timeline-now-1440.png`, { force: true });
});

test("about full page at 1440 and 390", async ({ browser }) => {
  for (const [name, size, phone] of [
    ["about-1440", DESKTOP, false],
    ["about-390", PHONE, true],
  ] as const) {
    const context = await browser.newContext({
      viewport: size,
      ...(phone ? { isMobile: true, hasTouch: true, deviceScaleFactor: 2 } : {}),
      reducedMotion: "reduce",
    });
    const page = await context.newPage();
    await visited(page);
    await page.goto(ABOUT);
    await shellIdle(page);
    await page.evaluate(() => document.fonts.ready);
    await page.screenshot({ path: `${MOTION_OUT}/${name}.png`, fullPage: true });
    await context.close();
  }
});
