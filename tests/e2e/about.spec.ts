// The about page at 1440 and 390, in both locales: end states after the loader and on scroll,
// the dawn's scrub on its sticky stage and the chapters' hand-off, the footer and CV links, the
// timeline and the public email, the server HTML, reduced motion, the ScrollTrigger baseline and axe.
import AxeBuilder from "@axe-core/playwright";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { expect, test, type Locator, type Page } from "@playwright/test";
import { CHAPTERS, SERVICES } from "@/lib/content/about";
import { CV } from "@/lib/content/cv";
import { SITE } from "@/lib/site";
import { beyond, bring, collectErrors, liveScrollTriggers } from "./page-helpers";
import { LEGAL_NAME } from "./routes";
import { scrollToY, shellIdle, transitionsSettled, visited } from "./shell-helpers";

interface Item {
  title: string;
  text: string;
}
interface AboutMessages {
  footer: { newTab: string };
  about: {
    title: string;
    chapters: Record<string, { label: string; text: string }>;
    services: { title: string; items: Record<string, Item> };
    process: { title: string };
    experience: {
      title: string;
      cv: string;
      items: Record<string, { when: string; title: string }>;
    };
    stack: { title: string };
    now: { title: string };
  };
}
const MESSAGES: Record<"fr" | "en", AboutMessages> = {
  fr: JSON.parse(readFileSync("messages/fr.json", "utf8")),
  en: JSON.parse(readFileSync("messages/en.json", "utf8")),
};
const PATHS = { fr: "/fr/a-propos", en: "/en/about" } as const;
const LOCALES = ["fr", "en"] as const;
const GROUPS = [".services", "#process .steps", ".timeline", ".stack-groups", ".now-list"];

const opacityOf = (locator: Locator) =>
  locator.evaluate((el) => Number(getComputedStyle(el).opacity));

const transformOf = (locator: Locator) =>
  locator.evaluate((el) => {
    const t = getComputedStyle(el).transform;
    const m = new DOMMatrixReadOnly(t === "none" ? undefined : t);
    return { scaleX: m.a, scaleY: m.d, y: m.f };
  });

const glowAtRest = async (page: Page) => {
  const glow = page.locator(".dawn-glow");
  const { scaleY } = await transformOf(glow);
  return Math.abs(scaleY - 1) < 0.001 && (await opacityOf(glow)) === 1;
};

const haloScales = (page: Page) =>
  page.locator(".halo").evaluateAll((els) =>
    els.map((el) => {
      const t = getComputedStyle(el).transform;
      return t === "none" ? 1 : new DOMMatrixReadOnly(t).a;
    }),
  );

/** The scene plays over the section minus the sticky stage's screen and the one the chapters
    cover (DawnMotion). */
const sceneRange = (page: Page) =>
  page.evaluate(() => {
    const dawn = document.querySelector<HTMLElement>(".dawn");
    return dawn ? dawn.offsetHeight - 2 * window.innerHeight : 0;
  });

/** The scrub catches up in 0.6 s, on top of Lenis. */
async function scrubTo(page: Page, y: number): Promise<void> {
  await scrollToY(page, y);
  await page.waitForTimeout(1200);
}

const linesAtRest = (locator: Locator) =>
  locator.evaluate((el) =>
    [...el.querySelectorAll<HTMLElement>("*")].every((c) => {
      const t = getComputedStyle(c).transform;
      return t === "none" || Math.abs(new DOMMatrixReadOnly(t).m42) < 0.5;
    }),
  );

const atRest = (locator: Locator) =>
  locator.evaluate((el) =>
    [...el.children].every((c) => {
      const s = getComputedStyle(c);
      return (
        s.opacity === "1" &&
        (s.transform === "none" || new DOMMatrixReadOnly(s.transform).m42 === 0)
      );
    }),
  );

const selfAtRest = (locator: Locator) =>
  locator.evaluate((el) => {
    const s = getComputedStyle(el);
    return (
      s.opacity === "1" && (s.transform === "none" || new DOMMatrixReadOnly(s.transform).m42 === 0)
    );
  });

