// The home page at 1440 and 390, in both locales: the loader hands over to the hero intro, each
// beat reaches its end state, the header tone, the 3D layer's state, the shell (header hide,
// tone, cursor label) and the primitives on the real page, no JavaScript, reduced motion, the
// ScrollTrigger baseline and axe.
import AxeBuilder from "@axe-core/playwright";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { expect, test, type Locator, type Page } from "@playwright/test";
import { publicTestimonials } from "@/lib/content/testimonials";
import { heroMedia, mediaCopy } from "@/lib/media";
import { beyond, collectErrors, docTop, liveScrollTriggers } from "./page-helpers";
import { LEGAL_NAME } from "./routes";
import { scrollToY, shellIdle, transitionsSettled, visited } from "./shell-helpers";

interface HomeMessages {
  home: {
    hero: { name: string; intro: string };
    manifesto: { statement: string };
    dusk: { title: string; sub: string };
    featured: {
      title: string;
      cta: string;
      product: string;
      features: Record<"agenda" | "records" | "treatments" | "invoices", string>;
    };
    testimonials: { title: string };
  };
  testimonials: Record<string, { role: string; organisation: string; text: string }>;
  cursor: { write: string };
  nav: { home: string; work: string };
}
const fr: HomeMessages = JSON.parse(readFileSync("messages/fr.json", "utf8"));
const en: HomeMessages = JSON.parse(readFileSync("messages/en.json", "utf8"));
const MESSAGES = { fr, en };
const LOCALES = ["fr", "en"] as const;

const header = (page: Page) => page.locator("header.site-header");
const scene = (page: Page) => page.locator("[data-scene]");

const wordmarkAtRest = (page: Page) =>
  page.locator("[data-hero-word]").evaluate((h) => {
    const letters = [...h.querySelectorAll("[data-hero-letters] div")];
    const still = (el: Element) => {
      const t = getComputedStyle(el).transform;
      if (t === "none") return true;
      const m = new DOMMatrixReadOnly(t);
      return Math.abs(m.m41) < 0.5 && Math.abs(m.m42) < 0.5;
    };
    return (
      letters.length >= 10 &&
      letters.every(still) &&
      parseFloat(getComputedStyle(h).getPropertyValue("--wdth") || "100") === 100
    );
  });

const groupAtRest = (locator: Locator) =>
  locator.evaluate((el) =>
    [...el.children].every((c) => {
      const s = getComputedStyle(c);
      return (
        s.opacity === "1" &&
        (s.transform === "none" || new DOMMatrixReadOnly(s.transform).m42 === 0)
      );
    }),
  );

const wordsLit = (locator: Locator) =>
  locator.evaluate((el) => {
    const words = [...el.querySelectorAll("span")];
    return words.length > 1 && words.every((w) => getComputedStyle(w).opacity === "1");
  });

const linesAtRest = (locator: Locator) =>
  locator.evaluate((el) => {
    const lines = [...el.querySelectorAll("[aria-hidden]")];
    const y = (e: Element) => {
      const t = getComputedStyle(e).transform;
      return t === "none" ? 0 : new DOMMatrixReadOnly(t).m42;
    };
    return lines.length >= 1 && lines.every((l) => Math.abs(y(l)) < 0.5);
  });

