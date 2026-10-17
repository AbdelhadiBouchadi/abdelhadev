import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { ROUTES } from "./routes";

const TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa", "best-practice"];

for (const route of ROUTES) {
  test(`a11y ${route.path}`, async ({ page }) => {
    await page.goto(route.path);
    // There is no loader yet (it arrives in 01, and this wait becomes "after the loader finishes"):
    // wait for the network and fonts to settle so axe sees the final page.
    await page.waitForLoadState("networkidle");
    await page.evaluate(() => document.fonts.ready);

    const { violations } = await new AxeBuilder({ page }).withTags(TAGS).analyze();
    const blocking = violations.filter((v) => v.impact === "serious" || v.impact === "critical");
    expect(
      blocking.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`),
    ).toEqual([]);

    await expect(page.locator("html")).toHaveAttribute("lang", route.locale);
    await expect(page.locator("h1")).toHaveCount(1);
  });
}

test("the skip link is the first focusable element and moves focus to main", async ({ page }) => {
  await page.goto("/fr");
  await page.keyboard.press("Tab");
  const skip = page.getByRole("link", { name: "Aller au contenu" });
  await expect(skip).toBeFocused();
  await expect(skip).toBeInViewport();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/#main$/);
});

test("focus is visible", async ({ page }) => {
  await page.goto("/fr");
  await page.keyboard.press("Tab");
  await page.keyboard.press("Tab");
  const outline = await page.evaluate(() => {
    const el = document.activeElement;
    return el ? getComputedStyle(el).outlineStyle : "none";
  });
  expect(outline).not.toBe("none");
});
