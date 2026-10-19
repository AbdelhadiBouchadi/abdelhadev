import { expect, test } from "@playwright/test";
import { ROUTES, slugOf } from "./routes";
import { scrollToY, shellIdle, visited } from "./shell-helpers";

// Layout, not motion: reduced motion keeps these runs fast and the screenshots still.
test.use({ reducedMotion: "reduce" });

test.beforeEach(async ({ page }) => {
  await visited(page);
});

for (const route of ROUTES) {
  test(`responsive ${route.path}`, async ({ page }, info) => {
    await page.goto(route.path);
    await shellIdle(page);

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

test("the mobile pill: shown under 761 px, inside the viewport, never over the footer", async ({
  page,
}, info) => {
  await page.goto("/fr/projets");
  await shellIdle(page);
  const pill = page.locator("nav.pill");
  const width = page.viewportSize()?.width ?? 0;
  if (width > 760) {
    await expect(pill).toBeHidden();
    return;
  }
  await expect(pill).toBeVisible();
  const box = await pill.boundingBox();
  expect(box).not.toBeNull();
  if (!box) return;
  expect(box.x).toBeGreaterThanOrEqual(0);
  expect(box.x + box.width).toBeLessThanOrEqual(width);
  for (const link of await pill.getByRole("link").all()) {
    const b = await link.boundingBox();
    expect(b?.height ?? 0).toBeGreaterThanOrEqual(44);
    expect(b?.width ?? 0).toBeGreaterThanOrEqual(44);
  }
  await expect(pill.getByRole("link", { name: "Projets" })).toHaveAttribute("aria-current", "page");

  // At the very bottom, the last footer line sits above the pill.
  await scrollToY(page, await page.evaluate(() => document.documentElement.scrollHeight));
  await expect(pill).toHaveAttribute("data-tone", "night");
  const pillTop = (await pill.boundingBox())?.y ?? 0;
  const lastText = await page
    .locator("footer p, footer li")
    .last()
    .evaluate((el) => el.getBoundingClientRect().bottom);
  expect(lastText, "footer text covered by the pill").toBeLessThanOrEqual(pillTop);
  await page.screenshot({ path: `test-results/responsive/${info.project.name}/pill.png` });
});