const tilesOpen = (page: Page) =>
  page.locator("[data-tile]").evaluateAll((tiles) =>
    tiles.every((t) => {
      const clip = getComputedStyle(t).clipPath;
      const inner = t.querySelector("[data-media-inner]");
      const tf = inner ? getComputedStyle(inner).transform : "none";
      const scale = tf === "none" ? 1 : new DOMMatrixReadOnly(tf).a;
      return (
        (clip === "none" || /^inset\(0(%|px)? /.test(`${clip} `)) && Math.abs(scale - 1) < 0.001
      );
    }),
  );

const matrix = (locator: Locator) =>
  locator.evaluate((el) => {
    const s = getComputedStyle(el);
    const m = new DOMMatrixReadOnly(s.transform === "none" ? undefined : s.transform);
    return { scale: Math.round(m.a * 1000) / 1000, opacity: Number(s.opacity) };
  });

const tokenColour = (page: Page, name: string) =>
  page.evaluate((token) => {
    const probe = document.createElement("span");
    probe.style.color = `var(--${token})`;
    document.body.append(probe);
    const colour = getComputedStyle(probe).color;
    probe.remove();
    return colour;
  }, name);

async function countDraws(page: Page) {
  await page.addInitScript(() => {
    const w = window as unknown as { __draws: number };
    w.__draws = 0;
    for (const C of [window.WebGLRenderingContext, window.WebGL2RenderingContext]) {
      for (const name of ["drawElements", "drawArrays"] as const) {
        const original = C.prototype[name] as (...args: unknown[]) => void;
        Object.defineProperty(C.prototype, name, {
          value(this: unknown, ...args: unknown[]) {
            w.__draws += 1;
            original.apply(this, args);
          },
        });
      }
    }
  });
}
const draws = (page: Page) =>
  page.evaluate(() => (window as unknown as { __draws: number }).__draws);

async function blockWebGL(page: Page) {
  await page.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext;
    Object.defineProperty(HTMLCanvasElement.prototype, "getContext", {
      value(this: HTMLCanvasElement, type: string, ...rest: unknown[]) {
        if (/webgl/i.test(type)) return null;
        return (original as (...args: unknown[]) => unknown).call(this, type, ...rest);
      },
    });
  });
}

