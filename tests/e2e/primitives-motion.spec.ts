// Motion evidence for the primitives (prompts/02-primitives.md): one short video and end-state
// screenshot per primitive on the bench, in test-results/motion/, to compare with docs/prototype.
// Recorded once, from the 1440 project; the mobile StickyStage fallback is recorded at 390.
import { mkdirSync } from "node:fs";
import { test, type Page } from "@playwright/test";
import { DESKTOP, MOTION_OUT, PHONE, record, wheel } from "./motion-helpers";
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

test("SplitReveal ready: lines and characters after the loader", async ({ browser }) => {
  await record(browser, "split-ready-1440", DESKTOP, async (page) => {
    await openAt(page, "bench-split");
    await page.waitForTimeout(2800);
  });
});

test("SplitReveal enter and scrub", async ({ browser }) => {
  await record(browser, "split-enter-scrub-1440", DESKTOP, async (page) => {
    await page.goto(LAB);
    await shellIdle(page);
    await at(page, "#bench-split", -200);
    await wheel(page, 2400, 36);
  });
});

test("WordsLight in a StickyStage, then on its own range", async ({ browser }) => {
  await record(browser, "words-light-1440", DESKTOP, async (page) => {
    await page.goto(LAB);
    await shellIdle(page);
    await at(page, "#bench-words", 300);
    await wheel(page, 3400, 48);
  });
});

test("Reveal on enter", async ({ browser }) => {
  await record(browser, "reveal-1440", DESKTOP, async (page) => {
    await page.goto(LAB);
    await shellIdle(page);
    await at(page, "#bench-reveal", 950);
    await wheel(page, 1900, 28);
  });
});

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

test("StickyStage with a stage timeline, desktop", async ({ browser }) => {
  await record(browser, "sticky-stage-1440", DESKTOP, async (page) => {
    await page.goto(LAB);
    await shellIdle(page);
    await at(page, "#bench-stage", 300);
    await wheel(page, 2400, 44);
  });
});

test("StickyStage mobile fallback, 390", async ({ browser }) => {
  await record(
    browser,
    "sticky-stage-390",
    PHONE,
    async (page) => {
      await page.goto(LAB);
      await shellIdle(page);
      const top = await page
        .locator("#bench-stage")
        .evaluate((el) => el.getBoundingClientRect().top + window.scrollY);
      for (let y = top - 600; y < top + 420; y += 50) {
        await scrollToY(page, y);
        await page.waitForTimeout(60);
      }
      await page.waitForTimeout(900);
    },
    { phone: true },
  );
});

test("Scrub: settling word, fading meta, expanding arc", async ({ browser }) => {
  await record(browser, "scrub-1440", DESKTOP, async (page) => {
    await page.goto(LAB);
    await shellIdle(page);
    await at(page, "#bench-scrub", 500);
    await wheel(page, 2600, 40);
  });
});

test("LineDraw", async ({ browser }) => {
  await record(browser, "line-draw-1440", DESKTOP, async (page) => {
    await page.goto(LAB);
    await shellIdle(page);
    await at(page, "#bench-line-night", 850);
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
