import { expect, test } from "@playwright/test";
import { wordsLightOpacities } from "./page-helpers";
import { ROUTES } from "./routes";
import { scrollToY, shellIdle } from "./shell-helpers";

test.use({ reducedMotion: "reduce" });

for (const route of ROUTES.filter((r) => r.locale === "fr")) {
  test(`reduced motion ${route.path}: nothing hidden, no smooth scroll`, async ({ page }) => {
    await page.goto(route.path);
    await shellIdle(page);
    const html = page.locator("html");
    await expect(html).toHaveClass(/\bjs\b/);
    await expect(html).not.toHaveClass(/\bmotion\b/);
    await expect(html).not.toHaveClass(/\blenis\b/);

    const hidden = await page.locator("main *, footer *").evaluateAll(
      (elements) =>
        elements.filter((el) => {
          if (el.closest("[hidden]")) return false;
          const style = getComputedStyle(el);
          return style.visibility === "hidden" || Number(style.opacity) === 0;
        }).length,
    );
    expect(hidden).toBe(0);

    // Every WordsLight word is at full opacity, before and after its range is scrolled through.
    const top = await wordsLightOpacities(page);
    expect(top.length > 0).toBe(route.wordsLight);
    expect(top.filter((opacity) => opacity !== 1)).toEqual([]);
    await scrollToY(page, await page.evaluate(() => document.documentElement.scrollHeight / 2));
    await page.waitForTimeout(400);
    expect((await wordsLightOpacities(page)).filter((opacity) => opacity !== 1)).toEqual([]);
  });
}
