// The motion primitives on the bench (/fr/lab, prompts/02-primitives.md "Testing and evidence"),
// at 1440 and 390: each reaches its end state, nothing is hidden or sticky without JavaScript or
// under reduced motion, SplitReveal keeps its accessible name and reflows, ScrollTriggers do not
// leak across routes, no console errors, and axe once the loader has finished.
//
// ScrollTriggers are counted through the DevTools protocol (Runtime.queryObjects): the app has no
// test switch and GSAP keeps its globals private, so the spec finds live ScrollTrigger instances
// by their shape and counts the enabled ones (a killed trigger is disabled).
import AxeBuilder from "@axe-core/playwright";
import { readFileSync, mkdirSync, writeFileSync } from "node:fs";
import { expect, test, type Locator, type Page } from "@playwright/test";
import { scrollToY, shellIdle, transitionsSettled, visited } from "./shell-helpers";

const LAB = "/fr/lab";
interface Messages {
  pages: { lab: { title: string; bench: { lines: string; linesNight: string } } };
  projects: { dentaflow: { name: string } };
}
const messages: Messages = JSON.parse(readFileSync("messages/fr.json", "utf8"));
const COPY = messages.pages.lab.bench;

const bench = (page: Page, name: string) => page.locator(`[data-bench="${name}"]`);

// ---------- scrolling ----------

const docTop = (locator: Locator) =>
  locator.evaluate((el) => el.getBoundingClientRect().top + window.scrollY);

/** Puts the top of `locator` at `at` (a fraction of the viewport height from the top). */
async function bring(page: Page, locator: Locator, at = 0.5) {
  const top = await docTop(locator);
  const vh = await page.evaluate(() => window.innerHeight);
  await scrollToY(page, Math.max(0, top - vh * at));
}

/** Scrolls until `locator` has left the top of the viewport: every range on it has ended. */
async function beyond(page: Page, locator: Locator) {
  const { top, height } = await locator.evaluate((el) => ({
    top: el.getBoundingClientRect().top + window.scrollY,
    height: el.getBoundingClientRect().height,
  }));
  await scrollToY(page, top + height + 10);
}

// ---------- end states (read in the page) ----------

/** Every split piece rests at its place (yPercent 0) and the element was split. */
const piecesAtRest = (locator: Locator) =>
  locator.evaluate((el) => {
    const pieces = [...el.querySelectorAll("[aria-hidden]")];
    const y = (e: Element) => {
      const t = getComputedStyle(e).transform;
      return t === "none" ? 0 : new DOMMatrixReadOnly(t).m42;
    };
    return pieces.length > 1 && pieces.every((p) => Math.abs(y(p)) < 0.5);
  });

const wordsLit = (locator: Locator) =>
  locator.evaluate((el) => {
    const words = [...el.querySelectorAll("span")];
    return words.length > 1 && words.every((w) => getComputedStyle(w).opacity === "1");
  });

const groupAtRest = (locator: Locator) =>
  locator.evaluate((el) => {
    const targets = el.getAttribute("data-reveal") === "self" ? [el] : [...el.children];
    return targets.every((t) => {
      const s = getComputedStyle(t);
      return (
        s.opacity === "1" &&
        (s.transform === "none" || new DOMMatrixReadOnly(s.transform).m42 === 0)
      );
    });
  });

