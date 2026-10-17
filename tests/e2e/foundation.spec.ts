// Foundation acceptance: locale redirects, sitemap and robots, metadata files, the lab.
import { expect, test } from "@playwright/test";
import { ROUTES } from "./routes";
import { shellIdle, visited } from "./shell-helpers";

test.describe("locale redirect on /", () => {
  const cases: { name: string; headers: Record<string, string>; to: string }[] = [
    {
      name: "Accept-Language en",
      headers: { "accept-language": "en-US,en;q=0.9" },
      to: "/en",
    },
    {
      name: "Accept-Language fr",
      headers: { "accept-language": "fr-FR,fr;q=0.9" },
      to: "/fr",
    },
    {
      name: "an unsupported language falls back to fr",
      headers: { "accept-language": "de-DE" },
      to: "/fr",
    },
    {
      name: "the cookie wins over Accept-Language",
      headers: { "accept-language": "fr", cookie: "NEXT_LOCALE=en" },
      to: "/en",
    },
  ];
  for (const c of cases) {
    test(c.name, async ({ request }) => {
      const response = await request.get("/", {
        headers: c.headers,
        maxRedirects: 0,
      });
      expect(response.status()).toBe(307);
      expect(new URL(response.headers().location ?? "", "http://x").pathname).toBe(c.to);
    });
  }

  test("an internal path redirects to its localised pathname", async ({ request }) => {
    const response = await request.get("/fr/work", { maxRedirects: 0 });
    expect(response.headers().location).toMatch(/\/fr\/projets$/);
  });
});

test("the sitemap lists every route with its alternates and leaves out the lab", async ({
  request,
}) => {
  const xml = await (await request.get("/sitemap.xml")).text();
  for (const route of ROUTES) expect(xml).toContain(`https://abdelhadev.me${route.path}</loc>`);
  expect(xml).toContain('hreflang="fr"');
  expect(xml).toContain('hreflang="en"');
  expect(xml).not.toContain("/lab");
});

test("robots meta is noindex while INDEXABLE is false", async ({ page, request }) => {
  await page.goto("/fr");
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", "noindex, nofollow");
  const robots = await (await request.get("/robots.txt")).text();
  expect(robots).toContain("Sitemap: https://abdelhadev.me/sitemap.xml");
});

test("the favicon, Apple icon and manifest are served and linked", async ({ page, request }) => {
  await page.goto("/fr");
  const head = page.locator("head");
  await expect(head.locator('link[rel="icon"][type="image/svg+xml"]')).toHaveCount(1);
  await expect(head.locator('link[rel="icon"][type="image/x-icon"]')).toHaveCount(1);
  await expect(head.locator('link[rel="apple-touch-icon"]')).toHaveCount(1);
  await expect(head.locator('link[rel="manifest"]')).toHaveAttribute(
    "href",
    "/manifest.webmanifest",
  );

  for (const href of ["/favicon.ico", "/icon.svg", "/apple-icon.png", "/brand/icon-512.png"]) {
    expect((await request.get(href)).status(), href).toBe(200);
  }
  const manifest = (await (await request.get("/manifest.webmanifest")).json()) as {
    theme_color: string;
    background_color: string;
  };
  expect(manifest.theme_color).toBe("#f7f0e8");
  expect(manifest.background_color).toBe("#f7f0e8");
});

test("unknown pages are a localised 404", async ({ page }) => {
  const response = await page.goto("/fr/nope");
  expect(response?.status()).toBe(404);
  await expect(page.locator("h1")).toHaveText("Page introuvable");
  expect((await page.goto("/fr/projets/nope"))?.status()).toBe(404);
});

test.describe("lab", () => {
  test("is noindex and screenshots the tokens, type and brand", async ({ page }, info) => {
    await visited(page);
    await page.goto("/fr/lab");
    await shellIdle(page);
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
      "content",
      "noindex, nofollow",
    );
    await page.evaluate(() => document.fonts.ready);
    await page.screenshot({
      path: `test-results/foundation/lab-${info.project.name}.png`,
      fullPage: true,
    });
  });
});
