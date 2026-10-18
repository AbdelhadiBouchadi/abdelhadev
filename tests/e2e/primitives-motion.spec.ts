// Motion evidence for the primitives no real page uses yet (prompts/02-primitives.md, trimmed in
// 03): one short video and end-state screenshot per primitive on the bench, in
// test-results/motion/, to compare with docs/prototype. Recorded once, from the 1440 project. The
// primitives the home page uses are filmed there (tests/e2e/home-motion.spec.ts).
import { mkdirSync } from "node:fs";
import { test, type Page } from "@playwright/test";
import { DESKTOP, MOTION_OUT, record, wheel } from "./motion-helpers";
import { scrollToY, shellIdle } from "./shell-helpers";

const LAB = "/fr/lab";

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

/** Opens the lab already scrolled to a block, so its ready-time intro plays in view. */
async function openAt(page: Page, hash: string) {
  await page.goto(`${LAB}#${hash}`);
  await shellIdle(page);
}

test("MediaReveal scrub", async ({ browser }) => {
  await record(browser, "media-scrub-1440", DESKTOP, async (page) => {
    await page.goto(LAB);
    await shellIdle(page);
    await at(page, "#bench-media", 900);
    await wheel(page, 1700, 30);
  });
});

test("MediaReveal intro after the loader", async ({ browser }) => {
  await record(browser, "media-intro-1440", DESKTOP, async (page) => {
    await openAt(page, "bench-media-night");
    await page.waitForTimeout(3200);
  });
});

test("LineDraw", async ({ browser }) => {
  await record(browser, "line-draw-1440", DESKTOP, async (page) => {
    await page.goto(LAB);
    await shellIdle(page);
    await at(page, "#lab-night", 850);
    await wheel(page, 1200, 30);
  });
});

test("useScrollSpy driving a rail", async ({ browser }) => {
  await record(browser, "scroll-spy-1440", DESKTOP, async (page) => {
    await page.goto(LAB);
    await shellIdle(page);
    await at(page, "#bench-spy", 0);
    await wheel(page, 2600, 40);
  });
});