const mediaOpen = (locator: Locator) =>
  locator.evaluate((el) => {
    const clip = getComputedStyle(el).clipPath;
    const inner = el.querySelector("[data-media-inner]");
    const t = inner ? getComputedStyle(inner).transform : "none";
    const scale = t === "none" ? 1 : new DOMMatrixReadOnly(t).a;
    return (clip === "none" || /^inset\(0(%|px)? /.test(`${clip} `)) && Math.abs(scale - 1) < 0.001;
  });

const matrix = (locator: Locator) =>
  locator.evaluate((el) => {
    const s = getComputedStyle(el);
    const m = new DOMMatrixReadOnly(s.transform === "none" ? undefined : s.transform);
    return { scale: Math.round(m.a * 1000) / 1000, opacity: Number(s.opacity) };
  });

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

// ---------- ScrollTrigger count ----------

async function liveScrollTriggers(page: Page): Promise<number> {
  const cdp = await page.context().newCDPSession(page);
  try {
    const { result: proto } = await cdp.send("Runtime.evaluate", {
      expression: "Object.prototype",
    });
    if (!proto.objectId) throw new Error("no Object.prototype handle");
    const { objects } = await cdp.send("Runtime.queryObjects", {
      prototypeObjectId: proto.objectId,
    });
    if (!objects.objectId) throw new Error("queryObjects returned no array");
    const { result } = await cdp.send("Runtime.callFunctionOn", {
      objectId: objects.objectId,
      returnByValue: true,
      functionDeclaration: `function () {
        return this.filter((o) => {
          try {
            return o && typeof o.getVelocity === "function" && typeof o.kill === "function" &&
              typeof o.refresh === "function" && o.enabled === true;
          } catch { return false; }
        }).length;
      }`,
    });
    return Number(result.value);
  } finally {
    await cdp.detach();
  }
}

// ---------- console ----------

function collectErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on("console", (m) => {
    if (m.type() === "error") errors.push(m.text());
  });
  page.on("pageerror", (e) => errors.push(e.message));
  return errors;
}

// ---------- with JavaScript and motion ----------

