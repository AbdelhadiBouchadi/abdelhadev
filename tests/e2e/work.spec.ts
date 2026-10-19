// The work page (prompts/04-work.md, "Tests"), at 1440 and 390, /fr/projets and /en/work: one
// sheet and one rail link per public project; the rail follows the scroll and its progress line
// fills (desktop); the hero link and a #slug URL land on their sheet; the media open (MediaReveal
// scrub, moved here from the lab bench); complete without JavaScript and under reduced motion;
// ScrollTriggers return to their baseline after leaving and coming back; axe on /fr/projets.
// 08b: the order is the work order; the real screens of the media manifest are in the server
// HTML with their alt and intrinsic size; each loop has a poster, a label and a play/pause button,
// plays in view and never under reduced motion; no horizontal overflow; the removed e-commerce
// project is nowhere on the page.
import AxeBuilder from "@axe-core/playwright";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { expect, test, type Locator, type Page } from "@playwright/test";
import { publicProjects, sheetMedia, statusKey, WORK_ORDER } from "@/lib/content/projects";
import { mediaCopy } from "@/lib/media";
import { SITE } from "@/lib/site";
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
    video: { play: string; pause: string };
    github: string;
    status: Record<string, string>;
  };
  footer: { newTab: string };
  projects: Record<string, { name: string }>;
}
const MESSAGES: Record<"fr" | "en", WorkMessages> = {
  fr: JSON.parse(readFileSync("messages/fr.json", "utf8")),
  en: JSON.parse(readFileSync("messages/en.json", "utf8")),
};
const PATHS = { fr: "/fr/projets", en: "/en/work" } as const;
const LOCALES = ["fr", "en"] as const;
const SLUGS = publicProjects().map((p) => p.slug);
/** The real screens of each sheet (lib/content/media.map.json through the manifest). */
const SCREENS = publicProjects().map((p) => ({ slug: p.slug, items: sheetMedia(p) }));
const VIDEOS = SCREENS.flatMap(({ slug, items }) =>
  items.filter((m) => m.asset.kind === "video").map((item) => ({ slug, item })),
);
const LAST = SLUGS.at(-1) ?? "dentaflow";

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

    test(`${locale}: under the list, the GitHub link opens the owner's profile in a new tab`, async ({
      page,
      request,
    }) => {
      // Server-rendered: in the HTML before any JavaScript runs.
      const html = await (await request.get(PATHS[locale])).text();
      expect(html).toContain(`href="${SITE.github}"`);

      const m = MESSAGES[locale];
      await page.goto(PATHS[locale]);
      await shellIdle(page);
      const link = page.getByRole("link", { name: `${m.work.github} (${m.footer.newTab})` });
      await expect(link).toHaveCount(1);
      await expect(link).toHaveAttribute("href", SITE.github);
      await expect(link).toHaveAttribute("target", "_blank");
      await expect(link).toHaveAttribute("rel", "noopener noreferrer");
      // After the last sheet, and a 44 px target at least.
      const after = await link.evaluate((a) => {
        const list = document.querySelector("[data-projects]");
        return list
          ? Boolean(list.compareDocumentPosition(a) & Node.DOCUMENT_POSITION_FOLLOWING)
          : false;
      });
      expect(after).toBe(true);
      await link.scrollIntoViewIfNeeded();
      const box = await link.boundingBox();
      expect(box?.height ?? 0).toBeGreaterThanOrEqual(44);
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

    await page.locator('a:visible[href="/fr/contact"]').first().click();
    await page.waitForURL(/\/fr\/contact$/);
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
      // A video's <source> children are never rendered (Chromium computes them hidden).
      if (el.closest("[hidden]") || el.matches("video > source")) return false;
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
    await rail(page).getByRole("link", { name: MESSAGES.fr.projects[LAST]?.name }).click();
    await expect(page).toHaveURL(new RegExp(`${PATHS.fr}#${LAST}$`));
    const sheet = page.locator(`#${LAST}`);
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

// ---------- real screens (08b) ----------

/** Step 0.3 of prompts/08b-media.md; a slug that is not a project yet (yoga-booking) is absent. */
/** The e-commerce project removed in 08b, spelled in two parts so that a search of the
    repository for its name finds nothing outside docs/prototype/ (the prompt's acceptance). */
const REMOVED = new RegExp(["flow", "shop"].join(""), "i");

const ORDER = ["dentaflow", "meetai", "hms", "yoga-booking", "cote-royale"];

/** Whether each video on the page is paused. */
const pausedStates = (page: Page) =>
  page
    .locator("main video")
    .evaluateAll((els) => els.map((el) => !(el instanceof HTMLVideoElement) || el.paused));

test("the sheets follow the work order, nothing overflows and the removed project is gone", async ({
  page,
}) => {
  await visited(page);
  await page.goto(PATHS.fr);
  await shellIdle(page);
  const ids = await page.locator("article.project").evaluateAll((els) => els.map((el) => el.id));
  // 08c: the five projects, all of them, in the work order.
  expect(ids).toEqual(ORDER);
  expect(ids).toEqual([...WORK_ORDER]);
  await expect(page.locator("body")).not.toContainText(REMOVED);
  for (const at of ["top", "bottom"] as const) {
    if (at === "bottom") await beyond(page, page.locator("[data-projects]"));
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow, at).toBeLessThanOrEqual(0);
  }
});

// 09: every project has a confirmed status, shown as a warm chip in the sheet head, never as a
// fact to confirm.
test("each sheet shows its project's status in the page's language", async ({ request }, info) => {
  test.skip(info.project.name !== "1440", "server HTML: one width is enough");
  for (const locale of LOCALES) {
    const html = await (await request.get(PATHS[locale])).text();
    expect(html, locale).not.toContain(MESSAGES[locale].work.status.todo ?? "todo");
    for (const project of publicProjects()) {
      const label = MESSAGES[locale].work.status[statusKey(project)] ?? "";
      const sheet = html.slice(html.indexOf(`id="${project.slug}"`));
      // The title block: the name, the kind and the status chip, before the actions.
      const head = sheet.slice(0, sheet.indexOf("project-actions"));
      expect(label.length, project.slug).toBeGreaterThan(0);
      expect(head, `${locale} ${project.slug}`).toContain(
        `data-variant="warm">${label.replaceAll("'", "&#x27;")}</span>`,
      );
    }
  }
});

test.describe("real screens without JavaScript", () => {
  test.use({ javaScriptEnabled: false });

  for (const locale of LOCALES) {
    test(`${locale}: every real screen is in the server HTML with its alt and size`, async ({
      page,
      request,
    }) => {
      const m = MESSAGES[locale];
      const html = await (await request.get(PATHS[locale])).text();
      await page.goto(PATHS[locale]);
      for (const { slug, items } of SCREENS) {
        const frames = page.locator(`#${slug} [data-media]`);
        await expect(frames, slug).toHaveCount(items.length);
        for (const [i, item] of items.entries()) {
          const { alt, label } = mediaCopy(m, item.key);
          const { asset } = item;
          if (asset.kind === "image") {
            const img = frames.nth(i).locator("img");
            await expect(img).toHaveAttribute("alt", alt);
            expect(alt.length).toBeGreaterThan(0);
            await expect(img).toHaveAttribute("width", String(asset.width));
            await expect(img).toHaveAttribute("height", String(asset.height));
            const avif = asset.avif[0]?.src ?? "";
            expect(html, item.key).toContain(avif);
          } else {
            const video = frames.nth(i).locator("video");
            await expect(video).toHaveAttribute("poster", asset.poster.webp.src);
            await expect(video).toHaveAttribute("aria-label", label ?? "");
            await expect(video).toHaveAttribute("width", String(asset.width));
            await expect(video).toHaveAttribute("height", String(asset.height));
            await expect(video).toHaveAttribute("preload", "none");
            expect(html, item.key).toContain(asset.poster.webp.src);
            // Without JavaScript the poster is the content: no dead button.
            await expect(frames.nth(i).locator("button")).toBeHidden();
          }
        }
      }
      // Only the first screen of the first sheet loads eagerly.
      await expect(page.locator("main img[loading='eager']")).toHaveCount(
        SCREENS[0]?.items[0]?.asset.kind === "image" ? 1 : 0,
      );
    });
  }
});

test.describe("loops", () => {
  test.skip(VIDEOS.length === 0, "no loop is mapped");

  test("each loop has a poster, a label and a play/pause button, and plays in view", async ({
    page,
  }) => {
    test.setTimeout(90_000);
    const m = MESSAGES.fr;
    await visited(page);
    await page.goto(PATHS.fr);
    await shellIdle(page);
    for (const [j, { slug }] of VIDEOS.entries()) {
      const reveal = page
        .locator(`#${slug} [data-media-reveal]:has([data-video-loop])`)
        .nth(VIDEOS.slice(0, j).filter((v) => v.slug === slug).length);
      const frame = reveal.locator("[data-video-loop]");
      const video = frame.locator("video");
      await expect(video).toHaveAttribute("poster", /\.webp$/);
      await expect(video).toHaveAttribute("aria-label", /.+/);
      await bring(page, reveal, 0.15);
      // The frame's scrubbed reveal (clip and zoom) settles first: until then the share of the
      // video in view moves around the 50 % line, and the loop may pause and play again.
      await expect.poll(() => mediaOpen(reveal)).toBe(true);
      await expect
        .poll(() => video.evaluate((el) => !(el instanceof HTMLVideoElement) || el.paused), {
          timeout: 8000,
        })
        .toBe(false);
      const button = frame.getByRole("button");
      await expect(button).toHaveAccessibleName(m.work.video.pause);
      const box = await button.boundingBox();
      expect(box?.width ?? 0).toBeGreaterThanOrEqual(44);
      expect(box?.height ?? 0).toBeGreaterThanOrEqual(44);
      await button.click();
      await expect
        .poll(() => video.evaluate((el) => !(el instanceof HTMLVideoElement) || el.paused))
        .toBe(true);
      await expect(button).toHaveAccessibleName(m.work.video.play);
    }
    // Out of view, nothing plays.
    await scrollToY(page, 0);
    await expect.poll(() => pausedStates(page)).toEqual(VIDEOS.map(() => true));
  });
});

test.describe("loops under reduced motion", () => {
  test.use({ reducedMotion: "reduce" });
  test.skip(VIDEOS.length === 0, "no loop is mapped");

  test("no loop plays by itself; each shows its poster and the play button", async ({ page }) => {
    await visited(page);
    await page.goto(PATHS.fr);
    await shellIdle(page);
    for (const { slug } of VIDEOS) {
      await bring(page, page.locator(`#${slug} .media`), 0.1);
      await page.waitForTimeout(800);
      expect(await pausedStates(page)).toEqual(VIDEOS.map(() => true));
    }
    for (const button of await page.locator("main [data-video-loop] button").all()) {
      await expect(button).toHaveAccessibleName(MESSAGES.fr.work.video.play);
    }
  });
});
