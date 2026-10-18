// The motion primitive no real page uses yet, on the bench (/fr/lab, trimmed in 03 and 04):
// LineDraw, at 1440 and 390. It reaches its end state; nothing is hidden without JavaScript or
// under reduced motion; no console errors; axe once the loader has finished. The primitives the
// home page uses (SplitReveal, WordsLight, Reveal, StickyStage, Scrub) and the ScrollTrigger leak
// check moved to tests/e2e/home.spec.ts in 03; MediaReveal (scrub) and useScrollSpy moved to
// tests/e2e/work.spec.ts in 04.
import AxeBuilder from "@axe-core/playwright";
import { readFileSync } from "node:fs";
import { expect, test, type Locator, type Page } from "@playwright/test";
import { beyond, collectErrors } from "./page-helpers";
import { scrollToY, shellIdle, transitionsSettled, visited } from "./shell-helpers";

const LAB = "/fr/lab";
interface Messages {
  pages: { lab: { title: string } };
}
const messages: Messages = JSON.parse(readFileSync("messages/fr.json", "utf8"));

const bench = (page: Page, name: string) => page.locator(`[data-bench="${name}"]`);

// ---------- end states (read in the page) ----------

const diagramDrawn = (locator: Locator) =>
  locator.evaluate((el) => {
    const nodes = [...el.querySelectorAll("[data-node]")];
    const wires = [...el.querySelectorAll<SVGPathElement>("[data-wire]")];
    const drawn = (w: SVGPathElement) => {
      const s = getComputedStyle(w);
      if (s.visibility !== "visible") return false;
      if (s.strokeDasharray === "none") return true;
      const [dash = "0"] = s.strokeDasharray.split(/[ ,]+/);
      return parseFloat(dash) >= w.getTotalLength() - 1 && parseFloat(s.strokeDashoffset) === 0;
    };
    return nodes.every((n) => getComputedStyle(n).opacity === "1") && wires.every(drawn);
  });

// ---------- with JavaScript and motion ----------

test.describe("with motion", () => {
  test.beforeEach(async ({ page }) => {
    test.setTimeout(90_000);
    await visited(page);
  });

  test("LineDraw reaches its end state when scrolled, without console errors", async ({ page }) => {
    const errors = collectErrors(page);
    await page.goto(LAB);
    await shellIdle(page);

    for (const name of ["line-day", "line-night"]) {
      await beyond(page, bench(page, name));
      await expect.poll(() => diagramDrawn(bench(page, name)), { message: name }).toBe(true);
    }

    expect(errors).toEqual([]);
  });

  test("axe on the bench: no serious or critical issue at the top or once scrolled through", async ({
    page,
  }) => {
    await page.goto(LAB);
    await shellIdle(page);
    const tags = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa", "best-practice"];
    const blocking = async () =>
      (await new AxeBuilder({ page }).withTags(tags).analyze()).violations
        .filter((v) => v.impact === "serious" || v.impact === "critical")
        .map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`);

    await transitionsSettled(page);
    expect(await blocking()).toEqual([]);
    const height = await page.evaluate(() => document.documentElement.scrollHeight);
    for (let y = 0; y < height; y += 500) await scrollToY(page, y);
    await scrollToY(page, height);
    await page.waitForTimeout(1500);
    await transitionsSettled(page);
    expect(await blocking()).toEqual([]);
  });
});

// ---------- without JavaScript, and under reduced motion ----------

/** Nothing in main is hidden or clipped, and no media is zoomed. */
async function complete(page: Page) {
  return page.evaluate(() => {
    const hidden = [...document.querySelectorAll("main *")].filter((el) => {
      if (el.closest("[hidden]")) return false;
      const s = getComputedStyle(el);
      return s.visibility === "hidden" || Number(s.opacity) === 0;
    }).length;
    const clipped = [...document.querySelectorAll("main [data-media-reveal]")].filter(
      (el) => getComputedStyle(el).clipPath !== "none",
    ).length;
    const zoomed = [...document.querySelectorAll("main [data-media-inner]")].filter((el) => {
      const t = getComputedStyle(el).transform;
      return t !== "none" && new DOMMatrixReadOnly(t).a !== 1;
    }).length;
    return { hidden, clipped, zoomed };
  });
}

const NOTHING_HIDDEN = { hidden: 0, clipped: 0, zoomed: 0 };

test.describe("without JavaScript", () => {
  test.use({ javaScriptEnabled: false });

  test("the bench is complete: nothing hidden or clipped", async ({ page }) => {
    await page.goto(LAB);
    await expect(page.locator("h1")).toHaveText(messages.pages.lab.title);
    expect(await complete(page)).toEqual(NOTHING_HIDDEN);
  });
});

test.describe("reduced motion", () => {
  test.use({ reducedMotion: "reduce" });

  test("the bench is complete and still: nothing hidden or clipped", async ({ page }) => {
    await visited(page);
    await page.goto(LAB);
    await shellIdle(page);
    await page.waitForTimeout(500);
    expect(await complete(page)).toEqual(NOTHING_HIDDEN);
    // Scrolled through, still nothing moves.
    await beyond(page, page.locator("#lab-night"));
    await page.waitForTimeout(1000);
    expect(await complete(page)).toEqual(NOTHING_HIDDEN);
  });
});