/** 1 when the statement is not split. */
const faintestWord = (locator: Locator) =>
  locator.evaluate((el) => {
    const words = [...el.querySelectorAll<HTMLElement>("*")];
    const all = words.length > 0 ? words : [el];
    return Math.min(...all.map((w) => Number(getComputedStyle(w).opacity)));
  });

/** Nothing in main is hidden and no stage is sticky. The dawn's decor is aria-hidden and partly
    translucent by design (the halos, the sun's reflection), so it only has to be visible. */
async function complete(page: Page) {
  return page.evaluate(() => {
    const hidden = [...document.querySelectorAll("main *")].filter((el) => {
      // The mark's reflection is drawn at 0.55 by design (components/brand/Mark).
      if (el.closest("[hidden], svg")) return false;
      const s = getComputedStyle(el);
      if (s.display === "none") return false;
      if (el.closest(".dawn [aria-hidden]")) return s.visibility === "hidden" || s.opacity === "0";
      return s.visibility === "hidden" || Number(s.opacity) < 1;
    }).length;
    const sticky = [...document.querySelectorAll("main [data-stage-pin], .dawn-stage")].filter(
      (el) => getComputedStyle(el).position === "sticky",
    ).length;
    const spacers = document.querySelectorAll(".pin-spacer").length;
    return { hidden, sticky, spacers };
  });
}
const COMPLETE = { hidden: 0, sticky: 0, spacers: 0 };

/** The still sunrise: one screen, the sun set on its horizon below the copy, no overlap. */
async function stillDawn(page: Page) {
  return page.evaluate(() => {
    const box = (selector: string) =>
      document.querySelector(selector)?.getBoundingClientRect() ?? new DOMRect(Number.NaN);
    const moved = [".sun-disc", ".sun-horizon", ".sun-reflection"].filter((selector) => {
      const el = document.querySelector(selector);
      return !el || getComputedStyle(el).transform !== "none";
    });
    const dawn = box(".dawn");
    const sun = box(".sun-mark");
    const chapters = document.querySelector(".chapters");
    return {
      oneScreen: dawn.height < 1.5 * window.innerHeight,
      moved,
      sunBelowCopy: sun.top >= box(".about-facts").bottom,
      sunInside: sun.height > 0 && sun.bottom <= dawn.bottom,
      overlap: chapters ? getComputedStyle(chapters).marginTop : "",
    };
  });
}
const STILL = { oneScreen: true, moved: [], sunBelowCopy: true, sunInside: true, overlap: "0px" };

const html = (text: string) => text.replaceAll("'", "&#x27;");