test.describe("with motion", () => {
  test.beforeEach(async ({ page }) => {
    test.setTimeout(90_000);
    await visited(page);
  });

  test("ready intros reach their end state after the loader", async ({ page }) => {
    await page.goto(LAB);
    await shellIdle(page);
    const h1 = page.locator("h1");
    await expect.poll(() => piecesAtRest(h1), { timeout: 6000 }).toBe(true);
    await expect.poll(() => groupAtRest(bench(page, "reveal-ready")), { timeout: 6000 }).toBe(true);
    await expect.poll(() => piecesAtRest(bench(page, "split-lines-ready"))).toBe(true);
    await expect.poll(() => piecesAtRest(bench(page, "split-chars-ready"))).toBe(true);
    await expect.poll(() => mediaOpen(bench(page, "media-intro")), { timeout: 6000 }).toBe(true);
  });

  test("enter and scrub primitives reach their end state when scrolled, without console errors", async ({
    page,
  }) => {
    const errors = collectErrors(page);
    await page.goto(LAB);
    await shellIdle(page);

    for (const name of ["split-lines-enter", "split-lines-night"]) {
      await bring(page, bench(page, name));
      await expect.poll(() => piecesAtRest(bench(page, name)), { message: name }).toBe(true);
    }
    await bring(page, bench(page, "split-lines-scrub"), 0.2);
    await expect.poll(() => piecesAtRest(bench(page, "split-lines-scrub"))).toBe(true);

    await beyond(page, page.locator("#bench-words"));
    await expect.poll(() => wordsLit(bench(page, "words-stage"))).toBe(true);
    await beyond(page, bench(page, "words-night"));
    await expect.poll(() => wordsLit(bench(page, "words-night"))).toBe(true);

    for (const name of ["reveal-day", "reveal-night"]) {
      await bring(page, bench(page, name));
      await expect.poll(() => groupAtRest(bench(page, name)), { message: name }).toBe(true);
    }

    for (const name of ["media-scrub", "media-image"]) {
      await beyond(page, bench(page, name));
      await expect.poll(() => mediaOpen(bench(page, name)), { message: name }).toBe(true);
    }
    await expect(bench(page, "media-image").locator("img")).toHaveJSProperty("complete", true);

    await beyond(page, page.locator("#bench-scrub"));
    await expect.poll(() => matrix(bench(page, "scrub-word"))).toEqual({ scale: 0.92, opacity: 1 });
    await beyond(page, page.locator("#bench-scrub-night"));
    await expect
      .poll(() => matrix(bench(page, "scrub-arcs")))
      .toEqual({ scale: 1.25, opacity: 0.25 });

    for (const name of ["line-day", "line-night"]) {
      await beyond(page, bench(page, name));
      await expect.poll(() => diagramDrawn(bench(page, name)), { message: name }).toBe(true);
    }

    expect(errors).toEqual([]);
  });

  test("StickyStage: sticky stage timeline on desktop, normal flow on mobile", async ({
    page,
  }, info) => {
    const mobile = info.project.name === "390";
    await page.goto(LAB);
    await shellIdle(page);
    const section = page.locator("#bench-stage");
    await expect(section.locator("[data-condition]")).toHaveAttribute(
      "data-condition",
      mobile ? "mobile" : "desktop",
    );
    const layout = await section.evaluate((el) => {
      const pin = el.querySelector<HTMLElement>(":scope > [data-stage-pin]");
      const words = document.querySelector<HTMLElement>("#bench-words");
      return {
        height: el.getBoundingClientRect().height,
        pinHeight: pin?.getBoundingClientRect().height ?? 0,
        position: pin ? getComputedStyle(pin).position : "",
        vh: window.innerHeight,
        wordsHeight: words?.getBoundingClientRect().height ?? 0,
      };
    });
    // The words stage keeps its height on mobile (no mobileHeight): 240vh.
    expect(layout.wordsHeight).toBeCloseTo(layout.vh * 2.4, -1);
    if (mobile) {
      expect(layout.position).toBe("static");
      expect(layout.height).toBeCloseTo(layout.pinHeight, 0);
    } else {
      expect(layout.position).toBe("sticky");
      expect(layout.height).toBeCloseTo(layout.vh * 3, -1);
      expect(layout.pinHeight).toBeCloseTo(layout.vh, 0);
    }

    const tiles = section.locator("[data-tile]");
    const allOpen = () =>
      tiles.evaluateAll((els) =>
        els.every((el) => /^inset\(0(%|px)? /.test(`${getComputedStyle(el).clipPath} `)),
      );
    expect(await allOpen()).toBe(false);
    if (mobile) {
      await beyond(page, section);
    } else {
      // The end of the range: the section's bottom at the viewport's bottom.
      const top = await docTop(section);
      await scrollToY(page, top + layout.height - layout.vh + 5);
    }
    await expect.poll(allOpen).toBe(true);
    if (!mobile) {
      await expect
        .poll(() =>
          section
            .locator("[data-stage-bar]")
            .evaluate((el) => new DOMMatrixReadOnly(getComputedStyle(el).transform).a),
        )
        .toBeCloseTo(1, 2);
    }
  });

  test("useScrollSpy follows the block crossing the activation line", async ({ page }) => {
    await page.goto(LAB);
    await shellIdle(page);
    const rail = page.locator("[data-spy-active]");
    for (const key of ["morning", "noon", "evening", "night"]) {
      const block = page.locator(`#spy-${key}`);
      // The block's top a little above the 45 % line.
      await bring(page, block, 0.4);
      await expect(rail).toHaveAttribute("data-spy-active", `spy-${key}`);
      await expect(rail.locator('[aria-current="true"]')).toHaveCount(1);
    }
    // Back up into the first block.
    await bring(page, page.locator("#spy-morning"), 0.3);
    await expect(rail).toHaveAttribute("data-spy-active", "spy-morning");
  });

  test("SplitReveal keeps the original accessible name and reflows after a resize", async ({
    page,
  }) => {
    await page.goto(LAB);
    await shellIdle(page);
    await expect(
      page.getByRole("heading", { level: 1, name: messages.pages.lab.title }),
    ).toBeVisible();
    await expect(bench(page, "split-lines-ready")).toHaveAccessibleName(COPY.lines);
    await expect(bench(page, "split-lines-night")).toHaveAccessibleName(COPY.linesNight);
    await expect(page.getByRole("heading", { name: messages.projects.dentaflow.name })).toHaveCount(
      1,
    );

    const heading = bench(page, "split-lines-enter");
    await bring(page, heading);
    await expect.poll(() => piecesAtRest(heading)).toBe(true);
    await expect(heading).toHaveAccessibleName(COPY.lines);

    // Mark a line, resize, and wait for SplitText to re-split (the mark disappears with the old
    // lines).
    await heading.evaluate((el) => el.querySelector("[aria-hidden]")?.setAttribute("data-old", ""));
    const size = page.viewportSize();
    if (!size) throw new Error("no viewport");
    await page.setViewportSize({
      width: Math.max(320, Math.round(size.width * 0.6)),
      height: size.height,
    });
    await expect
      .poll(() => heading.evaluate((el) => el.querySelector("[data-old]") === null), {
        timeout: 5000,
      })
      .toBe(true);

    const reflow = await heading.evaluate((el) => {
      const box = el.getBoundingClientRect();
      const lines = [...el.children];
      return {
        text: lines
          .map((l) => (l.textContent ?? "").trim())
          .join(" ")
          .replace(/\s+/g, " "),
        fits: lines.every((l) => l.getBoundingClientRect().right <= box.right + 1),
      };
    });
    expect(reflow.text).toBe(COPY.lines.replace(/\s+/g, " "));
    expect(reflow.fits).toBe(true);
    await expect.poll(() => piecesAtRest(heading)).toBe(true);
    await expect(heading).toHaveAccessibleName(COPY.lines);
    await page.setViewportSize(size);
  });

  test("ScrollTriggers return to their baseline after leaving the lab and coming back", async ({
    page,
  }) => {
    const errors = collectErrors(page);
    const settle = () => page.waitForTimeout(800);
    await page.goto("/fr/projets");
    await shellIdle(page);
    await settle();
    const baseline = await liveScrollTriggers(page);

    await page.goto(LAB);
    await shellIdle(page);
    await settle();
    const lab = await liveScrollTriggers(page);
    expect(lab).toBeGreaterThan(baseline);

    await page
      .locator("a:visible", { hasText: /^Projets$/ })
      .first()
      .click();
    await page.waitForURL(/\/fr\/projets$/);
    await shellIdle(page);
    await settle();
    expect(await liveScrollTriggers(page)).toBe(baseline);

    await page.goBack();
    await page.waitForURL(/\/fr\/lab$/);
    await shellIdle(page);
    await settle();
    expect(await liveScrollTriggers(page)).toBe(lab);
    expect(errors).toEqual([]);
  });

  test("axe on the bench: no serious or critical issue once the primitives have played", async ({
    page,
  }, info) => {
    await page.goto(LAB);
    await shellIdle(page);
    const tags = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa", "best-practice"];
    const analyze = async () =>
      (await new AxeBuilder({ page }).withTags(tags).analyze()).violations;
    const serious = (vs: Awaited<ReturnType<typeof analyze>>) =>
      vs.filter((v) => v.impact === "serious" || v.impact === "critical");

    // Every block scrolled through: enter reveals have played, scrubs are at their end.
    const height = await page.evaluate(() => document.documentElement.scrollHeight);
    for (let y = 0; y < height; y += 500) await scrollToY(page, y);
    await scrollToY(page, height);
    await page.waitForTimeout(1500);
    await transitionsSettled(page);
    const after = serious(await analyze());
    expect(
      after.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`),
    ).toEqual([]);

    // Back at the top the scrubs are at their start: WordsLight's words are at 0.14. Record what
    // axe says about them for the owner (prompt: report, do not change the prototype value), and
    // fail on anything else.
    await scrollToY(page, 0);
    await page.waitForTimeout(1500);
    await transitionsSettled(page);
    const before = serious(await analyze());
    const findings: { rule: string; target: string; ratio?: number; fg?: string; bg?: string }[] =
      [];
    const others: string[] = [];
    for (const v of before) {
      for (const node of v.nodes) {
        const target = node.target.join(" ");
        const inWords = await page.evaluate(
          (selector) => document.querySelector(selector)?.closest("[data-words-light]") !== null,
          String(node.target[0]),
        );
        if (v.id === "color-contrast" && inWords) {
          const data: { contrastRatio?: number; fgColor?: string; bgColor?: string } | undefined =
            node.any[0]?.data;
          findings.push({
            rule: v.id,
            target,
            ratio: data?.contrastRatio,
            fg: data?.fgColor,
            bg: data?.bgColor,
          });
        } else {
          others.push(`${v.id}: ${target}`);
        }
      }
    }
    mkdirSync("test-results/primitives", { recursive: true });
    writeFileSync(
      `test-results/primitives/axe-words-light-${info.project.name}.json`,
      JSON.stringify(findings, null, 2),
    );
    if (findings.length > 0) {
      const ratios = [...new Set(findings.map((f) => f.ratio))].join(", ");
      info.annotations.push({
        type: "axe words-light",
        description: `${String(findings.length)} color-contrast node(s) in [data-words-light] before the scrub, ratio ${ratios}`,
      });
    }
    expect(others).toEqual([]);
  });
});

// ---------- without JavaScript, and under reduced motion ----------

/** Nothing in main is hidden, split, clipped or sticky, and stages have no extra height. */
async function complete(page: Page) {
  return page.evaluate(() => {
    const hidden = [...document.querySelectorAll("main *")].filter((el) => {
      if (el.closest("[hidden]")) return false;
      const s = getComputedStyle(el);
      return s.visibility === "hidden" || Number(s.opacity) === 0;
    }).length;
    const split = document.querySelectorAll(
      "main [data-split-reveal] [aria-hidden], main [data-words-light] span",
    ).length;
    const clipped = [...document.querySelectorAll("main [data-media-reveal]")].filter(
      (el) => getComputedStyle(el).clipPath !== "none",
    ).length;
    const zoomed = [...document.querySelectorAll("main [data-media-inner]")].filter((el) => {
      const t = getComputedStyle(el).transform;
      return t !== "none" && new DOMMatrixReadOnly(t).a !== 1;
    }).length;
    const stages = [...document.querySelectorAll<HTMLElement>("main [data-stage]")].map((el) => {
      const pin = el.querySelector<HTMLElement>(":scope > [data-stage-pin]");
      return {
        sticky: pin ? getComputedStyle(pin).position === "sticky" : true,
        extra: Math.round(
          el.getBoundingClientRect().height - (pin?.getBoundingClientRect().height ?? 0),
        ),
      };
    });
    return {
      hidden,
      split,
      clipped,
      zoomed,
      sticky: stages.filter((s) => s.sticky).length,
      extra: stages.filter((s) => s.extra !== 0).length,
      stages: stages.length,
    };
  });
}

const NOTHING_HIDDEN = {
  hidden: 0,
  split: 0,
  clipped: 0,
  zoomed: 0,
  sticky: 0,
  extra: 0,
  stages: 2,
};

test.describe("without JavaScript", () => {
  test.use({ javaScriptEnabled: false });

  test("the bench is complete: nothing hidden, split, clipped or sticky", async ({ page }) => {
    await page.goto(LAB);
    await expect(page.locator("h1")).toHaveText(messages.pages.lab.title);
    expect(await complete(page)).toEqual(NOTHING_HIDDEN);
  });
});

test.describe("reduced motion", () => {
  test.use({ reducedMotion: "reduce" });

  test("the bench is complete and still: nothing hidden, split, clipped or sticky", async ({
    page,
  }) => {
    await visited(page);
    await page.goto(LAB);
    await shellIdle(page);
    await page.waitForTimeout(500);
    expect(await complete(page)).toEqual(NOTHING_HIDDEN);
    // Scrolled through, still nothing moves.
    await beyond(page, page.locator("#bench-scrub"));
    await page.waitForTimeout(1000);
    expect(await matrix(bench(page, "scrub-word"))).toEqual({ scale: 1, opacity: 1 });
    expect(await complete(page)).toEqual(NOTHING_HIDDEN);
  });
});
