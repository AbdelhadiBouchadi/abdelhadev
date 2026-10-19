// SEO in the served HTML (prompts/09-seo-og-cv.md): no browser, Playwright's request fixture
// only, on one project. Every route in both locales: one canonical, the reciprocal hreflang set
// with x-default, Open Graph and Twitter images that are served as PNG, JSON-LD that parses with
// the expected types, robots; the 404, robots.txt, the sitemap, the manifest and the CV header.
// The test server is not a production deployment, so every page is noindex here.
import { expect, test, type APIRequestContext } from "@playwright/test";
import { localizedPath } from "@/lib/paths";
import { caseHref, PAGES } from "@/lib/routes";
import { SITE } from "@/lib/site";
import { CV } from "@/lib/content/cv";
import { ROUTES, type Route } from "./routes";

test.beforeEach(({}, info) => {
  test.skip(info.project.name !== "1440", "HTML only: one project is enough.");
});

/** The attributes of every tag of a kind in a document, as plain objects. */
function tags(html: string, name: string): Record<string, string>[] {
  return [...html.matchAll(new RegExp(`<${name}\\b([^>]*)>`, "gi"))].map(([, attrs = ""]) =>
    Object.fromEntries(
      [...attrs.matchAll(/([\w:-]+)="([^"]*)"/g)].map(([, k = "", v = ""]) => [
        k.toLowerCase(),
        v.replaceAll("&amp;", "&").replaceAll("&#x27;", "'"),
      ]),
    ),
  );
}

const meta = (html: string, key: string) =>
  tags(html, "meta").filter((m) => m.property === key || m.name === key);

function hrefOf(route: Route) {
  return typeof route.page === "string" ? PAGES[route.page].href : caseHref(route.page.case);
}

async function expectPng(request: APIRequestContext, url: string) {
  const response = await request.get(new URL(url).pathname);
  expect(response.status(), url).toBe(200);
  expect(response.headers()["content-type"], url).toBe("image/png");
}

for (const route of ROUTES) {
  test(`${route.path}: canonical, hreflang, cards, JSON-LD and robots`, async ({ request }) => {
    const response = await request.get(route.path);
    expect(response.status()).toBe(200);
    const html = await response.text();
    const links = tags(html, "link");

    const canonical = links.filter((l) => l.rel === "canonical");
    expect(canonical).toHaveLength(1);
    expect(canonical[0]?.href).toBe(`${SITE.url}${route.path}`);

    const href = hrefOf(route);
    const alternates = Object.fromEntries(
      links.filter((l) => l.rel === "alternate" && l.hreflang).map((l) => [l.hreflang, l.href]),
    );
    expect(alternates).toEqual({
      fr: `${SITE.url}${localizedPath("fr", href)}`,
      en: `${SITE.url}${localizedPath("en", href)}`,
      "x-default": `${SITE.url}${localizedPath("fr", href)}`,
    });

    expect(meta(html, "og:locale")[0]?.content).toBe(route.locale === "fr" ? "fr_FR" : "en_US");
    expect(meta(html, "og:site_name")[0]?.content).toBe("Abdelhadev");
    expect(meta(html, "twitter:card")[0]?.content).toBe("summary_large_image");
    const ogImage = meta(html, "og:image")[0]?.content ?? "";
    const twitterImage = meta(html, "twitter:image")[0]?.content ?? "";
    expect(meta(html, "og:image:alt")[0]?.content?.length ?? 0).toBeGreaterThan(10);
    await expectPng(request, ogImage);
    await expectPng(request, twitterImage);

    const scripts = [
      ...html.matchAll(/<script type="application\/ld\+json">([^<]*)<\/script>/g),
    ].map(([, json = ""]) => JSON.parse(json) as Record<string, unknown>);
    const types = scripts.flatMap((data) =>
      Array.isArray(data["@graph"])
        ? (data["@graph"] as { "@type": string }[]).map((node) => node["@type"])
        : [data["@type"]],
    );
    const expected =
      route.page === "home"
        ? ["Person", "WebSite"]
        : route.page === "work" || typeof route.page !== "string"
          ? ["BreadcrumbList"]
          : [];
    expect(types).toEqual(expected);

    const robots = meta(html, "robots").map((m) => m.content);
    expect(robots).toEqual(["noindex, nofollow"]);
  });
}

test("the legal notice is never indexable, and is not in the sitemap", async ({ request }) => {
  const xml = await (await request.get("/sitemap.xml")).text();
  for (const route of ROUTES.filter((r) => r.page === "legal")) {
    const html = await (await request.get(route.path)).text();
    expect(meta(html, "robots")[0]?.content).toContain("noindex");
    expect(xml).not.toContain(route.path);
  }
});

// The 404's body reaches the page through the RSC payload (the server HTML is Next's error shell,
// an open issue reported in 09), so this checks the head and the payload; the visible heading is
// checked in a browser by foundation.spec.ts.
test("an unknown path is a localised 404 that is not indexed", async ({ request }) => {
  const LINKS = {
    fr: ["Retour à l'accueil", "Voir les projets"],
    en: ["Back to the home page", "See the work"],
  };
  for (const [path, locale, title] of [
    ["/fr/nulle-part", "fr", "Page introuvable"],
    ["/en/nowhere", "en", "Page not found"],
    ["/fr/projets/nope", "fr", "Page introuvable"],
  ] as const) {
    const response = await request.get(path);
    expect(response.status(), path).toBe(404);
    const html = await response.text();
    expect(html).toContain(`<title>${title}</title>`);
    expect(meta(html, "robots").length).toBeGreaterThan(0);
    for (const m of meta(html, "robots")) expect(m.content).toContain("noindex");
    expect(tags(html, "link").some((l) => l.rel === "canonical")).toBe(false);
    // The two links of the 404 (home and work), in the visitor's language.
    for (const label of LINKS[locale]) expect(html, label).toContain(label);
  }
  expect((await request.get("/nope.txt")).status()).toBe(404);
});

test("robots.txt, the sitemap and the manifest are served", async ({ request }) => {
  const robots = await request.get("/robots.txt");
  expect(robots.status()).toBe(200);
  // Not a production deployment: everything is disallowed.
  expect(await robots.text()).toContain("Disallow: /");

  const sitemap = await request.get("/sitemap.xml");
  expect(sitemap.status()).toBe(200);
  const xml = await sitemap.text();
  for (const route of ROUTES.filter((r) => r.indexable)) {
    expect(xml).toContain(`<loc>${SITE.url}${route.path}</loc>`);
  }
  expect(xml).toContain('hreflang="x-default"');

  const manifest = await request.get("/manifest.webmanifest");
  expect(manifest.status()).toBe(200);
  expect(((await manifest.json()) as { name: string }).name).toBe("Abdelhadev");
});

test("the CV files are downloadable but carry X-Robots-Tag: noindex", async ({ request }) => {
  for (const file of Object.values(CV)) {
    const response = await request.get(file.href);
    expect(response.status()).toBe(200);
    expect(response.headers()["x-robots-tag"]).toBe("noindex");
  }
});