test.describe("with motion", () => {
  test.beforeEach(async ({ page }) => {
    test.setTimeout(90_000);
    await visited(page);
  });

  for (const locale of LOCALES) {
    test(`${locale}: the glow and the copy reach their end state after the loader`, async ({
      page,
    }) => {
      const errors = collectErrors(page);
      const m = MESSAGES[locale].about;
      await page.goto(PATHS[locale]);
      await shellIdle(page);
      const h1 = page.getByRole("heading", { level: 1 });
      await expect(h1).toHaveAccessibleName(m.title);
      await expect.poll(() => linesAtRest(h1), { timeout: 5000 }).toBe(true);
      await expect.poll(() => glowAtRest(page), { timeout: 5000 }).toBe(true);
      for (const group of await page.locator(".dawn-copy [data-reveal]").all()) {
        await expect.poll(() => selfAtRest(group)).toBe(true);
      }
      expect(errors).toEqual([]);
    });
  }

  test("the sunrise scrubs on its sticky stage, then the chapters slide over it", async ({
    page,
  }) => {
    const errors = collectErrors(page);
    await page.goto(PATHS.fr);
    await shellIdle(page);
    await expect.poll(() => glowAtRest(page), { timeout: 5000 }).toBe(true);
    const vh = await page.evaluate(() => window.innerHeight);
    const range = await sceneRange(page);
    expect(range).toBeGreaterThan(vh);
    expect(await page.locator(".pin-spacer").count()).toBe(0);

    await scrubTo(page, range * 0.25);
    const quarter = await haloScales(page);
    await scrubTo(page, range * 0.5);
    const half = await haloScales(page);
    expect(half[0] ?? 0).toBeGreaterThan(quarter[0] ?? 0);
    expect(half[1] ?? 0).toBeGreaterThan(quarter[1] ?? 0);
    const stageTop = () =>
      page.locator(".dawn-stage").evaluate((el) => el.getBoundingClientRect().top);
    expect(await stageTop()).toBe(0);
    // The copy has left the screen but stays in the DOM, still the first heading.
    expect(await opacityOf(page.locator(".dawn-copy"))).toBe(0);
    await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);

    await scrubTo(page, range);
    expect((await transformOf(page.locator(".sun-horizon"))).scaleX).toBeCloseTo(1, 3);
    expect((await transformOf(page.locator(".sun-reflection"))).scaleX).toBeCloseTo(1, 3);
    expect((await transformOf(page.locator(".sun-disc"))).y).toBeCloseTo(0, 1);
    for (const halo of await page.locator(".halo").all()) {
      expect(await opacityOf(halo)).toBeLessThan(0.02);
    }

    // The chapters' sheet slides over the stage's last screen: no seam, no gap, no side scroll.
    await scrubTo(page, range + vh / 2);
    const seam = await page.evaluate(() => {
      const stage = document.querySelector(".dawn-stage")?.getBoundingClientRect();
      const chapters = document.querySelector(".chapters")?.getBoundingClientRect();
      return {
        gap: (chapters?.top ?? Number.NaN) - (stage?.bottom ?? Number.NaN),
        overflow: document.documentElement.scrollWidth - window.innerWidth,
      };
    });
    expect(await stageTop()).toBe(0);
    expect(seam.gap).toBeLessThan(0);
    expect(seam.overflow).toBeLessThanOrEqual(0);
    const label = page.locator(".chapter-label").first();
    await bring(page, label, 0.4);
    await expect(label).toBeInViewport();
    expect(errors).toEqual([]);
  });

  test("each chapter's statement lights up as it is scrolled through", async ({ page }) => {
    const errors = collectErrors(page);
    await page.goto(PATHS.fr);
    await shellIdle(page);
    for (const key of CHAPTERS) {
      const chapter = page.locator(`#chapter-${key}`);
      const statement = chapter.locator("[data-words-light]");
      await expect(chapter.locator(".chapter-label")).toHaveText(
        MESSAGES.fr.about.chapters[key]?.label ?? key,
      );
      // Before the chapter's range: the words wait at REVEAL.wordsFrom (0.14).
      await bring(page, chapter, 1);
      await expect.poll(() => faintestWord(statement), { message: key }).toBeLessThan(0.6);
      // Through it: the stage is pinned while the words light, then every word is at 1.
      const { top, height } = await chapter.evaluate((el) => ({
        top: el.getBoundingClientRect().top + window.scrollY,
        height: el.getBoundingClientRect().height,
      }));
      const vh = await page.evaluate(() => window.innerHeight);
      await scrollToY(page, top + height / 2);
      await expect
        .poll(() =>
          chapter.locator("[data-stage-pin]").evaluate((el) => el.getBoundingClientRect().top),
        )
        .toBeCloseTo(0, 0);
      await scrollToY(page, top + height - vh + 10);
      await expect.poll(() => faintestWord(statement), { message: key }).toBe(1);
      await expect.poll(() => selfAtRest(chapter.locator("[data-reveal]"))).toBe(true);
    }
    expect(errors).toEqual([]);
  });

  test("services, process, experience, stack and Right now reach their end state", async ({
    page,
  }) => {
    const errors = collectErrors(page);
    await page.goto(PATHS.fr);
    await shellIdle(page);
    for (const selector of GROUPS) {
      const group = page.locator(selector);
      await bring(page, group, 0.5);
      await expect.poll(() => atRest(group), { message: selector, timeout: 5000 }).toBe(true);
    }
    // My five services, in my order.
    await expect(page.locator("[data-service]")).toHaveCount(SERVICES.length);
    expect(
      await page
        .locator("[data-service]")
        .evaluateAll((els) => els.map((el) => el.getAttribute("data-service"))),
    ).toEqual([...SERVICES]);
    await beyond(page, page.locator("#now"));
    expect(errors).toEqual([]);
  });

  test("ScrollTriggers return to their baseline after leaving the about page and coming back", async ({
    page,
  }) => {
    const errors = collectErrors(page);
    const settle = () => page.waitForTimeout(800);
    await page.goto(PATHS.fr);
    await shellIdle(page);
    await settle();
    const baseline = await liveScrollTriggers(page);
    expect(baseline).toBeGreaterThan(0);

    await page.locator('a:visible[href="/fr/projets"]').first().click();
    await page.waitForURL(/\/fr\/projets$/);
    await shellIdle(page);
    await settle();
    expect(await liveScrollTriggers(page)).not.toBe(baseline);

    await page.goBack();
    await page.waitForURL(/\/fr\/a-propos$/);
    await shellIdle(page);
    await settle();
    expect(await liveScrollTriggers(page)).toBe(baseline);
    expect(await page.locator(".pin-spacer").count()).toBe(0);
    expect(errors).toEqual([]);
  });

  test("axe at the top, at the end of the sunrise and at Right now: no serious or critical issue", async ({
    page,
  }, info) => {
    await page.goto(PATHS.fr);
    await shellIdle(page);
    const tags = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa", "best-practice"];
    const contrast: { at: string; target: string; ratio?: number; fg?: string; bg?: string }[] = [];
    const others: string[] = [];
    const run = async (at: string) => {
      await transitionsSettled(page);
      // Unlit words wait at 0.14 by design and are scrolled to full opacity before they are read, so
      // only they are left out of the contrast check (as in a11y.spec).
      const rules = await new AxeBuilder({ page })
        .withTags(tags)
        .disableRules(["color-contrast"])
        .analyze();
      const contrastRun = await new AxeBuilder({ page })
        .withRules(["color-contrast"])
        .exclude("[data-words-light]")
        .analyze();
      const violations = [...rules.violations, ...contrastRun.violations];
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
    await scrubTo(page, await sceneRange(page));
    await run("dawn-end");
    await bring(page, page.locator("#now"), 0.1);
    await page.waitForTimeout(1500);
    await run("now");

    mkdirSync("test-results/about", { recursive: true });
    writeFileSync(
      `test-results/about/axe-fr-${info.project.name}.json`,
      `${JSON.stringify(contrast, null, 2)}\n`,
    );
    expect(others).toEqual([]);
    expect(contrast.map((f) => `${f.at} ${f.target} ${String(f.ratio)}:1`)).toEqual([]);
  });
});

