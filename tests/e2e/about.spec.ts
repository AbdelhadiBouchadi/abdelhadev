// The about page at 1440 and 390, in both locales: end states after the loader and on scroll,
// the dawn's scrub (pinned at 1440, in flow at 390), the footer and CV links, the timeline and the
// public email, the server HTML, reduced motion, the ScrollTrigger baseline and axe.
import AxeBuilder from "@axe-core/playwright";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { expect, test, type Locator, type Page } from "@playwright/test";
import { CHAPTERS, SERVICES } from "@/lib/content/about";
import { CV } from "@/lib/content/cv";
import { ABOUT } from "@/lib/motion";
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

const arcsAtRest = (page: Page) =>
  page.locator(".arc").evaluateAll((els) =>
    els.every((el) => {
      const s = getComputedStyle(el);
      if (s.opacity !== "1") return false;
      const light = el.querySelector(".arc-light");
      const rise = light ? getComputedStyle(light).transform : "none";
      if (rise !== "none" && Math.abs(new DOMMatrixReadOnly(rise).a - 1) > 0.001) return false;
      if (s.transform === "none") return true;
      const m = new DOMMatrixReadOnly(s.transform);
      return Math.abs(m.a - 1) < 0.001 && Math.abs(m.f) < 0.5;
    }),
  );

/** Each arc's arrival scale times its light's scrubbed scale. */
const arcScales = (page: Page) =>
  page.locator(".arc").evaluateAll((els) =>
    els.map((el) => {
      const scaleOf = (node: Element | null) => {
        const t = node ? getComputedStyle(node).transform : "none";
        return t === "none" ? 1 : new DOMMatrixReadOnly(t).a;
      };
      return scaleOf(el) * scaleOf(el.querySelector(".arc-light"));
    }),
  );

const opacityOf = (locator: Locator) =>
  locator.evaluate((el) => Number(getComputedStyle(el).opacity));

const pinSpacers = (page: Page) => page.locator(".pin-spacer").count();

/** The dawn's pinned scroll distance (the spacer's padding), 0 without a pin. */
const pinRange = (page: Page) =>
  page.evaluate(() => {
    const spacer = document.querySelector(".pin-spacer");
    const dawn = document.querySelector(".dawn");
    if (!spacer || !dawn) return 0;
    return spacer.getBoundingClientRect().height - dawn.getBoundingClientRect().height;
  });

