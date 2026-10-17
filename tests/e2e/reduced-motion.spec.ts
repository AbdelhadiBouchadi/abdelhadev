import { expect, test } from "@playwright/test";
import { ROUTES } from "./routes";

test.use({ reducedMotion: "reduce" });

for (const route of ROUTES.filter((r) => r.locale === "fr")) {
  test(`reduced motion ${route.path}: nothing hidden, no smooth scroll`, async ({ page }) => {
    await page.goto(route.path);
    const html = page.locator("html");
    await expect(html).toHaveClass(/\bjs\b/);
    await expect(html).not.toHaveClass(/\bmotion\b/);
    await expect(html).not.toHaveClass(/\blenis\b/);

    const hidden = await page.locator("main *, footer *").evaluateAll(
      (elements) =>
        elements.filter((el) => {
          const style = getComputedStyle(el);
          return style.visibility === "hidden" || Number(style.opacity) === 0;
        }).length,
    );
    expect(hidden).toBe(0);
  });
}
