// The work page (prompts/04-work.md, "Tests"), at 1440 and 390, /fr/projets and /en/work: one
// sheet and one rail link per public project; the rail follows the scroll and its progress line
// fills (desktop); the hero link and a #slug URL land on their sheet; the media open (MediaReveal
// scrub, moved here from the lab bench); complete without JavaScript and under reduced motion;
// ScrollTriggers return to their baseline after leaving and coming back; axe on /fr/projets.
import AxeBuilder from "@axe-core/playwright";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { expect, test, type Locator, type Page } from "@playwright/test";
import { publicProjects } from "@/lib/content/projects";
import { beyond, bring, collectErrors, liveScrollTriggers } from "./page-helpers";
import { LEGAL_NAME } from "./routes";
import { scrollToY, shellIdle, transitionsSettled, visited } from "./shell-helpers";

interface WorkMessages {
  work: {
    title: string;
    start: string;
    rail: string;
    caseStudy: string;
    cursor: { caseStudy: string };
  };
  projects: Record<string, { name: string }>;
}
const MESSAGES: Record<"fr" | "en", WorkMessages> = {
  fr: JSON.parse(readFileSync("messages/fr.json", "utf8")),
  en: JSON.parse(readFileSync("messages/en.json", "utf8")),
};
const PATHS = { fr: "/fr/projets", en: "/en/work" } as const;
const LOCALES = ["fr", "en"] as const;
const SLUGS = publicProjects().map((p) => p.slug);

const rail = (page: Page) => page.locator("nav.rail");
const fill = (page: Page) => page.locator("[data-rail-fill]");

/** The scaleY of the rail's progress line. */
const fillScale = (page: Page) =>
  fill(page).evaluate((el) => {
    const t = getComputedStyle(el).transform;
    return t === "none" ? 1 : Math.round(new DOMMatrixReadOnly(t).d * 1000) / 1000;
  });

