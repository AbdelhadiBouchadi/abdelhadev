import { expect, test } from "@playwright/test";
import { LEGAL_NAME, ROUTES } from "./routes";

test.use({ javaScriptEnabled: false });

for (const route of ROUTES) {
  test(`without JavaScript ${route.path} shows its content and the legal name`, async ({
    page,
  }) => {
    await page.goto(route.path);
    await expect(page.locator("h1")).toBeVisible();
    await expect(page.locator("footer")).toContainText(LEGAL_NAME);
    // No loader and no hidden intro states without the boot script.
    const classes = await page.locator("html").getAttribute("class");
    expect(classes ?? "").not.toMatch(/\b(js|motion)\b/);
  });
}

test("navigation works without JavaScript", async ({ page }) => {
  await page.goto("/fr");
  await page.getByRole("link", { name: "Mentions légales" }).click();
  await expect(page).toHaveURL(/\/fr\/mentions-legales$/);
  await page.getByRole("link", { name: "English" }).click();
  await expect(page).toHaveURL(/\/en\/legal-notice$/);
  await expect(page.locator("h1")).toHaveText("Legal notice");
});
