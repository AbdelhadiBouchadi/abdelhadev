// The route curtain (decision T8, docs/spikes/route-curtain.md): cover, navigate, arrive, lift;
// Back and Forward; same-page hash links; modified and double clicks; no flash of the new page.
import { expect, test, type Page } from "@playwright/test";
import { scrollToY, shellIdle, visited } from "./shell-helpers";

test.beforeEach(async ({ page }) => {
  await visited(page);
});

interface Frame {
  arrived: boolean;
  covered: boolean;
}

/** Samples every frame: is the arriving page in the DOM, and does the panel cover the viewport? */
async function startSampler(page: Page, arrivedTitle: string) {
  await page.evaluate((title) => {
    const frames: { arrived: boolean; covered: boolean }[] = [];
    (window as unknown as { __frames: typeof frames }).__frames = frames;
    const loop = () => {
      const loader = document.querySelector<HTMLElement>("[data-loader]");
      const panel = document.querySelector<HTMLElement>("[data-loader-panel]");
      const r = panel?.getBoundingClientRect();
      const shown =
        !!loader &&
        getComputedStyle(loader).display !== "none" &&
        getComputedStyle(loader).opacity === "1";
      frames.push({
        // endsWith: the home h1 is the visual wordmark followed by its screen-reader name.
        arrived: document.querySelector("main h1")?.textContent?.endsWith(title) ?? false,
        covered: shown && !!r && r.top <= 0 && r.bottom >= window.innerHeight,
      });
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  }, arrivedTitle);
}

const frames = (page: Page) =>
  page.evaluate(() => (window as unknown as { __frames: Frame[] }).__frames);

/** The visible "Projets" link: the header pill on desktop, the floating pill on phones. */
const workLink = (page: Page) =>
  page
    .locator(".nav-pill, nav.pill")
    .getByRole("link", { name: "Projets" })
    .locator("visible=true");

test("a link covers the page, navigates, scrolls to the top and focuses the new h1", async ({
  page,
}) => {
  await page.goto("/fr");
  await shellIdle(page);
  // Down (the header hides), then a little up (it returns), as a visitor would.
  await scrollToY(page, 500);
  await expect(page.locator("header.site-header")).toHaveClass(/is-hidden/);
  await scrollToY(page, 480);
  await expect(page.locator("header.site-header")).not.toHaveClass(/is-hidden/);
  await startSampler(page, "Projets");

  await workLink(page).click();
  await expect(page).toHaveURL(/\/fr\/projets$/);
  await shellIdle(page);

  const seen = await frames(page);
  const firstArrived = seen.findIndex((f) => f.arrived);
  expect(firstArrived, "the new page arrived").toBeGreaterThan(0);
  expect(seen[firstArrived]?.covered, "no flash: covered on the first frame").toBe(true);
  expect(
    seen.slice(0, firstArrived).some((f) => f.covered),
    "the curtain covered the old page",
  ).toBe(true);
  expect(await page.evaluate(() => window.scrollY)).toBe(0);
  await expect(page.locator("main h1")).toBeFocused();
  await expect(page.locator("main h1")).toHaveText("Projets");
});

test("Back and Forward arrive behind the curtain too", async ({ page }) => {
  await page.goto("/fr");
  await shellIdle(page);
  await workLink(page).click();
  await expect(page).toHaveURL(/\/fr\/projets$/);
  await shellIdle(page);

  await startSampler(page, "Abdelhadev, Abdelhadi Bouchadi, développeur full-stack à Agadir");
  await page.goBack();
  await expect(page).toHaveURL(/\/fr$/);
  await shellIdle(page);
  let seen = await frames(page);
  let first = seen.findIndex((f) => f.arrived);
  expect(seen[first]?.covered, "Back: covered on the first frame").toBe(true);
  await expect(page.locator("main h1")).toBeFocused();

  await startSampler(page, "Projets");
  await page.goForward();
  await expect(page).toHaveURL(/\/fr\/projets$/);
  await shellIdle(page);
  seen = await frames(page);
  first = seen.findIndex((f) => f.arrived);
  expect(seen[first]?.covered, "Forward: covered on the first frame").toBe(true);
  expect(await page.evaluate(() => window.scrollY)).toBe(0);
});

test("a hash link to the current page scrolls there without a curtain", async ({ page }) => {
  await page.goto("/fr/lab");
  await shellIdle(page);
  await startSampler(page, "never");
  await page.getByRole("link", { name: "Aller à la section nuit" }).click();
  await expect(page).toHaveURL(/\/fr\/lab#lab-night$/);
  const target = await page
    .locator("#lab-night")
    .evaluate((el) => el.getBoundingClientRect().top + window.scrollY);
  await expect
    .poll(() => page.evaluate(() => window.scrollY), { timeout: 4000 })
    .toBeCloseTo(target, -1);
  expect(
    (await frames(page)).some((f) => f.covered),
    "no curtain",
  ).toBe(false);
});

/** The document offset of the element with this id. */
const offsetOf = (page: Page, id: string) =>
  page.locator(`#${id}`).evaluate((el) => el.getBoundingClientRect().top + window.scrollY);

test("a hash link lands on its target when the click comes before Lenis has seen the last scroll", async ({
  page,
}) => {
  // Scroll events reach Lenis on the next frame, so a click can arrive while Lenis still holds the
  // previous scroll position. It used to measure the target from that stale value and overshoot
  // by the distance it had missed (CI: 382 px at 390, 436 px at 1440).
  await page.goto("/fr/lab");
  await shellIdle(page);
  await scrollToY(page, 437);
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(437);
  await page.waitForTimeout(300);
  await page.evaluate(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
    document.querySelector<HTMLAnchorElement>('main a[href$="#lab-night"]')?.click();
  });
  const target = await offsetOf(page, "lab-night");
  await expect
    .poll(() => page.evaluate(() => window.scrollY), { timeout: 4000 })
    .toBeCloseTo(target, -1);
});

test("a hash link follows its target when the layout above it changes during the scroll", async ({
  page,
}) => {
  await page.goto("/fr/lab");
  await shellIdle(page);
  const before = await offsetOf(page, "lab-night");
  await page.getByRole("link", { name: "Aller à la section nuit" }).click();
  // Halfway through the scroll, content above the target grows by 400 px (an image, a re-split,
  // a font swap). Done in the page on the frame the scroll passes halfway, so it is mid-scroll on
  // any machine.
  const yAtChange = await page.evaluate(
    (half) =>
      new Promise<number>((resolve) => {
        const step = () => {
          if (window.scrollY < half) {
            requestAnimationFrame(step);
            return;
          }
          const spacer = document.createElement("div");
          spacer.style.height = "400px";
          document.getElementById("bench")?.append(spacer);
          resolve(window.scrollY);
        };
        step();
      }),
    before / 2,
  );
  expect(yAtChange, "the layout changed during the scroll").toBeLessThan(before - 200);
  const target = await offsetOf(page, "lab-night");
  expect(target - before).toBeGreaterThanOrEqual(400);
  await expect
    .poll(() => page.evaluate(() => window.scrollY), { timeout: 4000 })
    .toBeCloseTo(target, -1);
});

test("a modified click opens a new tab and leaves this page alone", async ({ page, context }) => {
  await page.goto("/fr");
  await shellIdle(page);
  await startSampler(page, "Projets");
  const [tab] = await Promise.all([
    context.waitForEvent("page"),
    workLink(page).click({ modifiers: ["ControlOrMeta"] }),
  ]);
  await tab.waitForLoadState();
  expect(new URL(tab.url()).pathname).toBe("/fr/projets");
  expect(new URL(page.url()).pathname).toBe("/fr");
  expect((await frames(page)).some((f) => f.covered)).toBe(false);
  await tab.close();
});

test("a double click navigates once", async ({ page }) => {
  await page.goto("/fr");
  await shellIdle(page);
  const before = await page.evaluate(() => history.length);
  await workLink(page).dblclick();
  await expect(page).toHaveURL(/\/fr\/projets$/);
  await shellIdle(page);
  expect(await page.evaluate(() => history.length)).toBe(before + 1);
});
