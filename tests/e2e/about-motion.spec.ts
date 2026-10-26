// Videos and stills of the about page's motion in test-results/motion/, to compare with
// docs/prototype/about.html.
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

/** Puts the top of `selector` `offset` px below the top of the viewport. */
async function at(page: Page, selector: string, offset = 0) {
  const top = await page
    .locator(selector)
    .evaluate((el) => el.getBoundingClientRect().top + window.scrollY);
  await scrollToY(page, Math.max(0, top - offset));
  await page.mouse.move(700, 450);
  await page.waitForTimeout(500);
}

/** The sunrise's scroll range plus the screen the chapters slide over (DawnMotion). */
const dawnRange = (page: Page) =>
  page.evaluate(() => {
    const dawn = document.querySelector<HTMLElement>(".dawn");
    return dawn ? dawn.offsetHeight - window.innerHeight : 0;
  });

for (const [name, size, phone] of [
  ["about-dawn-1440", DESKTOP, false],
  ["about-dawn-390", PHONE, true],
] as const) {
  test(`about dawn: the arrival, the sunrise and the chapters sliding over it (${name})`, async ({
    browser,
  }) => {
    await record(
      browser,
      name,
      size,
      async (page) => {
        await page.goto(ABOUT);
        await shellIdle(page);
        await page.mouse.move(size.width / 2, size.height / 2);
        await page.waitForTimeout(2800);
        // Wheel deltas scroll 1 / devicePixelRatio as far, so the phone's 2x would stop halfway.
        const ratio = await page.evaluate(() => window.devicePixelRatio);
        await wheel(page, (await dawnRange(page)) * ratio, 90);
      },
      { phone },
    );
    rmSync(`${MOTION_OUT}/${name}.png`, { force: true });
  });
}

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
  // The two full-page stills are the only ones kept.
  rmSync(`${MOTION_OUT}/about-timeline-now-1440.png`, { force: true });
});

for (const [name, size, phone] of [
  ["about-deck-1440", DESKTOP, false],
  ["about-deck-390", PHONE, true],
] as const) {
  test(`about process: the cards stack as they scroll (${name})`, async ({ browser }) => {
    await record(
      browser,
      name,
      size,
      async (page) => {
        await page.goto(ABOUT);
        await shellIdle(page);
        await at(page, "#process", 0);
        const range = await page
          .locator(".deck")
          .evaluate((el) => (el instanceof HTMLElement ? el.offsetHeight : 0));
        const ratio = await page.evaluate(() => window.devicePixelRatio);
        await wheel(page, range * ratio, 120);
      },
      { phone },
    );
    // Only the clips are kept.
    rmSync(`${MOTION_OUT}/${name}.png`, { force: true });
  });
}

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