/** The scrub catches up in 0.5 s. */
async function scrubTo(page: Page, y: number): Promise<void> {
  await scrollToY(page, y);
  await page.waitForTimeout(1000);
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

/** Nothing in main is hidden, no chapter is sticky or taller than its content, no arc moved,
    nothing pinned. */
async function complete(page: Page) {
  return page.evaluate(() => {
    const hidden = [...document.querySelectorAll("main *")].filter((el) => {
      // The mark's reflection is drawn at 0.55 by design (components/brand/Mark).
      if (el.closest("[hidden], svg")) return false;
      const s = getComputedStyle(el);
      return s.visibility === "hidden" || Number(s.opacity) < 1;
    }).length;
    const sticky = [...document.querySelectorAll("main [data-stage-pin]")].filter(
      (el) => getComputedStyle(el).position === "sticky",
    ).length;
    const moved = [...document.querySelectorAll(".arcs, .arc, .arc-light")].filter(
      (el) => getComputedStyle(el).transform !== "none",
    ).length;
    const spacers = document.querySelectorAll(".pin-spacer").length;
    return { hidden, sticky, moved, spacers };
  });
}
const COMPLETE = { hidden: 0, sticky: 0, moved: 0, spacers: 0 };

const html = (text: string) => text.replaceAll("'", "&#x27;");

test.describe("with motion", () => {
  test.beforeEach(async ({ page }) => {
    test.setTimeout(90_000);
    await visited(page);
  });

  for (const locale of LOCALES) {
    test(`${locale}: the arcs and the title reach their end state after the loader`, async ({
      page,
    }) => {
      const errors = collectErrors(page);
      const m = MESSAGES[locale].about;
      await page.goto(PATHS[locale]);
      await shellIdle(page);
      const h1 = page.getByRole("heading", { level: 1 });
      await expect(h1).toHaveAccessibleName(m.title);
      await expect.poll(() => linesAtRest(h1), { timeout: 5000 }).toBe(true);
      await expect.poll(() => arcsAtRest(page), { timeout: 5000 }).toBe(true);
      for (const group of await page.locator(".dawn-copy [data-reveal]").all()) {
        await expect.poll(() => selfAtRest(group)).toBe(true);
      }
      expect(errors).toEqual([]);
    });
  }

  test("the dawn is pinned and scrubbed: the arcs rise, then hand off to the chapters", async ({
    page,
  }, info) => {
    test.skip(info.project.name !== "1440", "pinned from 768 px");
    const errors = collectErrors(page);
    await page.goto(PATHS.fr);
    await shellIdle(page);
    await expect.poll(() => arcsAtRest(page), { timeout: 5000 }).toBe(true);
    const vh = await page.evaluate(() => window.innerHeight);
    const range = await pinRange(page);
    expect(range).toBeGreaterThanOrEqual(vh * 1.8);
    expect(range).toBeLessThanOrEqual(vh * 2.2);

    await scrubTo(page, range * 0.25);
    const quarter = await arcScales(page);
    await scrubTo(page, range * 0.6);
    const middle = await arcScales(page);
    expect(await page.locator(".dawn").evaluate((el) => el.getBoundingClientRect().top)).toBe(0);
    await scrubTo(page, range);
    const end = await arcScales(page);
    quarter.forEach((scale, i) => {
      expect(middle[i] ?? 0, `arc ${String(i)}`).toBeGreaterThanOrEqual(scale);
      expect(end[i] ?? 0, `arc ${String(i)}`).toBeGreaterThan(scale);
    });
    // The arcs have dissolved into the paper; the facts row is still fully readable.
    expect(await opacityOf(page.locator(".arcs"))).toBeLessThan(0.02);
    expect(await opacityOf(page.locator(".about-facts"))).toBe(1);

    // Released: the chapters follow the section with no seam and no horizontal scroll.
    await scrubTo(page, range + vh / 2);
    const seam = await page.evaluate(() => {
      const dawn = document.querySelector(".dawn")?.getBoundingClientRect();
      const chapters = document.querySelector(".chapters")?.getBoundingClientRect();
      return {
        gap: (chapters?.top ?? Number.NaN) - (dawn?.bottom ?? Number.NaN),
        overflow: document.documentElement.scrollWidth - window.innerWidth,
      };
    });
    expect(Math.abs(seam.gap)).toBeLessThan(1);
    expect(seam.overflow).toBeLessThanOrEqual(0);
    await bring(page, page.locator(".chapters"), 0);
    await expect
      .poll(() => page.locator(".chapters").evaluate((el) => el.getBoundingClientRect().top))
      .toBeCloseTo(0, 0);
    expect(errors).toEqual([]);
  });

  test("the dawn scrubs in flow under 768 px and ends in its final state", async ({
    page,
  }, info) => {
    test.skip(info.project.name !== "390", "in flow under 768 px");
    const errors = collectErrors(page);
    await page.goto(PATHS.fr);
    await shellIdle(page);
    await expect.poll(() => arcsAtRest(page), { timeout: 5000 }).toBe(true);
    expect(await pinSpacers(page)).toBe(0);
    const height = await page.locator(".dawn").evaluate((el) => el.getBoundingClientRect().height);
    await scrubTo(page, height + 10);
    expect(await opacityOf(page.locator(".arcs"))).toBeLessThan(0.02);
    for (const scale of await arcScales(page)) {
      expect(scale).toBeCloseTo(ABOUT.dawn.flow.scale, 2);
    }
    expect(await pinSpacers(page)).toBe(0);
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
  }, info) => {
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
    expect(await pinSpacers(page)).toBe(info.project.name === "1440" ? 1 : 0);
    expect(errors).toEqual([]);
  });

  test("axe at the top, at the end of the dawn's pin and at Right now: no serious or critical issue", async ({
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
    const range = await pinRange(page);
    if (range > 0) {
      await scrubTo(page, range);
      await run("dawn-end");
    }
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
