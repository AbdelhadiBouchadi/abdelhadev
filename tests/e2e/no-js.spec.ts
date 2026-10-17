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
    await expect(page.locator("[data-loader]")).toBeHidden();
    expect(await page.locator("[inert]").count()).toBe(0);
    // The header links are there and reachable.
    await expect(page.getByRole("link", { name: "Contact" }).first()).toBeVisible();
  });
}

test("navigation works without JavaScript", async ({ page }) => {
  await page.goto("/fr");
  await page.getByRole("link", { name: "Mentions légales" }).click();
  await expect(page).toHaveURL(/\/fr\/mentions-legales$/);
  await page.getByRole("link", { name: "English" }).first().click();
  await expect(page).toHaveURL(/\/en\/legal-notice$/);
  await expect(page.locator("h1")).toHaveText("Legal notice");
  await page.locator("footer").getByRole("link", { name: "Work", exact: true }).click();
  await expect(page).toHaveURL(/\/en\/work$/);
});
