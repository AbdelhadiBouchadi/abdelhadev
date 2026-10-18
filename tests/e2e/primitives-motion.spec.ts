// Motion evidence for the primitive no real page uses yet (prompts/02-primitives.md, trimmed in
// 03 and 04): LineDraw on the bench, in test-results/motion/, to compare with docs/prototype.
// Recorded once, from the 1440 project. The primitives the home and work pages use are filmed
// there (tests/e2e/home-motion.spec.ts, tests/e2e/work-motion.spec.ts).
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

test("LineDraw", async ({ browser }) => {
  await record(browser, "line-draw-1440", DESKTOP, async (page) => {
    await page.goto(LAB);
    await shellIdle(page);
    await at(page, "#lab-night", 850);
    await wheel(page, 1200, 30);
  });
});
