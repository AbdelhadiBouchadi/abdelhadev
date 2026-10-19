// Videos and stills of the shell's motion in test-results/motion/, to compare with docs/prototype.
// Each clip opens its own context at the size it shows.
import { mkdirSync } from "node:fs";
import { test } from "@playwright/test";
import { DESKTOP, MOTION_OUT, PHONE, record, wheel } from "./motion-helpers";
import { shellIdle } from "./shell-helpers";

test.describe.configure({ mode: "serial" });
test.beforeEach(() => {
  test.skip(test.info().project.name !== "1440", "recorded once");
  test.setTimeout(90_000);
  mkdirSync(MOTION_OUT, { recursive: true });
});

test("first-visit loader to page, desktop and 390", async ({ browser }) => {
  for (const [name, size] of [
    ["loader-first-1440", DESKTOP],
    ["loader-first-390", PHONE],
  ] as const) {
    await record(
      browser,
      name,
      size,
      async (page) => {
        await page.goto("/fr");
        await shellIdle(page);
        await page.waitForTimeout(600);
      },
      { visitedSession: false, phone: size === PHONE },
    );
  }
});

test("route curtain out and in", async ({ browser }) => {
  await record(browser, "curtain-1440", DESKTOP, async (page) => {
    await page.goto("/fr");
    await shellIdle(page);
    await page.locator(".nav-pill").getByRole("link", { name: "Projets" }).click();
    await page.waitForURL(/\/fr\/projets$/);
    await shellIdle(page);
    await page.waitForTimeout(500);
  });
});

test("header hide and return", async ({ browser }) => {
  await record(browser, "header-hide-1440", DESKTOP, async (page) => {
    await page.goto("/fr");
    await shellIdle(page);
    await page.mouse.move(700, 450);
    await wheel(page, 900);
    await wheel(page, -250, 6);
  });
});

test("mobile pill", async ({ browser }) => {
  await record(
    browser,
    "mobile-pill-390",
    PHONE,
    async (page) => {
      await page.goto("/fr/projets");
      await shellIdle(page);
      await page.evaluate(() => {
        window.scrollTo({ top: document.documentElement.scrollHeight, behavior: "smooth" });
      });
      await page.waitForTimeout(1500);
      await page.locator("nav.pill").getByRole("link", { name: "À propos" }).tap();
      await page.waitForURL(/\/fr\/a-propos$/);
      await shellIdle(page);
      await page.waitForTimeout(500);
    },
    { phone: true },
  );
});

test("cursor label", async ({ browser }) => {
  await record(browser, "cursor-label-1440", DESKTOP, async (page) => {
    await page.goto("/fr");
    await shellIdle(page);
    const box = await page.locator(".hero-actions [data-cursor]").boundingBox();
    if (!box) throw new Error("cursor target not laid out");
    await page.mouse.move(200, 200, { steps: 10 });
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2, { steps: 25 });
    await page.waitForTimeout(900);
    await page.mouse.move(box.x + box.width + 120, box.y - 60, { steps: 20 });
    await page.waitForTimeout(600);
  });
});

test("magnetic button", async ({ browser }) => {
  await record(browser, "magnetic-1440", DESKTOP, async (page) => {
    await page.goto("/fr");
    await shellIdle(page);
    const button = page.locator(".hero-actions [data-magnetic]");
    const box = await button.boundingBox();
    if (!box) throw new Error("button not laid out");
    const cx = box.x + box.width / 2;
    const cy = box.y + box.height / 2;
    await page.mouse.move(cx - 60, cy - 40, { steps: 10 });
    for (const [dx, dy] of [
      [-30, -16],
      [30, 16],
      [30, -16],
      [-30, 16],
      [0, 0],
    ] as const) {
      await page.mouse.move(cx + dx, cy + dy, { steps: 12 });
      await page.waitForTimeout(250);
    }
    await page.mouse.move(cx + 260, cy + 160, { steps: 12 });
    await page.waitForTimeout(800);
  });
});

test("footer reveal", async ({ browser }) => {
  await record(browser, "footer-reveal-1440", DESKTOP, async (page) => {
    await page.goto("/fr");
    await shellIdle(page);
    await page.mouse.move(700, 450);
    const height = await page.evaluate(() => document.documentElement.scrollHeight);
    await wheel(page, height, 24);
    await page.waitForTimeout(900);
  });
});
