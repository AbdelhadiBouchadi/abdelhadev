// The persistent shell: header hide and return, tone switching, the active link, the locale
// switch and the cursor label (docs/choreography.md, "Shell").
import { expect, test, type Page } from "@playwright/test";
import { scrollToY, shellIdle, visited } from "./shell-helpers";

test.beforeEach(async ({ page }) => {
  await visited(page);
});

const header = (page: Page) => page.locator("header.site-header");
const offsetTop = (page: Page, selector: string) =>
  page.locator(selector).evaluate((el) => el.getBoundingClientRect().top + window.scrollY);

test("the header hides on scroll down past 240 px and returns on any scroll up", async ({
  page,
}) => {
  await page.goto("/fr/lab");
  await shellIdle(page);
  await scrollToY(page, 200);
  await scrollToY(page, 230);
  await expect(header(page)).not.toHaveClass(/is-hidden/);
  await scrollToY(page, 900);
  await expect(header(page)).toHaveClass(/is-hidden/);
  await scrollToY(page, 880);
  await expect(header(page)).not.toHaveClass(/is-hidden/);
});

test("the header never hides while focus is inside it", async ({ page }) => {
  await page.goto("/fr/lab");
  await shellIdle(page);
  await header(page).getByRole("link", { name: "Contact" }).focus();
  await scrollToY(page, 600);
  await scrollToY(page, 1200);
  await expect(header(page)).not.toHaveClass(/is-hidden/);
});

test("the shell follows the tone of the section under the header", async ({ page }) => {
  await page.goto("/fr/lab");
  await shellIdle(page);
  await expect(header(page)).toHaveAttribute("data-tone", "day");

  await scrollToY(page, (await offsetTop(page, "#lab-night")) + 10);
  await expect(header(page)).toHaveAttribute("data-tone", "night");
  await expect(page.locator(".cursor")).toHaveAttribute("data-tone", "night");
  await expect(page.locator("nav.pill")).toHaveAttribute("data-tone", "night");

  await scrollToY(page, (await offsetTop(page, "#lab-sheet")) + 10);
  await expect(header(page)).toHaveAttribute("data-tone", "day");

  // Back up into the night section, then to the top.
  await scrollToY(page, (await offsetTop(page, "#lab-night")) + 10);
  await expect(header(page)).toHaveAttribute("data-tone", "night");
  await scrollToY(page, 0);
  await expect(header(page)).toHaveAttribute("data-tone", "day");
});

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

test("the cursor shows the label of the hovered element on a fine pointer", async ({
  page,
}, info) => {
  test.skip(info.project.name !== "1440", "fine pointers only");
  await page.goto("/fr/lab");
  await shellIdle(page);
  const target = page.locator('[data-lab-cursor="day"]');
  await target.scrollIntoViewIfNeeded();
  const box = await target.boundingBox();
  if (!box) throw new Error("cursor target not laid out");
  await page.mouse.move(box.x + 10, box.y + 10);
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2, { steps: 5 });
  const cursor = page.locator(".cursor");
  await expect(cursor).toHaveClass(/is-on/);
  await expect(cursor).toHaveClass(/is-label/);
  await expect(cursor.locator("[data-cursor-label]")).toHaveText("Étiquette du curseur");
  await expect(cursor).toHaveAttribute("aria-hidden", "true");
  await page.mouse.move(5, 5, { steps: 3 });
  await expect(cursor).not.toHaveClass(/is-label/);
});
