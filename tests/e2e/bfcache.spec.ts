// A page restored from the bfcache must come back usable: overlay gone, nothing inert, scrolling.
//
// Playwright's Chromium cannot restore from the bfcache (BackForwardCacheDisabledForDelegate,
// the automation embedder turns it off), so this drives the Loader's pageshow handler directly
// with the state of a page frozen under the curtain.
import { expect, test } from "@playwright/test";
import { shellIdle, visited } from "./shell-helpers";

test.beforeEach(async ({ page }, info) => {
  test.skip(info.project.name !== "390" && info.project.name !== "1440", "behaviour, not layout");
  await visited(page);
});

test("the pageshow handler gives back a page frozen mid-curtain", async ({ page }) => {
  await page.goto("/fr");
  await shellIdle(page);

  // The state a page frozen under the curtain has: overlay shown, not ready, content inert.
  await page.evaluate(() => {
    const html = document.documentElement;
    html.classList.remove("loader-off", "ready");
    for (const el of document.querySelectorAll("[data-shell-content]")) {
      el.setAttribute("inert", "");
    }
  });
  await expect(page.locator("[data-loader]")).toBeVisible();
  await expect(page.locator("main")).toHaveAttribute("inert", "");

  await page.evaluate(() => {
    window.dispatchEvent(new PageTransitionEvent("pageshow", { persisted: true }));
  });
  await shellIdle(page);
  await expect(page.locator("[data-loader]")).toBeHidden();
  expect(await page.locator("[inert]").count()).toBe(0);

  const before = await page.evaluate(() => scrollY);
  await page.mouse.move(200, 400);
  await page.mouse.wheel(0, 800);
  await expect.poll(() => page.evaluate(() => scrollY)).toBeGreaterThan(before);
});

test("a pageshow that is not a bfcache restore changes nothing", async ({ page }) => {
  await page.goto("/fr");
  await shellIdle(page);
  await page.evaluate(() => {
    document.documentElement.classList.remove("loader-off");
    window.dispatchEvent(new PageTransitionEvent("pageshow", { persisted: false }));
  });
  await expect(page.locator("html")).not.toHaveClass(/loader-off/);
});