/** Every frame in `locator` is fully open and its screen at scale 1. */
const mediaOpen = (locator: Locator) =>
  locator.evaluateAll((frames) =>
    frames.every((el) => {
      const clip = getComputedStyle(el).clipPath;
      const inner = el.querySelector("[data-media-inner]");
      const t = inner ? getComputedStyle(inner).transform : "none";
      const scale = t === "none" ? 1 : new DOMMatrixReadOnly(t).a;
      return (
        (clip === "none" || /^inset\(0(%|px)? /.test(`${clip} `)) && Math.abs(scale - 1) < 0.001
      );
    }),
  );

/** Every child of the sheet head is visible and in place. */
const headAtRest = (locator: Locator) =>
  locator.evaluate((el) =>
    [...el.children].every((c) => {
      const s = getComputedStyle(c);
      return (
        s.opacity === "1" &&
        (s.transform === "none" || new DOMMatrixReadOnly(s.transform).m42 === 0)
      );
    }),
  );

/** Where a sheet sits relative to the top of the viewport. */
const topInView = (locator: Locator) => locator.evaluate((el) => el.getBoundingClientRect().top);

/** The sheet's scroll-margin-top, in px. */
const scrollMargin = (locator: Locator) =>
  locator.evaluate((el) => parseFloat(getComputedStyle(el).scrollMarginTop));

// ---------- with JavaScript and motion ----------

test.describe("with motion", () => {
  test.beforeEach(async ({ page }) => {
    test.setTimeout(90_000);
    await visited(page);
  });

  for (const locale of LOCALES) {
    test(`${locale}: one sheet and one rail link per public project, in order`, async ({
      page,
    }) => {
      const errors = collectErrors(page);
      const m = MESSAGES[locale];
      await page.goto(PATHS[locale]);
      await shellIdle(page);
      await expect(page.getByRole("heading", { level: 1 })).toHaveAccessibleName(m.work.title);

      const sheets = page.locator("article.project");
      await expect(sheets).toHaveCount(SLUGS.length);
      expect(await sheets.evaluateAll((els) => els.map((el) => el.id))).toEqual(SLUGS);
      for (const slug of SLUGS) {
        const name = m.projects[slug]?.name ?? slug;
        await expect(page.getByRole("article", { name })).toHaveAttribute("id", slug);
      }

      // Hidden below 901 px (as in the prototype), so not by role: the anchors are still there.
      const links = rail(page).locator("a");
      await expect(links).toHaveCount(SLUGS.length);
      expect(await links.evaluateAll((els) => els.map((a) => a.getAttribute("href")))).toEqual(
        SLUGS.map((slug) => `${PATHS[locale]}#${slug}`),
      );
      await expect(rail(page)).toHaveAttribute("aria-label", m.work.rail);

      // Only DentaFlow has a case study, through the localised pathname and the cursor label.
      const caseStudy = page.getByRole("link", { name: m.work.caseStudy });
      await expect(caseStudy).toHaveCount(1);
      await expect(caseStudy).toHaveAttribute("href", `${PATHS[locale]}/dentaflow`);
      await expect(caseStudy).toHaveAttribute("data-cursor", m.work.cursor.caseStudy);
      expect(errors).toEqual([]);
    });
  }

  test("the rail follows the scroll and its progress line fills", async ({ page }, info) => {
    test.skip(info.project.name !== "1440", "the rail shows from 901 px");
    await page.goto(PATHS.fr);
    await shellIdle(page);
    await expect(rail(page)).toBeVisible();
    await expect(rail(page).locator('[aria-current="true"]')).toHaveCount(0);
    expect(await fillScale(page)).toBe(0);

    const list = rail(page).locator("[data-spy-active]");
    for (const slug of SLUGS) {
      // The sheet's top a little above the 45 % line.
      await bring(page, page.locator(`#${slug}`), 0.4);
      await expect(list).toHaveAttribute("data-spy-active", slug);
      const current = rail(page).locator('[aria-current="true"]');
      await expect(current).toHaveCount(1);
      await expect(current).toHaveAttribute("href", `${PATHS.fr}#${slug}`);
      // The rail stays in view (sticky) all the way down.
      expect(await topInView(rail(page))).toBeGreaterThan(0);
    }
    // Past the last sheet the line is full; back at the top it is empty again.
    await beyond(page, page.locator("[data-projects]"));
    await expect.poll(() => fillScale(page)).toBe(1);
    await scrollToY(page, 0);
    await expect.poll(() => fillScale(page)).toBe(0);
  });

  test("below 901 px the rail is hidden", async ({ page }, info) => {
    test.skip(info.project.name !== "390", "phones only");
    await page.goto(PATHS.fr);
    await shellIdle(page);
    await expect(rail(page)).toBeHidden();
  });

  test("the hero link lands on DentaFlow, clear of the header", async ({ page }) => {
    await page.goto(PATHS.fr);
    await shellIdle(page);
    await page.getByRole("link", { name: MESSAGES.fr.work.start }).click();
    await expect(page).toHaveURL(new RegExp(`${PATHS.fr}#dentaflow$`));
    const sheet = page.locator("#dentaflow");
    const margin = await scrollMargin(sheet);
    await expect.poll(() => topInView(sheet), { timeout: 4000 }).toBeCloseTo(margin, -1);
  });

  test("a #slug URL lands on its sheet after the loader", async ({ page }) => {
    await page.goto(`${PATHS.fr}#hms`);
    await shellIdle(page);
    const sheet = page.locator("#hms");
    const margin = await scrollMargin(sheet);
    await expect.poll(() => topInView(sheet), { timeout: 4000 }).toBeCloseTo(margin, -1);
  });

  test("each sheet's head and screens reach their end state, without console errors", async ({
    page,
  }) => {
    const errors = collectErrors(page);
    await page.goto(PATHS.fr);
    await shellIdle(page);
    const first = page.locator("#dentaflow [data-media-reveal]");
    expect(await mediaOpen(first)).toBe(false);
    for (const slug of SLUGS) {
      const sheet = page.locator(`#${slug}`);
      await bring(page, sheet, 0.5);
      await expect.poll(() => headAtRest(sheet.locator(".project-head"))).toBe(true);
      await beyond(page, sheet);
      await expect
        .poll(() => mediaOpen(sheet.locator("[data-media-reveal]")), { message: slug })
        .toBe(true);
    }
    expect(errors).toEqual([]);
  });

  test("ScrollTriggers return to their baseline after leaving the work page and coming back", async ({
    page,
  }) => {
    const errors = collectErrors(page);
    const settle = () => page.waitForTimeout(800);
    await page.goto(PATHS.fr);
    await shellIdle(page);
    await settle();
    const baseline = await liveScrollTriggers(page);
    expect(baseline).toBeGreaterThan(0);

    await page.locator('a:visible[href="/fr/a-propos"]').first().click();
    await page.waitForURL(/\/fr\/a-propos$/);
    await shellIdle(page);
    await settle();
    expect(await liveScrollTriggers(page)).toBeLessThan(baseline);

    await page.locator(`a:visible[href="${PATHS.fr}"]`).first().click();
    await page.waitForURL(new RegExp(`${PATHS.fr}$`));
    await shellIdle(page);
    await settle();
    expect(await liveScrollTriggers(page)).toBe(baseline);
    expect(errors).toEqual([]);
  });

  test("axe on /fr/projets: no serious or critical issue, contrast findings named", async ({
    page,
  }, info) => {
    await page.goto(PATHS.fr);
    await shellIdle(page);
    const tags = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa", "best-practice"];
    const contrast: { at: string; target: string; ratio?: number; fg?: string; bg?: string }[] = [];
    const others: string[] = [];
    const run = async (at: string) => {
      await transitionsSettled(page);
      const { violations } = await new AxeBuilder({ page }).withTags(tags).analyze();
      for (const v of violations) {
        if (v.impact !== "serious" && v.impact !== "critical") continue;
        for (const node of v.nodes) {
          const target = node.target.join(" ");
          if (v.id === "color-contrast") {
            const data: { contrastRatio?: number; fgColor?: string; bgColor?: string } | undefined =
              node.any[0]?.data;
            contrast.push({
              at,
              target,
              ratio: data?.contrastRatio,
              fg: data?.fgColor,
              bg: data?.bgColor,
            });
          } else {
            others.push(`${at} ${v.id}: ${target}`);
          }
        }
      }
    };
    await run("top");
    // Every sheet revealed (the todo chips, the muted text), then once more.
    await beyond(page, page.locator("[data-projects]"));
    await page.waitForTimeout(1500);
    await run("after the sheets");

    mkdirSync("test-results/work", { recursive: true });
    writeFileSync(
      `test-results/work/axe-fr-${info.project.name}.json`,
      `${JSON.stringify(contrast, null, 2)}\n`,
    );
    expect(others).toEqual([]);
    expect(contrast.map((f) => `${f.at} ${f.target} ${String(f.ratio)}:1`)).toEqual([]);
  });
});

// ---------- without JavaScript, and under reduced motion ----------

/** Nothing in main is hidden or clipped, and no screen is zoomed. */
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

  for (const locale of LOCALES) {
    test(`${locale}: the raw HTML names every public project and the page is complete`, async ({
      page,
      request,
    }) => {
      const html = await (await request.get(PATHS[locale])).text();
      for (const slug of SLUGS) {
        const name = MESSAGES[locale].projects[slug]?.name ?? slug;
        expect(html, slug).toContain(`id="${slug}"`);
        expect(html, slug).toContain(name);
      }
      expect(html).toContain(LEGAL_NAME);

      await page.goto(PATHS[locale]);
      await expect(page.locator("article.project")).toHaveCount(SLUGS.length);
      expect(await complete(page)).toEqual(NOTHING_HIDDEN);
    });
  }

  test("the rail links are real anchors", async ({ page }, info) => {
    test.skip(info.project.name !== "1440", "the rail shows from 901 px");
    await page.goto(PATHS.fr);
    await rail(page).getByRole("link", { name: MESSAGES.fr.projects.flowshop?.name }).click();
    await expect(page).toHaveURL(new RegExp(`${PATHS.fr}#flowshop$`));
    const sheet = page.locator("#flowshop");
    expect(await topInView(sheet)).toBeCloseTo(await scrollMargin(sheet), -1);
  });
});

test.describe("reduced motion", () => {
  test.use({ reducedMotion: "reduce" });

  test("the page is complete and still; the rail still follows the scroll", async ({
    page,
  }, info) => {
    await visited(page);
    await page.goto(PATHS.fr);
    await shellIdle(page);
    await page.waitForTimeout(500);
    expect(await complete(page)).toEqual(NOTHING_HIDDEN);
    await bring(page, page.locator("#meetai"), 0.4);
    await page.waitForTimeout(800);
    expect(await complete(page)).toEqual(NOTHING_HIDDEN);
    if (info.project.name === "1440") {
      await expect(rail(page).locator("[data-spy-active]")).toHaveAttribute(
        "data-spy-active",
        "meetai",
      );
    }
  });
});
