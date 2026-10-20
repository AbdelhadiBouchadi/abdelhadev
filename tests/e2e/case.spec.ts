// The DentaFlow case study at 1440 and 390, in both locales: the hero, the tour, the diagram, the
// next-project link, the 404s, the real screens, reduced motion, no JavaScript and axe.
import AxeBuilder from "@axe-core/playwright";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { expect, test, type Locator, type Page } from "@playwright/test";
import { getCaseStudy } from "@/lib/content/case-studies";
import { nextProject } from "@/lib/content/projects";
import { heroMedia, mediaCopy, tourMedia } from "@/lib/media";
import { beyond, bring, collectErrors, liveScrollTriggers } from "./page-helpers";
import { LEGAL_NAME } from "./routes";
import { shellIdle, transitionsSettled, visited } from "./shell-helpers";

interface CaseMessages {
  footer: { cta: string };
  projects: Record<string, { name: string }> & {
    dentaflow: {
      name: string;
      case: {
        footer: string;
        tour: Record<string, { title: string; text: string }>;
        adapt: { fourth: { title: string; text: string } };
        arch: { access: { title: string; text: string } };
      };
    };
  };
}
const MESSAGES: Record<"fr" | "en", CaseMessages> = {
  fr: JSON.parse(readFileSync("messages/fr.json", "utf8")),
  en: JSON.parse(readFileSync("messages/en.json", "utf8")),
};
const PATHS = { fr: "/fr/projets/dentaflow", en: "/en/work/dentaflow" } as const;
const WORK = { fr: "/fr/projets", en: "/en/work" } as const;
const LOCALES = ["fr", "en"] as const;
const study = getCaseStudy("dentaflow");
if (!study) throw new Error("the DentaFlow case study is missing");
const KEYS = study.tour.map((s) => s.key);
/** By step, from 1. */
const TOUR = tourMedia("dentaflow");
const HERO = heroMedia("dentaflow", "case")[0];
const NEXT = nextProject("dentaflow")?.slug ?? "";
const DIM = 0.88;

const steps = (page: Page) => page.locator(".tour-step");
const slots = (page: Page) => page.locator("[data-tour-slot]");

const lettersAtRest = (locator: Locator) =>
  locator.evaluate((el) =>
    [...el.querySelectorAll<HTMLElement>("*")].every((c) => {
      const t = getComputedStyle(c).transform;
      return t === "none" || Math.abs(new DOMMatrixReadOnly(t).m42) < 0.5;
    }),
  );

