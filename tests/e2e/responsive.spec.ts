import { expect, test } from "@playwright/test";
import { ROUTES, slugOf } from "./routes";

for (const route of ROUTES) {
  test(`responsive ${route.path}`, async ({ page }, info) => {
    await page.goto(route.path);
    await page.evaluate(() => document.fonts.ready);

    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow, "horizontal overflow in px").toBeLessThanOrEqual(0);

    // Primary tap targets: every link and button, except links inline in running text (WCAG 2.5.8
    // exempts those): a link is inline when its paragraph has other text besides it.
    const small = await page.locator("a:visible, button:visible").evaluateAll((elements) =>
      elements
        .filter((el) => {
          const paragraph = el.closest("p");
          return !paragraph || paragraph.textContent.trim() === el.textContent.trim();
        })
        .map((el) => ({
          text: el.textContent.trim(),
          height: el.getBoundingClientRect().height,
        }))
        .filter((target) => target.height < 44),
    );
    expect(small, "tap targets under 44 px").toEqual([]);

    await page.screenshot({
      path: `test-results/responsive/${info.project.name}/${slugOf(route.path)}.png`,
      fullPage: true,
    });
  });
}