for (const locale of LOCALES) {
  test(`${locale}: the footer channels and the CV link are right, the CV is a PDF`, async ({
    page,
    request,
  }) => {
    const m = MESSAGES[locale];
    await page.goto(PATHS[locale]);
    for (const [label, href] of [
      ["LinkedIn", SITE.linkedin],
      ["GitHub", SITE.github],
    ] as const) {
      const link = page.locator("footer").getByRole("link", {
        name: `${label} (${m.footer.newTab})`,
      });
      await expect(link).toHaveAttribute("href", href);
      await expect(link).toHaveAttribute("target", "_blank");
      await expect(link).toHaveAttribute("rel", "noopener noreferrer");
      expect((await link.boundingBox())?.height ?? 0).toBeGreaterThanOrEqual(44);
    }

    // The label names the language and the file's size ("… (PDF, 1 ko)"), measured at build.
    const [before = "", after = ""] = m.about.experience.cv.split("{size}");
    const escape = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const cv = page.getByRole("link", {
      name: new RegExp(`^${escape(before)}\\d+(?:[.,]\\d)?\\s?(?:ko|kB|Mo|MB)${escape(after)}$`),
    });
    await expect(cv).toHaveAttribute("href", CV[locale].href);
    await expect(cv).toHaveAttribute("download", CV[locale].filename);
    await expect(cv).toHaveAttribute("hreflang", locale);
    expect((await cv.boundingBox())?.height ?? 0).toBeGreaterThanOrEqual(44);
    const file = await request.get(CV[locale].href);
    expect(file.status()).toBe(200);
    expect(file.headers()["content-type"]).toContain("application/pdf");
    expect((await file.body()).subarray(0, 5).toString("latin1")).toBe("%PDF-");

    // Every link target on the page is at least 44 px tall.
    const small = await page
      .locator("main a")
      .evaluateAll((els) =>
        els
          .filter((el) => el.getBoundingClientRect().height < 44)
          .map((el) => el.textContent ?? ""),
      );
    expect(small).toEqual([]);
  });
}

