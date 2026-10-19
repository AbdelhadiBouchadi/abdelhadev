// The active link, the locale switch and the clock. Header hide, tone switching and the cursor
// label are tested on the home page, against real sections.
import { expect, test, type Page } from "@playwright/test";
import { shellIdle, visited } from "./shell-helpers";

test.beforeEach(async ({ page }) => {
  await visited(page);
});

const header = (page: Page) => page.locator("header.site-header");

test("the current page is marked in the navigation", async ({ page }) => {
  await page.goto("/fr/projets");
  await shellIdle(page);
  const current = page.locator('[aria-current="page"]:visible');
  await expect(current.first()).toHaveText("Projets");
  await page.goto("/fr/projets/dentaflow");
  await shellIdle(page);
  await expect(page.locator('[aria-current="true"]:visible').first()).toHaveText("Projets");
  await page.goto("/fr/contact");
  await shellIdle(page);
  await expect(header(page).getByRole("link", { name: "Contact" })).toHaveAttribute(
    "aria-current",
    "page",
  );
});

test("the locale switch keeps the page and is a full page load", async ({ page }) => {
  await page.goto("/fr/projets/dentaflow");
  await shellIdle(page);
  await page
    .locator("footer")
    .getByRole("link", { name: /English/ })
    .click();
  await expect(page).toHaveURL(/\/en\/work\/dentaflow$/);
  await shellIdle(page);
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
});

test("the clock shows Agadir time after mount", async ({ page }) => {
  await page.goto("/fr");
  await shellIdle(page);
  await expect(page.locator("footer time")).toHaveText(/^\d{2}:\d{2}$/);
});