const mediaOpen = (locator: Locator) =>
  locator.evaluate((el) => {
    const clip = getComputedStyle(el).clipPath;
    const inner = el.querySelector("[data-media-inner]");
    const t = inner ? getComputedStyle(inner).transform : "none";
    const scale = t === "none" ? 1 : new DOMMatrixReadOnly(t).a;
    return (clip === "none" || /^inset\(0(%|px)? /.test(`${clip} `)) && Math.abs(scale - 1) < 0.001;
  });

const atRest = (locator: Locator) =>
  locator.evaluate((el) =>
    [el, ...el.children].every((c) => {
      const s = getComputedStyle(c);
      return (
        s.opacity === "1" &&
        (s.transform === "none" || new DOMMatrixReadOnly(s.transform).m42 === 0)
      );
    }),
  );

const slotOpacities = (page: Page) =>
  slots(page).evaluateAll((els) =>
    els.map((el) => Math.round(Number(getComputedStyle(el).opacity) * 100) / 100),
  );

const stepOpacities = (page: Page) =>
  steps(page).evaluateAll((els) =>
    els.map((el) => Math.round(Number(getComputedStyle(el).opacity) * 100) / 100),
  );

/** DrawSVG's dash covers the whole path, or the wire was never collapsed: no dash, or the soft
    wires' CSS dash, whose gap is shorter than the path, unlike any state DrawSVG writes. */
const diagramDrawn = (locator: Locator) =>
  locator.evaluate((el) => {
    const nodes = [...el.querySelectorAll("[data-node]")];
    const wires = [...el.querySelectorAll<SVGPathElement>("[data-wire]")];
    const drawn = (w: SVGPathElement) => {
      const s = getComputedStyle(w);
      if (s.visibility !== "visible") return false;
      if (s.strokeDasharray === "none") return true;
      const [dash = 0, gap = 0] = s.strokeDasharray.split(/[ ,]+/).map(parseFloat);
      const length = w.getTotalLength();
      if (parseFloat(s.strokeDashoffset) !== 0) return false;
      return dash >= length - 1 || (dash > 0 && gap < length - 1);
    };
    return (
      nodes.length === 6 &&
      wires.length === 6 &&
      nodes.every((n) => getComputedStyle(n).opacity === "1") &&
      wires.every(drawn)
    );
  });

const topInView = (locator: Locator) => locator.evaluate((el) => el.getBoundingClientRect().top);
const scrollMargin = (locator: Locator) =>
  locator.evaluate((el) => parseFloat(getComputedStyle(el).scrollMarginTop));

test.describe("with motion", () => {
  test.beforeEach(async ({ page }) => {
    test.setTimeout(90_000);
    await visited(page);
  });

  for (const locale of LOCALES) {
    test(`${locale}: the name and the first screen reach their end state after the loader`, async ({
      page,
    }) => {
      const errors = collectErrors(page);
      const m = MESSAGES[locale];
      await page.goto(PATHS[locale]);
      await shellIdle(page);
      const h1 = page.getByRole("heading", { level: 1 });
      await expect(h1).toHaveAccessibleName(m.projects.dentaflow.name);
      await expect.poll(() => lettersAtRest(h1), { timeout: 5000 }).toBe(true);
      const shot = page.locator('[data-media-reveal="intro"]');
      await expect.poll(() => mediaOpen(shot), { timeout: 5000 }).toBe(true);
      await expect.poll(() => atRest(page.locator(".case-intro"))).toBe(true);
      await expect(page.locator("footer h2").first()).toHaveAccessibleName(
        m.projects.dentaflow.case.footer,
      );
      expect(errors).toEqual([]);
    });
  }

  test("desktop: the step being read is active and its screen alone is on the stage", async ({
    page,
  }, info) => {
    test.skip(info.project.name !== "1440", "the stage shows from 901 px");
    const errors = collectErrors(page);
    await page.goto(PATHS.fr);
    await shellIdle(page);
    await expect(page.locator(".tour-stage")).toBeVisible();
    await expect(page.locator(".tour-shot").first()).toBeHidden();
    // Before the first step reaches the line, nothing is dimmed and the first screen shows.
    expect(await stepOpacities(page)).toEqual(KEYS.map(() => 1));
    expect(await slotOpacities(page)).toEqual(KEYS.map((_, i) => (i === 0 ? 1 : 0)));

    const tour = page.locator("[data-tour]");
    for (const [i, key] of KEYS.entries()) {
      await bring(page, page.locator(`#tour-${key}`), 0.45);
      await expect(tour).toHaveAttribute("data-tour-active", String(i));
      await expect(page.locator(".tour-step[data-on]")).toHaveAttribute("id", `tour-${key}`);
      await expect
        .poll(() => slotOpacities(page), { message: key })
        .toEqual(KEYS.map((_, j) => (j === i ? 1 : 0)));
      await expect
        .poll(() => stepOpacities(page), { message: key })
        .toEqual(KEYS.map((_, j) => (j === i ? 1 : DIM)));
      // The stage stays in view (sticky) all the way down.
      expect(await topInView(page.locator(".tour-stage"))).toBeGreaterThan(0);
    }
    expect(errors).toEqual([]);
  });

  test("phones: no stage, one inline screen per step, nothing dimmed", async ({ page }, info) => {
    test.skip(info.project.name !== "390", "phones only");
    await page.goto(PATHS.fr);
    await shellIdle(page);
    await expect(page.locator(".tour-stage")).toBeHidden();
    const shots = page.locator(".tour-shot");
    await expect(shots).toHaveCount(KEYS.length);
    for (const key of KEYS) {
      await bring(page, page.locator(`#tour-${key}`), 0.45);
      await expect(page.locator(`#tour-${key} .tour-shot`)).toBeVisible();
    }
    expect(await stepOpacities(page)).toEqual(KEYS.map(() => 1));
  });

  test("the architecture diagram is fully drawn once scrolled through", async ({ page }) => {
    const errors = collectErrors(page);
    await page.goto(PATHS.fr);
    await shellIdle(page);
    const diagram = page.locator("[data-line-draw]");
    expect(await diagramDrawn(diagram)).toBe(false);
    await bring(page, page.locator("#architecture"), 0.3);
    await beyond(page, page.locator("#architecture .arch"));
    await expect.poll(() => diagramDrawn(diagram), { timeout: 5000 }).toBe(true);
    await expect.poll(() => atRest(page.locator(".arch-list"))).toBe(true);
    expect(errors).toEqual([]);
  });

  for (const locale of LOCALES) {
    test(`${locale}: the next project link lands on the next sheet through the curtain`, async ({
      page,
    }) => {
      const m = MESSAGES[locale];
      await page.goto(PATHS[locale]);
      await shellIdle(page);
      const link = page.locator("a.next-project");
      await expect(link).toHaveAttribute("href", `${WORK[locale]}#${NEXT}`);
      await bring(page, link, 0.5);
      await expect(link.locator("h2")).toHaveAccessibleName(m.projects[NEXT]?.name ?? NEXT);
      await link.click();
      await expect(page).toHaveURL(new RegExp(`${WORK[locale]}#${NEXT}$`));
      await shellIdle(page);
      const sheet = page.locator(`#${NEXT}`);
      const margin = await scrollMargin(sheet);
      await expect.poll(() => topInView(sheet), { timeout: 5000 }).toBeCloseTo(margin, -1);
      // The footer is the shell's again after a client-side navigation.
      await expect(page.locator("footer h2").first()).toHaveAccessibleName(m.footer.cta);
    });
  }

  test("ScrollTriggers return to their baseline after leaving the case study and coming back", async ({
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

    await page.goBack();
    await page.waitForURL(new RegExp(`${PATHS.fr}$`));
    await shellIdle(page);
    await settle();
    expect(await liveScrollTriggers(page)).toBe(baseline);
    expect(errors).toEqual([]);
  });

  test("axe at the top and at the architecture: no serious or critical issue, contrast named", async ({
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
    // At the top no step is dimmed yet; at the architecture the tour has been read through, so on
    // desktop every step but the last is dimmed (CASE.tour.dimOpacity).
    await run("top");
    await bring(page, page.locator("#architecture"), 0.1);
    await page.waitForTimeout(1500);
    await run("architecture");

    mkdirSync("test-results/case", { recursive: true });
    writeFileSync(
      `test-results/case/axe-fr-${info.project.name}.json`,
      `${JSON.stringify(contrast, null, 2)}\n`,
    );
    expect(others).toEqual([]);
    expect(contrast.map((f) => `${f.at} ${f.target} ${String(f.ratio)}:1`)).toEqual([]);
  });
});

test("projects without a case study are 404s and are not in the sitemap", async ({ request }) => {
  for (const path of ["/fr/projets/hms", "/en/work/hms", "/fr/projets/cote-royale"]) {
    expect((await request.get(path)).status(), path).toBe(404);
  }
  const xml = await (await request.get("/sitemap.xml")).text();
  expect(xml).toContain("https://abdelhadev.me/fr/projets/dentaflow</loc>");
  expect(xml).not.toContain("/projets/hms");
});

async function complete(page: Page) {
  return page.evaluate(() => {
    const hidden = [...document.querySelectorAll("main *")].filter((el) => {
      if (el.closest("[hidden], .tour-stage")) return false;
      const s = getComputedStyle(el);
      return s.visibility === "hidden" || Number(s.opacity) === 0;
    }).length;
    const clipped = [...document.querySelectorAll("main [data-media-reveal]")].filter(
      (el) => getComputedStyle(el).clipPath !== "none",
    ).length;
    const zoomed = [...document.querySelectorAll("main [data-media-inner]")].filter((el) => {
      if (el.closest(".tour-stage")) return false;
      const t = getComputedStyle(el).transform;
      return t !== "none" && new DOMMatrixReadOnly(t).a !== 1;
    }).length;
    const dimmed = [...document.querySelectorAll(".tour-step")].filter((el) => {
      const s = getComputedStyle(el);
      return (
        s.opacity !== "1" || (s.transform !== "none" && new DOMMatrixReadOnly(s.transform).a !== 1)
      );
    }).length;
    const stage = getComputedStyle(document.querySelector(".tour-stage") ?? document.body).display;
    const shots = [...document.querySelectorAll(".tour-shot")].filter(
      (el) => getComputedStyle(el).display !== "none",
    ).length;
    return { hidden, clipped, zoomed, dimmed, stage, shots };
  });
}

const COMPLETE = { hidden: 0, clipped: 0, zoomed: 0, dimmed: 0, stage: "none", shots: KEYS.length };

const html = (text: string) => text.replaceAll("'", "&#x27;");

test.describe("without JavaScript", () => {
  test.use({ javaScriptEnabled: false });

  for (const locale of LOCALES) {
    test(`${locale}: the raw HTML names the product and every tour step; the page is complete`, async ({
      page,
      request,
    }) => {
      const m = MESSAGES[locale].projects.dentaflow;
      const raw = await (await request.get(PATHS[locale])).text();
      expect(raw).toContain(m.name);
      for (const key of KEYS) expect(raw, key).toContain(html(m.case.tour[key]?.title ?? key));
      expect(raw).toContain(LEGAL_NAME);
      expect(raw).toContain(html(m.case.footer));

      await page.goto(PATHS[locale]);
      await expect(page.locator("h1")).toHaveText(m.name);
      expect(await complete(page)).toEqual(COMPLETE);
    });

    test(`${locale}: the setup card and the roles item carry their real text, no placeholder`, async ({
      request,
    }) => {
      const { adapt, arch } = MESSAGES[locale].projects.dentaflow.case;
      const raw = await (await request.get(PATHS[locale])).text();
      for (const text of [
        adapt.fourth.title,
        adapt.fourth.text,
        arch.access.title,
        arch.access.text,
      ]) {
        expect(raw).toContain(html(text));
      }
      expect(raw).not.toContain("[TODO");
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
    await bring(page, page.locator(`#tour-${KEYS[2] ?? "agenda"}`), 0.45);
    await page.waitForTimeout(800);
    expect(await complete(page)).toEqual(COMPLETE);
    await beyond(page, page.locator("#architecture"));
    await page.waitForTimeout(800);
    expect(await complete(page)).toEqual(COMPLETE);
    expect(await diagramDrawn(page.locator("[data-line-draw]"))).toBe(true);
  });
});

test.describe("tour screens without JavaScript", () => {
  test.use({ javaScriptEnabled: false });

  for (const locale of LOCALES) {
    test(`${locale}: the hero shows its real screen in the server HTML, eager`, async ({
      page,
      request,
    }) => {
      const raw = await (await request.get(PATHS[locale])).text();
      await page.goto(PATHS[locale]);
      const shot = page.locator(".case-shot");
      if (!HERO || HERO.asset.kind !== "image") {
        await expect(shot.locator('[data-placeholder="screen"]')).toHaveCount(1);
        return;
      }
      await expect(shot.locator('[data-placeholder="screen"]')).toHaveCount(0);
      const img = shot.locator("img");
      await expect(img).toHaveAttribute("alt", mediaCopy(MESSAGES[locale], HERO.key).alt);
      await expect(img).toHaveAttribute("width", String(HERO.asset.width));
      await expect(img).toHaveAttribute("height", String(HERO.asset.height));
      await expect(img).toHaveAttribute("loading", "eager");
      expect(raw).toContain(HERO.asset.avif[0]?.src ?? "");
    });

    test(`${locale}: each mapped step shows its screen in the server HTML, the others a skeleton`, async ({
      page,
      request,
    }) => {
      const raw = await (await request.get(PATHS[locale])).text();
      await page.goto(PATHS[locale]);
      for (const [i, key] of KEYS.entries()) {
        const shot = page.locator(`#tour-${key} .tour-shot`);
        const item = TOUR.get(i + 1);
        if (!item || item.asset.kind !== "image") {
          await expect(shot.locator('[data-placeholder="screen"]'), key).toHaveCount(1);
          continue;
        }
        const img = shot.locator("img");
        await expect(img, key).toHaveAttribute("alt", mediaCopy(MESSAGES[locale], item.key).alt);
        await expect(img).toHaveAttribute("width", String(item.asset.width));
        await expect(img).toHaveAttribute("height", String(item.asset.height));
        await expect(img).toHaveAttribute("loading", "lazy");
        expect(raw, key).toContain(item.asset.avif[0]?.src ?? "");
        // The stage copy is decorative (the stage is aria-hidden).
        await expect(page.locator(`[data-tour-slot="${key}"] img`)).toHaveAttribute("alt", "");
      }
    });
  }
});

test("no horizontal overflow, top to bottom", async ({ page }) => {
  await visited(page);
  await page.goto(PATHS.fr);
  await shellIdle(page);
  for (const at of ["top", "tour", "bottom"] as const) {
    if (at === "tour") await bring(page, page.locator("[data-tour]"), 0.1);
    if (at === "bottom") await beyond(page, page.locator("#architecture"));
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow, at).toBeLessThanOrEqual(0);
  }
});