const LEGAL = { fr: "/fr/mentions-legales", en: "/en/legal-notice" } as const;

for (const locale of LOCALES) {
  test(`${locale}: the timeline dates, no festival row and the public email`, async ({ page }) => {
    const m = MESSAGES[locale];
    const items = m.about.experience.items;
    await page.goto(PATHS[locale]);

    const timeline = page.locator(".timeline");
    const keys = ["dentaflow", "yoga", "hms"];
    for (const key of keys) {
      const row = timeline.locator("li", { hasText: items[key]?.title ?? key });
      await expect(row.locator(".when")).toHaveText(items[key]?.when ?? key);
    }
    // Newest first: DentaFlow, the yoga platform, then Ophtachusm.
    const titles = await timeline.locator("li").allInnerTexts();
    const at = (key: string) => titles.findIndex((t) => t.includes(items[key]?.title ?? key));
    expect(keys.map(at)).toEqual([...keys.map(at)].sort((a, b) => a - b));
    expect(at("yoga")).toBeGreaterThan(-1);
    await expect(timeline).toContainText("Ophtachusm");
    await expect(page.locator("body")).not.toContainText(/\bHMS\b/);

    // The festival is only a hidden testimonial entry now.
    await expect(timeline).not.toContainText("Dérive Casablancaise");
    await expect(timeline.locator('a[target="_blank"]')).toHaveCount(0);

    const email = page.locator("footer").getByRole("link", { name: SITE.email });
    await expect(email).toHaveAttribute("href", `mailto:${SITE.email}`);
    expect((await email.boundingBox())?.height ?? 0).toBeGreaterThanOrEqual(44);

    await page.goto(LEGAL[locale]);
    await expect(page.locator("main").getByRole("link", { name: SITE.email })).toHaveAttribute(
      "href",
      `mailto:${SITE.email}`,
    );
  });
}

test.describe("without JavaScript", () => {
  test.use({ javaScriptEnabled: false });

  for (const locale of LOCALES) {
    test(`${locale}: the raw HTML has every section and the services in order; complete`, async ({
      page,
      request,
    }) => {
      const m = MESSAGES[locale].about;
      const raw = await (await request.get(PATHS[locale])).text();
      for (const title of [
        m.title,
        m.services.title,
        m.process.title,
        m.experience.title,
        m.stack.title,
        m.now.title,
        ...CHAPTERS.map((key) => m.chapters[key]?.label ?? key),
      ]) {
        expect(raw, title).toContain(html(title));
      }
      const positions = SERVICES.map((key) =>
        raw.indexOf(html(m.services.items[key]?.title ?? key)),
      );
      expect(positions.every((p) => p > 0)).toBe(true);
      expect(positions).toEqual([...positions].sort((a, b) => a - b));
      expect(raw).toContain(LEGAL_NAME);

      await page.goto(PATHS[locale]);
      await expect(page.locator("h1")).toHaveText(m.title);
      expect(await complete(page)).toEqual(COMPLETE);
      expect(await stillDawn(page)).toEqual(STILL);
    });
  }
});

test.describe("reduced motion", () => {
  test.use({ reducedMotion: "reduce" });

  test("the page is complete and still, scrolled through", async ({ page }) => {
    await visited(page);
    await page.goto(PATHS.fr);
    await shellIdle(page);
    await page.waitForTimeout(500);
    expect(await complete(page)).toEqual(COMPLETE);
    expect(await stillDawn(page)).toEqual(STILL);
    for (const key of CHAPTERS) {
      await bring(page, page.locator(`#chapter-${key}`), 0.3);
      await page.waitForTimeout(400);
      expect(await faintestWord(page.locator(`#chapter-${key} [data-words-light]`))).toBe(1);
    }
    await beyond(page, page.locator("#now"));
    await page.waitForTimeout(800);
    expect(await complete(page)).toEqual(COMPLETE);
  });
});
