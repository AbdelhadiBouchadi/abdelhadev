// Videos and stills of the home page's motion in test-results/motion/, to compare with
// docs/prototype/index.html. Each clip opens its own context at the size it shows.
import { mkdirSync } from "node:fs";
import { test, type Page } from "@playwright/test";
import { DESKTOP, MOTION_OUT, PHONE, record, wheel } from "./motion-helpers";
import { scrollToY, shellIdle } from "./shell-helpers";

test.describe.configure({ mode: "serial" });
test.beforeEach(() => {
  test.skip(test.info().project.name !== "1440", "recorded once");
  test.setTimeout(120_000);
  mkdirSync(MOTION_OUT, { recursive: true });
});

const topOf = (page: Page, selector: string) =>
  page.locator(selector).evaluate((el) => el.getBoundingClientRect().top + window.scrollY);

/** Native scroll, so it works on touch emulation, where wheel does not. */
async function glide(page: Page, from: number, to: number, step = 40) {
  const dir = Math.sign(to - from);
  for (let y = from; dir * (to - y) > 0; y += dir * step) {
    await scrollToY(page, y);
    await page.waitForTimeout(40);
  }
  await scrollToY(page, to);
  await page.waitForTimeout(1200);
}

test("hero intro: the loader hands over to the hero, desktop and 390", async ({ browser }) => {
  for (const [name, size] of [
    ["home-intro-1440", DESKTOP],
    ["home-intro-390", PHONE],
  ] as const) {
    await record(
      browser,
      name,
      size,
      async (page) => {
        await page.goto("/fr");
        await shellIdle(page, 20_000);
        await page.waitForTimeout(2600);
      },
      { visitedSession: false, phone: size === PHONE },
    );
  }
});

test("hero scroll: the wordmark settles, the meta fades, the sun sinks", async ({ browser }) => {
  await record(browser, "home-hero-settle-1440", DESKTOP, async (page) => {
    await page.goto("/fr");
    await shellIdle(page);
    await page.waitForTimeout(2600);
    await page.mouse.move(700, 450);
    await wheel(page, 900, 24);
  });
});

test("manifesto: the words light up while the slabs part and the layer dims", async ({
  browser,
}) => {
  await record(browser, "home-manifesto-1440", DESKTOP, async (page) => {
    await page.goto("/fr");
    await shellIdle(page);
    await page.waitForTimeout(2200);
    await page.mouse.move(700, 450);
    const top = await topOf(page, "#manifesto");
    await wheel(page, top + 900 * 1.4, 48);
  });
});

test("dusk: the sky turns to night and the header follows", async ({ browser }) => {
  await record(browser, "home-dusk-1440", DESKTOP, async (page) => {
    await page.goto("/fr");
    await shellIdle(page);
    const top = await topOf(page, "#dusk");
    await scrollToY(page, top - 900);
    await page.waitForTimeout(800);
    await page.mouse.move(700, 450);
    await wheel(page, 900 * 2.9, 60);
  });
});

test("featured: the screens open one after another, desktop", async ({ browser }) => {
  await record(browser, "home-featured-1440", DESKTOP, async (page) => {
    await page.goto("/fr");
    await shellIdle(page);
    const top = await topOf(page, "#featured");
    await scrollToY(page, top - 200);
    await page.waitForTimeout(800);
    await page.mouse.move(700, 450);
    await wheel(page, 900 * 2.2, 50);
  });
});

test("featured: each screen opens as it enters, 390", async ({ browser }) => {
  await record(
    browser,
    "home-featured-390",
    PHONE,
    async (page) => {
      await page.goto("/fr");
      await shellIdle(page);
      const top = await topOf(page, "#featured");
      await scrollToY(page, top - 400);
      await page.waitForTimeout(600);
      await glide(page, top - 400, top + 1300);
    },
    { phone: true },
  );
});

test("reduced motion: one still frame, no fixed sky", async ({ browser }) => {
  await record(
    browser,
    "home-reduced-1440",
    DESKTOP,
    async (page) => {
      await page.goto("/fr");
      await shellIdle(page);
      await page.waitForSelector("[data-scene=still]", { timeout: 20_000 });
      await page.waitForTimeout(1200);
    },
    { context: { reducedMotion: "reduce" } },
  );
});

test("poster fallback without WebGL", async ({ browser }) => {
  await record(
    browser,
    "home-poster-1440",
    DESKTOP,
    async (page) => {
      await page.goto("/fr");
      await shellIdle(page);
      await page.waitForSelector("[data-scene=poster]");
      await page.waitForTimeout(2600);
    },
    {
      before: async (page) => {
        await page.addInitScript(() => {
          const original = HTMLCanvasElement.prototype.getContext;
          Object.defineProperty(HTMLCanvasElement.prototype, "getContext", {
            value(this: HTMLCanvasElement, type: string, ...rest: unknown[]) {
              if (/webgl/i.test(type)) return null;
              return (original as (...args: unknown[]) => unknown).call(this, type, ...rest);
            },
          });
        });
      },
    },
  );
});