test.describe("with motion", () => {
  test.beforeEach(async ({ page }) => {
    test.setTimeout(90_000);
    await visited(page);
  });

  for (const locale of LOCALES) {
    test(`${locale}: the loader hands over to the hero intro, and the 3D layer runs`, async ({
      page,
    }) => {
      const errors = collectErrors(page);
      const m = MESSAGES[locale].home;
      await page.goto(`/${locale}`);
      await shellIdle(page);
      await expect(page.getByRole("heading", { level: 1, name: m.hero.name })).toHaveCount(1);
      await expect.poll(() => wordmarkAtRest(page), { timeout: 8000 }).toBe(true);
      // Reveal (ready): meta and foot.
      await expect
        .poll(() => groupAtRest(page.locator(".hero-meta")), { timeout: 6000 })
        .toBe(true);
      await expect
        .poll(() => groupAtRest(page.locator(".hero-foot")), { timeout: 6000 })
        .toBe(true);
      await expect(page.locator(".hero-intro")).toHaveText(m.hero.intro);
      // The sun has risen and the sky is behind the page.
      await expect(page.locator("html")).toHaveClass(/\bsky\b/);
      await expect
        .poll(() => page.locator(".sun-glow").evaluate((el) => getComputedStyle(el).opacity))
        .toBe("1");
      // The 3D layer: live, visible, rendering.
      await expect(scene(page)).toHaveAttribute("data-scene", "live", { timeout: 20_000 });
      await expect
        .poll(() => page.locator(".scene-canvas").evaluate((el) => getComputedStyle(el).opacity), {
          timeout: 6000,
        })
        .toBe("1");
      await expect(page.locator(".scene-poster")).toBeHidden();
      expect(errors).toEqual([]);
    });
  }

  test("each beat reaches its end state when scrolled, without console errors", async ({
    page,
  }) => {
    const errors = collectErrors(page);
    const m = MESSAGES.fr.home;
    await page.goto("/fr");
    await shellIdle(page);

    // Hero scrolled away: the wordmark has settled (Scrub), the meta has faded.
    await beyond(page, page.locator("#hero"));
    await expect
      .poll(() => matrix(page.locator(".hero-word-wrap")))
      .toEqual({
        scale: 0.92,
        opacity: 1,
      });
    await expect
      .poll(() => matrix(page.locator(".hero-meta").locator("..")))
      .toMatchObject({
        opacity: 0,
      });

    // Manifesto: every word lit at the end of the section; the 3D layer dimmed to 0.3.
    const manifesto = page.locator("#manifesto");
    await expect
      .poll(() => page.locator("#scene-wrap").evaluate((el) => getComputedStyle(el).opacity))
      .toBe("0.3");
    const mTop = await docTop(manifesto);
    const mHeight = await manifesto.evaluate((el) => el.getBoundingClientRect().height);
    const vh = await page.evaluate(() => window.innerHeight);
    await scrollToY(page, mTop + mHeight - vh + 5);
    await expect.poll(() => wordsLit(manifesto.locator("[data-words-light]"))).toBe(true);

    // Dusk: the sky is night, the title lines have risen and turned moon, the sub is moon-soft.
    const dusk = page.locator("#dusk");
    await beyond(page, dusk);
    const [night, moon, moonSoft] = await Promise.all([
      tokenColour(page, "night"),
      tokenColour(page, "moon"),
      tokenColour(page, "moon-soft"),
    ]);
    await expect
      .poll(() => page.locator("#sky").evaluate((el) => getComputedStyle(el).backgroundColor))
      .toBe(night);
    const title = dusk.locator("[data-dusk-title]");
    await expect.poll(() => linesAtRest(title)).toBe(true);
    await expect.poll(() => title.evaluate((el) => getComputedStyle(el).color)).toBe(moon);
    const sub = dusk.locator("[data-dusk-sub]");
    await expect.poll(() => sub.evaluate((el) => getComputedStyle(el).color)).toBe(moonSoft);
    await expect.poll(() => sub.evaluate((el) => getComputedStyle(el).opacity)).toBe("1");
    // SplitReveal keeps the heading's accessible name.
    await expect(title).toHaveAccessibleName(m.dusk.title);
    // The slabs have flown and the canvas has stopped.
    await expect
      .poll(() => page.locator(".scene-canvas").evaluate((el) => getComputedStyle(el).visibility))
      .toBe("hidden");

    expect(errors).toEqual([]);
  });

  test("the featured screens open, and the stages are sticky on desktop, in flow on mobile", async ({
    page,
  }, info) => {
    const mobile = info.project.name === "390";
    await page.goto("/fr");
    await shellIdle(page);
    const layout = await page.evaluate(() => {
      const stage = (id: string) => {
        const el = document.getElementById(id);
        const pin = el?.querySelector<HTMLElement>(":scope > [data-stage-pin]");
        return {
          height: el?.getBoundingClientRect().height ?? 0,
          pinHeight: pin?.getBoundingClientRect().height ?? 0,
          position: pin ? getComputedStyle(pin).position : "",
        };
      };
      return {
        vh: window.innerHeight,
        manifesto: stage("manifesto"),
        dusk: stage("dusk"),
        featured: stage("featured"),
      };
    });
    expect(layout.manifesto.position).toBe("sticky");
    expect(layout.manifesto.height).toBeCloseTo(layout.vh * 2.4, -1);
    expect(layout.dusk.position).toBe("sticky");
    expect(layout.dusk.height).toBeCloseTo(layout.vh * 1.9, -1);
    if (mobile) {
      expect(layout.featured.position).toBe("static");
      expect(layout.featured.height).toBeCloseTo(layout.featured.pinHeight, 0);
    } else {
      expect(layout.featured.position).toBe("sticky");
      expect(layout.featured.height).toBeCloseTo(layout.vh * 3, -1);
    }

    expect(await tilesOpen(page)).toBe(false);
    const featured = page.locator("#featured");
    if (mobile) {
      await beyond(page, featured);
    } else {
      const top = await docTop(featured);
      await scrollToY(page, top + layout.featured.height - layout.vh + 5);
    }
    await expect.poll(() => tilesOpen(page)).toBe(true);
    await expect.poll(() => groupAtRest(page.locator("[data-featured-copy]"))).toBe(true);
    const cta = page.getByRole("link", { name: MESSAGES.fr.home.featured.cta });
    await expect(cta).toHaveAttribute("href", "/fr/projets/dentaflow");
    await expect(cta).toHaveAttribute("data-cursor", MESSAGES.fr.home.featured.cta);
  });

  test("the header turns to night at the dusk's centre and nowhere earlier", async ({ page }) => {
    await page.goto("/fr");
    await shellIdle(page);
    const dusk = page.locator("#dusk");
    const top = await docTop(dusk);
    const height = await dusk.evaluate((el) => el.getBoundingClientRect().height);
    // "center 50px": the section's centre at the header line.
    const centre = top + height / 2 - 50;
    const toneAt = async (y: number) => {
      await scrollToY(page, y);
      await page.waitForTimeout(250);
      return header(page).getAttribute("data-tone");
    };
    const samples: [number, string][] = [];
    for (let y = 0; y < centre - 60; y += 400) samples.push([y, (await toneAt(y)) ?? ""]);
    samples.push([centre - 60, (await toneAt(centre - 60)) ?? ""]);
    expect(samples.filter(([, tone]) => tone !== "day")).toEqual([]);

    await expect.poll(() => toneAt(centre + 60)).toBe("night");
    await expect(page.locator(".cursor")).toHaveAttribute("data-tone", "night");
    await expect(page.locator("nav.pill")).toHaveAttribute("data-tone", "night");
    // Night from there to the footer.
    const end = await page.evaluate(() => document.documentElement.scrollHeight);
    for (let y = centre + 60; y < end; y += 500) expect(await toneAt(y)).toBe("night");
    // And back to day at the top.
    await expect.poll(() => toneAt(0)).toBe("day");
  });

  test("the header hides on scroll down past 240 px and returns on any scroll up", async ({
    page,
  }) => {
    await page.goto("/fr");
    await shellIdle(page);
    await scrollToY(page, 200);
    await scrollToY(page, 230);
    await expect(header(page)).not.toHaveClass(/is-hidden/);
    await scrollToY(page, 900);
    await expect(header(page)).toHaveClass(/is-hidden/);
    await scrollToY(page, 880);
    await expect(header(page)).not.toHaveClass(/is-hidden/);
  });

  test("the header never hides while focus is inside it", async ({ page }) => {
    await page.goto("/fr");
    await shellIdle(page);
    await header(page).getByRole("link", { name: "Contact" }).focus();
    await scrollToY(page, 600);
    await scrollToY(page, 1200);
    await expect(header(page)).not.toHaveClass(/is-hidden/);
  });

  test("the cursor shows the label of the hovered element on a fine pointer", async ({
    page,
  }, info) => {
    test.skip(info.project.name !== "1440", "fine pointers only");
    await page.goto("/fr");
    await shellIdle(page);
    const target = page.locator(".hero-actions [data-cursor]");
    const box = await target.boundingBox();
    if (!box) throw new Error("cursor target not laid out");
    await page.mouse.move(box.x - 40, box.y - 40);
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2, { steps: 5 });
    const cursor = page.locator(".cursor");
    await expect(cursor).toHaveClass(/is-label/);
    await expect(cursor.locator("[data-cursor-label]")).toHaveText(MESSAGES.fr.cursor.write);
    await page.mouse.move(5, 5, { steps: 3 });
    await expect(cursor).not.toHaveClass(/is-label/);
  });

  test("ScrollTriggers return to their baseline after leaving the home page and coming back", async ({
    page,
  }) => {
    const errors = collectErrors(page);
    const settle = () => page.waitForTimeout(800);
    // A page with few triggers as the baseline. work.spec.ts runs the same round trip from there.
    await page.goto("/fr/contact");
    await shellIdle(page);
    await settle();
    const baseline = await liveScrollTriggers(page);

    await page.goto("/fr");
    await shellIdle(page);
    await settle();
    const home = await liveScrollTriggers(page);
    expect(home).toBeGreaterThan(baseline);

    await page.locator('a:visible[href="/fr/contact"]').first().click();
    await page.waitForURL(/\/fr\/contact$/);
    await shellIdle(page);
    await settle();
    expect(await liveScrollTriggers(page)).toBe(baseline);
    // Leaving removed the sky and released the scene.
    await expect(page.locator("html")).not.toHaveClass(/\bsky\b/);
    expect(await page.locator(".scene-canvas").count()).toBe(0);

    await page.goBack();
    await page.waitForURL(/\/fr$/);
    await shellIdle(page);
    await settle();
    expect(await liveScrollTriggers(page)).toBe(home);
    await expect(scene(page)).toHaveAttribute("data-scene", "live", { timeout: 20_000 });
    expect(errors).toEqual([]);
  });

  test("without WebGL the layer shows the poster and never loads the scene", async ({ page }) => {
    const errors = collectErrors(page);
    const chunks: string[] = [];
    page.on("request", (r) => {
      if (r.resourceType() === "script") chunks.push(r.url());
    });
    await blockWebGL(page);
    await page.goto("/fr");
    await shellIdle(page);
    await expect(scene(page)).toHaveAttribute("data-scene", "poster");
    const poster = page.locator(".scene-poster");
    await expect(poster).toBeVisible();
    await expect
      .poll(() => poster.evaluate((img: HTMLImageElement) => img.naturalWidth))
      .toBeGreaterThan(0);
    expect(await page.locator(".scene-canvas").count()).toBe(0);
    // The poster scrolls away with the hero instead of staying fixed.
    await expect
      .poll(() => page.locator("#scene-wrap").evaluate((el) => getComputedStyle(el).position))
      .toBe("absolute");
    expect(errors).toEqual([]);
  });

  for (const locale of LOCALES) {
    test(`${locale}: axe after the loader, over the canvas and in the moonlit dusk`, async ({
      page,
    }, info) => {
      await page.goto(`/${locale}`);
      await shellIdle(page);
      await expect(scene(page)).toHaveAttribute("data-scene", "live", { timeout: 20_000 });
      await expect.poll(() => wordmarkAtRest(page), { timeout: 8000 }).toBe(true);
      const tags = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa", "best-practice"];
      const findings: {
        at: string;
        rule: string;
        target: string;
        ratio?: number;
        fg?: string;
        bg?: string;
      }[] = [];
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
              const data:
                { contrastRatio?: number; fgColor?: string; bgColor?: string } | undefined =
                node.any[0]?.data;
              findings.push({
                at,
                rule: v.id,
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
      // Hero: text over the canvas.
      await run("hero");
      // The end of the dusk: moon text on the night sky.
      await beyond(page, page.locator("#dusk"));
      await page.waitForTimeout(1500);
      await run("dusk end");

      mkdirSync("test-results/home", { recursive: true });
      writeFileSync(
        `test-results/home/axe-${locale}-${info.project.name}.json`,
        `${JSON.stringify(findings, null, 2)}\n`,
      );
      if (findings.length > 0) {
        info.annotations.push({
          type: "axe contrast",
          description: findings.map((f) => `${f.at} ${f.target} ${String(f.ratio)}:1`).join("; "),
        });
      }
      expect(others).toEqual([]);
      // No contrast finding either: the night sections keep their own background outside the dusk.
      expect(findings.map((f) => `${f.at} ${f.target} ${String(f.ratio)}:1`)).toEqual([]);
    });
  }
});

test.describe("reduced motion", () => {
  test.use({ reducedMotion: "reduce" });

  test("one still frame, no ticker work, nothing sticky or hidden", async ({ page }) => {
    const errors = collectErrors(page);
    await visited(page);
    await countDraws(page);
    await page.goto("/fr");
    await shellIdle(page);
    await expect(scene(page)).toHaveAttribute("data-scene", /^(still|poster)$/, {
      timeout: 20_000,
    });
    const still = (await scene(page).getAttribute("data-scene")) === "still";
    if (still) {
      await expect(page.locator(".scene-canvas")).toBeVisible();
      const first = await draws(page);
      expect(first).toBeGreaterThan(0);
      await page.waitForTimeout(1500);
      expect(await draws(page), "no frame after the still one").toBe(first);
    }
    await expect(page.locator("html")).not.toHaveClass(/\b(sky|motion)\b/);
    const report = await page.evaluate(() => ({
      sticky: [...document.querySelectorAll("[data-stage-pin]")].filter(
        (el) => getComputedStyle(el).position === "sticky",
      ).length,
      hidden: [...document.querySelectorAll("main *")].filter((el) => {
        if (el.closest("[hidden]")) return false;
        const s = getComputedStyle(el);
        return s.visibility === "hidden" || Number(s.opacity) === 0;
      }).length,
      split: document.querySelectorAll("main [data-hero-letters] div, main [data-words-light] span")
        .length,
    }));
    expect(report).toEqual({ sticky: 0, hidden: 0, split: 0 });
    // Scrolled through, still nothing moves.
    await scrollToY(page, 3000);
    await page.waitForTimeout(800);
    expect(await matrix(page.locator(".hero-word-wrap"))).toEqual({ scale: 1, opacity: 1 });
    if (still) {
      const before = await draws(page);
      await page.waitForTimeout(800);
      expect(await draws(page)).toBe(before);
    }
    expect(errors).toEqual([]);
  });
  test("testimonials: a plain list, every quote visible and still", async ({ page }) => {
    await page.goto("/fr");
    await shellIdle(page);
    expect(await plainList(page)).toEqual(PLAIN_LIST);
  });
});

// The testimonials: with scroll-driven animation support and motion, one sticky stage where the
// quotes replace each other on scroll; otherwise a plain list. One clip per width, to compare
// with the prototype.
const quotes = (page: Page) => page.locator("#testimonials figure");

const PLAIN_LIST = { figures: 3, visible: true, sticky: false, animations: 0, apart: true };

/** Every quote fully visible and still, nothing sticky or animated, each 48 to 96 px below the one
    before, so none overlaps. */
const plainList = (page: Page) =>
  page.locator("#testimonials").evaluate((section) => {
    const figures = [...section.querySelectorAll("figure")];
    const parts = figures.flatMap((f) => [
      f,
      ...f.querySelectorAll("blockquote, figcaption, .w, .w > span"),
    ]);
    const boxes = figures.map((f) => f.getBoundingClientRect());
    return {
      figures: figures.length,
      visible: parts.every((el) => {
        const s = getComputedStyle(el);
        return s.opacity === "1" && s.transform === "none";
      }),
      sticky: [...section.querySelectorAll("*")].some(
        (el) => getComputedStyle(el).position === "sticky",
      ),
      animations: section.getAnimations({ subtree: true }).length,
      apart: boxes.slice(1).every((box, i) => {
        const gap = box.top - (boxes[i]?.bottom ?? Infinity);
        return gap >= 47.5 && gap <= 96.5;
      }),
    };
  });

/** Scrolls to a fraction of the track's cover range, the range its CSS animations use. */
async function toCover(page: Page, progress: number): Promise<void> {
  const { top, height, vh } = await page.locator(".quotes-track").evaluate((el) => ({
    top: el.getBoundingClientRect().top + window.scrollY,
    height: el.getBoundingClientRect().height,
    vh: window.innerHeight,
  }));
  await scrollToY(page, top - vh + progress * (height + vh));
}

/** Per quote: "shown" when it and its caption are opaque and every word has risen, "hidden" when
    it has faded out or no word has risen yet, "between" otherwise. */
const quoteStates = (page: Page) =>
  quotes(page).evaluateAll((figures) =>
    figures.map((f) => {
      const opacity = (el: Element | null) => {
        let o = 1;
        for (let n = el; n; n = n.parentElement) o *= Number(getComputedStyle(n).opacity);
        return el ? o : 0;
      };
      const words = [...f.querySelectorAll(".w > span")];
      const risen = words.filter((w) => {
        const t = getComputedStyle(w).transform;
        return t === "none" || Math.abs(new DOMMatrixReadOnly(t).m42) < 0.5;
      }).length;
      const figure = opacity(f);
      const caption = opacity(f.querySelector("figcaption"));
      if (figure > 0.99 && caption > 0.99 && risen === words.length) return "shown";
      if (figure < 0.01 || (risen === 0 && caption < 0.01)) return "hidden";
      return "between";
    }),
  );

/** The shown quote sits between the heading and the bar, and the heading clears the header. The
    header's layout height is used, not its box, which slides up while scrolling down. */
const stageFits = (page: Page) =>
  page.locator(".quotes-stage").evaluate((stage) => {
    const box = (el: Element | null | undefined) => el?.getBoundingClientRect();
    const heading = box(stage.querySelector("h2"));
    const bar = box(stage.querySelector(".q-bar"));
    const header = document.querySelector<HTMLElement>("header.site-header");
    const shown = [...stage.querySelectorAll("figure")].find(
      (f) => Number(getComputedStyle(f).opacity) > 0.99,
    );
    const quote = box(shown?.querySelector("blockquote"));
    const caption = box(shown?.querySelector("figcaption"));
    if (!heading || !bar || !header || !quote || !caption) return false;
    return (
      heading.top >= header.offsetHeight - 0.5 &&
      quote.top >= heading.bottom - 0.5 &&
      caption.bottom <= bar.top + 0.5
    );
  });

test.describe("testimonials with motion", () => {
  test("the quotes replace each other on scroll, and back", async ({ browser }, info) => {
    test.setTimeout(90_000);
    // Its own context, so only this test records a clip.
    const { baseURL, viewport, deviceScaleFactor, isMobile, hasTouch, userAgent } =
      info.project.use;
    const context = await browser.newContext({
      baseURL,
      viewport,
      deviceScaleFactor,
      isMobile,
      hasTouch,
      userAgent,
      recordVideo: { dir: "test-results/artifacts/video", size: viewport ?? undefined },
    });
    const page = await context.newPage();
    const errors = collectErrors(page);
    await visited(page);
    await page.goto("/fr");
    await shellIdle(page);
    await expect(quotes(page)).toHaveCount(3);
    const supported = await page.evaluate(() => CSS.supports("animation-timeline", "view()"));
    test.skip(!supported, "no CSS scroll-driven animations; the plain list is covered elsewhere");

    expect(
      await page.locator(".quotes-stage").evaluate((el) => getComputedStyle(el).position),
    ).toBe("sticky");
    // Scrolled through in steps, so the clip shows the quotes arriving.
    for (let p = 0; p <= 1; p += 0.02) {
      await toCover(page, p);
      await page.waitForTimeout(60);
    }
    const at = async (progress: number, states: string[]) => {
      await toCover(page, progress);
      await expect
        .poll(() => quoteStates(page), { message: `at ${String(progress)}` })
        .toEqual(states);
      expect(await stageFits(page), `fits at ${String(progress)}`).toBe(true);
    };
    // The second quote starts fading at 52 % (QUOTES.fades), so it is checked at 50 %; the stage
    // unsticks at 79 % of cover on phones, so the end is checked at 78 %.
    await at(0.3, ["shown", "hidden", "hidden"]);
    await at(0.5, ["hidden", "shown", "hidden"]);
    await at(0.78, ["hidden", "hidden", "shown"]);
    await at(0.5, ["hidden", "shown", "hidden"]);
    await at(0.3, ["shown", "hidden", "hidden"]);

    await toCover(page, 0.5);
    const axe = await new AxeBuilder({ page })
      .include("#testimonials")
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa", "best-practice"])
      .analyze();
    const serious = axe.violations
      .filter((v) => v.impact === "serious" || v.impact === "critical")
      .map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`);
    expect(serious).toEqual([]);
    expect(errors).toEqual([]);

    const video = page.video();
    await context.close();
    mkdirSync("test-results/home", { recursive: true });
    await video?.saveAs(`test-results/home/testimonials-${info.project.name}.webm`);
  });
});

test("testimonials: no horizontal scroll at 320, 390 and 1440", async ({ page }, info) => {
  const widths = info.project.name === "390" ? [390, 320] : [1440];
  for (const width of widths) {
    await page.setViewportSize({ width, height: info.project.name === "390" ? 844 : 900 });
    for (const locale of LOCALES) {
      await page.goto(`/${locale}`);
      await shellIdle(page);
      for (const progress of [0.3, 0.5, 0.8]) {
        await toCover(page, progress);
        const overflow = await page.evaluate(() => ({
          page: document.documentElement.scrollWidth - document.documentElement.clientWidth,
          quotes: [...document.querySelectorAll("#testimonials blockquote p")].filter(
            (p) => p.scrollWidth > p.clientWidth + 1,
          ).length,
        }));
        expect(overflow, `${locale} at ${String(width)}, ${String(progress)}`).toEqual({
          page: 0,
          quotes: 0,
        });
      }
    }
  }
});

test("testimonials: nothing focusable inside, and Tab goes on to the footer", async ({ page }) => {
  await page.goto("/fr");
  await shellIdle(page);
  expect(
    await page
      .locator("#testimonials")
      .locator("a, button, input, select, textarea, [tabindex]")
      .count(),
  ).toBe(0);
  const next = page.locator("footer").locator("a, button").first();
  // From the last focusable element before the section, one Tab lands in the footer.
  await page.evaluate(() => {
    const section = document.querySelector("#testimonials");
    const before = [...document.querySelectorAll<HTMLElement>("main a, main button")].filter(
      (el) =>
        section !== null &&
        (el.compareDocumentPosition(section) & Node.DOCUMENT_POSITION_FOLLOWING) !== 0,
    );
    before.at(-1)?.focus();
  });
  await page.keyboard.press("Tab");
  await expect(next).toBeFocused();
  // And on through the footer to its last control.
  const count = await page.locator("footer").locator("a, button").count();
  for (let i = 1; i < count; i++) await page.keyboard.press("Tab");
  await expect(page.locator("footer").locator("a, button").last()).toBeFocused();
});

test.describe("without JavaScript", () => {
  test.use({ javaScriptEnabled: false });

  // The three confirmed testimonials, in order: the quote, then the role and the organisation,
  // nothing else (no field exists for a person's name). The quote, split into words, still reads
  // as the exact message text.
  for (const locale of LOCALES) {
    test(`${locale}: three testimonials in order with their role and organisation`, async ({
      page,
    }) => {
      const messages = MESSAGES[locale].testimonials;
      const ids = publicTestimonials().map((t) => t.id);
      expect(ids).toEqual(["festival", "ophtachusm", "sos-dental"]);
      await page.goto(`/${locale}`);
      await expect(quotes(page)).toHaveCount(3);
      for (const [i, id] of ids.entries()) {
        const figure = quotes(page).nth(i);
        const quote = messages[id];
        expect(quote, id).toBeDefined();
        await expect(figure).toHaveAttribute("data-testimonial", id);
        expect(await figure.locator("blockquote").textContent()).toBe(quote?.text);
        await expect(figure.locator(".q-role")).toHaveText(quote?.role ?? "");
        await expect(figure.locator(".q-org")).toHaveText(quote?.organisation ?? "");
        await expect(figure.locator("[aria-hidden]")).toHaveText(["“", `0${String(i + 1)} / 03`]);
        // Nothing else: no name, no rating.
        await expect(figure).toHaveText(
          `“${quote?.text ?? ""}0${String(i + 1)} / 03${quote?.role ?? ""}${quote?.organisation ?? ""}`,
        );
      }
      await expect(page.locator("html")).toHaveAttribute("lang", locale);
      expect(await plainList(page)).toEqual(PLAIN_LIST);
      const jsonLd = await page.locator('script[type="application/ld+json"]').allTextContents();
      expect(jsonLd.join("")).not.toMatch(/"(Review|reviewRating|aggregateRating|review)"/);
      expect(await page.content()).not.toContain("[TODO");
    });
  }

  for (const locale of LOCALES) {
    test(`${locale}: the page is complete and the poster is visible`, async ({ page }) => {
      const m = MESSAGES[locale].home;
      await page.goto(`/${locale}`);
      await expect(page.getByRole("heading", { level: 1, name: m.hero.name })).toBeVisible();
      await expect(page.locator(".hero-intro")).toHaveText(m.hero.intro);
      await expect(page.locator("#manifesto")).toContainText(m.manifesto.statement);
      await expect(page.locator("#dusk")).toContainText(m.dusk.title);
      await expect(page.locator("#dusk")).toContainText(m.dusk.sub);
      await expect(page.locator("#featured")).toContainText(m.featured.product);
      await expect(page.getByRole("heading", { level: 2, name: m.featured.title })).toBeVisible();
      await expect(page.locator("[data-tile]")).toHaveCount(4);
      const f = m.featured.features;
      await expect(page.locator("#featured .features li")).toHaveText([
        f.agenda,
        f.records,
        f.treatments,
        f.invoices,
      ]);
      await expect(page.locator("footer")).toContainText(LEGAL_NAME);
      await expect(page.locator(".scene-poster")).toBeVisible();
      await expect(scene(page)).toHaveAttribute("data-scene", "loading");
      const hidden = await page.locator("main *").evaluateAll(
        (els) =>
          els.filter((el) => {
            if (el.closest("[hidden]")) return false;
            const s = getComputedStyle(el);
            return s.visibility === "hidden" || Number(s.opacity) === 0;
          }).length,
      );
      expect(hidden).toBe(0);
    });
  }
});

test.describe("featured screens without JavaScript", () => {
  test.use({ javaScriptEnabled: false });
  const HOME = { fr: "/fr", en: "/en" } as const;
  const TILES = heroMedia("dentaflow", "home");

  for (const locale of LOCALES) {
    test(`${locale}: each mapped tile shows its screen in the server HTML, the others a skeleton`, async ({
      page,
    }) => {
      await page.goto(HOME[locale]);
      const tiles = page.locator("[data-tile]");
      await expect(tiles).toHaveCount(4);
      for (let i = 0; i < 4; i++) {
        const tile = tiles.nth(i);
        const item = TILES[i];
        if (!item || item.asset.kind !== "image") {
          await expect(tile.locator('[data-placeholder="screen"]')).toHaveCount(1);
          continue;
        }
        await expect(tile.locator('[data-placeholder="screen"]')).toHaveCount(0);
        const img = tile.locator("img");
        await expect(img).toHaveAttribute("alt", mediaCopy(MESSAGES[locale], item.key).alt);
        await expect(img).toHaveAttribute("width", String(item.asset.width));
        await expect(img).toHaveAttribute("height", String(item.asset.height));
      }
    });
  }
});
