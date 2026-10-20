import { describe, expect, it } from "vitest";
import en from "@messages/en.json";
import fr from "@messages/fr.json";
import { checkFrench } from "@scripts/lib/fr-rules.mjs";
import { routing, type Locale } from "@/i18n/routing";
import { LABELLED_STATUSES, PROJECTS, caseStudyProjects, statusKey } from "@/lib/content/projects";
import {
  FORBIDDEN_KEYS,
  breadcrumbJsonLd,
  homeJsonLd,
  serializeJsonLd,
  type JsonLdValue,
} from "@/lib/json-ld";
import { ogCardName, ogPageOf, ogPages } from "@/lib/og";
import { localizedPath, type RouteHref } from "@/lib/paths";
import { PAGES, caseHref, indexableHrefs } from "@/lib/routes";
import {
  DESCRIPTION_RANGE,
  TITLE_MAX,
  alternates,
  buildMetadata,
  fullTitle,
  isIndexable,
  robotsFile,
  robotsFor,
  sitemapEntries,
} from "@/lib/seo";
import { isTodo } from "@/lib/todo";

const MESSAGES = { fr, en } as const;
const SITE_URL = "https://abdelhadev.me";

/** As the browser shows it. */
function pagesOf(locale: Locale) {
  const { pages, cases } = MESSAGES[locale].seo;
  return [
    ...Object.entries(pages).map(([key, copy]) => ({
      key,
      title: key === "home" ? copy.title : fullTitle(copy.title),
      description: copy.description,
    })),
    ...Object.entries(cases).map(([slug, copy]) => ({
      key: `case:${slug}`,
      title: fullTitle(copy.title),
      description: copy.description,
    })),
  ];
}

describe("titles and descriptions", () => {
  for (const locale of routing.locales) {
    it(`${locale}: every page, the 404 and each case study have a title of at most ${String(TITLE_MAX)} characters and a description of ${String(DESCRIPTION_RANGE.min)} to ${String(DESCRIPTION_RANGE.max)}`, () => {
      const pages = pagesOf(locale);
      // home, work, about, contact, legal, notFound and the case studies.
      expect(pages.length).toBe(Object.keys(PAGES).length + 1 + caseStudyProjects().length);
      for (const { key, title, description } of pages) {
        expect(title.length, `${key}: ${title}`).toBeLessThanOrEqual(TITLE_MAX);
        expect(description.length, `${key}`).toBeGreaterThanOrEqual(DESCRIPTION_RANGE.min);
        expect(description.length, `${key}`).toBeLessThanOrEqual(DESCRIPTION_RANGE.max);
      }
    });

    it(`${locale}: titles are unique`, () => {
      const titles = pagesOf(locale).map((p) => p.title);
      expect(new Set(titles).size).toBe(titles.length);
    });
  }

  it("has copy for every public case study", () => {
    for (const { slug } of caseStudyProjects()) {
      expect(Object.keys(fr.seo.cases)).toContain(slug);
      expect(Object.keys(en.seo.cases)).toContain(slug);
    }
  });

  it("never names a price, a year of experience or a result", () => {
    for (const locale of routing.locales) {
      for (const { key, description } of pagesOf(locale)) {
        expect(description, key).not.toMatch(
          /\d+\s*(?:ans|years)|€|\$|\bMAD\b|clients? satisfaits?/i,
        );
      }
    }
  });
});

describe("hreflang", () => {
  const hrefs: RouteHref[] = [...Object.values(PAGES).map((p) => p.href), caseHref("dentaflow")];

  it("uses the routing table's localised paths, with x-default on French", () => {
    for (const href of hrefs) {
      const { languages } = alternates(href, "fr");
      for (const locale of routing.locales) {
        expect(languages[locale]).toBe(`${SITE_URL}${localizedPath(locale, href)}`);
      }
      expect(languages["x-default"]).toBe(languages.fr);
    }
    expect(alternates("/about", "fr").languages).toMatchObject({
      fr: `${SITE_URL}/fr/a-propos`,
      en: `${SITE_URL}/en/about`,
    });
    expect(alternates("/legal", "en").canonical).toBe(`${SITE_URL}/en/legal-notice`);
  });

  it("is reciprocal: every version lists the same set and is canonical for itself", () => {
    for (const href of hrefs) {
      const [a, b] = routing.locales.map((locale) => alternates(href, locale));
      expect(a?.languages).toEqual(b?.languages);
      for (const locale of routing.locales) {
        expect(alternates(href, locale).canonical).toBe(a?.languages[locale]);
      }
    }
  });
});

describe("sitemap", () => {
  const entries = sitemapEntries(indexableHrefs());
  const urls = entries.map((e) => e.url);

  it("lists the indexable pages and the public case studies, in both locales", () => {
    for (const locale of routing.locales) {
      for (const [, page] of Object.entries(PAGES).filter(([, p]) => p.indexable)) {
        expect(urls).toContain(`${SITE_URL}${localizedPath(locale, page.href)}`);
      }
      for (const { slug } of caseStudyProjects()) {
        expect(urls).toContain(`${SITE_URL}${localizedPath(locale, caseHref(slug))}`);
      }
    }
    expect(urls).toHaveLength(indexableHrefs().length * routing.locales.length);
  });

  it("gives every entry both alternates", () => {
    for (const entry of entries) {
      const languages = entry.alternates?.languages ?? {};
      expect(Object.keys(languages).sort()).toEqual(["en", "fr", "x-default"]);
      expect(Object.values(languages)).toContain(entry.url);
    }
  });

  it("never lists the legal notice, a project without a case study or a lastModified date", () => {
    expect(urls.some((u) => /mentions-legales|legal-notice/.test(u))).toBe(false);
    const withoutCase = PROJECTS.filter((p) => !caseStudyProjects().includes(p));
    expect(withoutCase.length).toBeGreaterThan(0);
    for (const { slug } of withoutCase) {
      expect(urls.some((u) => u.endsWith(`/${slug}`))).toBe(false);
    }
    expect(entries.every((e) => e.lastModified === undefined)).toBe(true);
  });
});

describe("robots", () => {
  it("indexes the production deployment only", () => {
    expect(isIndexable("production")).toBe(true);
    for (const value of ["preview", "development", undefined]) {
      expect(isIndexable(value)).toBe(false);
    }
  });

  it("disallows everything outside production, allows it and names the sitemap in production", () => {
    expect(robotsFile(false)).toEqual({ rules: { userAgent: "*", disallow: "/" } });
    expect(robotsFile(true)).toEqual({
      rules: { userAgent: "*", allow: "/" },
      sitemap: `${SITE_URL}/sitemap.xml`,
    });
  });

  it("sends noindex, nofollow everywhere outside production, and noindex on the legal notice", () => {
    expect(robotsFor({ indexable: true }, false)).toEqual({ index: false, follow: false });
    expect(robotsFor({ indexable: true }, true)).toEqual({ index: true, follow: true });
    expect(robotsFor({ indexable: PAGES.legal.indexable }, true)).toEqual({
      index: false,
      follow: true,
    });
  });

  it("builds a page's metadata with its canonical, alternates, Open Graph and Twitter card", () => {
    const meta = buildMetadata(
      {
        locale: "en",
        href: "/work",
        title: "Work",
        description: "d",
        indexable: true,
        image: { url: "/en/og/work.png", alt: "a", width: 1200, height: 630, type: "image/png" },
      },
      true,
    );
    expect(meta.alternates?.canonical).toBe(`${SITE_URL}/en/work`);
    expect(meta.openGraph).toMatchObject({
      type: "website",
      locale: "en_US",
      alternateLocale: ["fr_FR"],
      siteName: "Abdelhadev",
      title: "Work | Abdelhadev",
    });
    expect(meta.twitter).toMatchObject({ card: "summary_large_image" });
    expect(meta.robots).toEqual({ index: true, follow: true });
  });
});

describe("structured data", () => {
  function keysOf(value: JsonLdValue): string[] {
    if (Array.isArray(value)) return value.flatMap((v: JsonLdValue) => keysOf(v));
    if (value !== null && typeof value === "object") {
      return Object.entries(value).flatMap(([k, v]) => [k, ...keysOf(v)]);
    }
    return [];
  }

  const samples = routing.locales.flatMap((locale) => [
    homeJsonLd({
      locale,
      homeUrl: `${SITE_URL}/${locale}`,
      jobTitle: MESSAGES[locale].seo.jobTitle,
    }),
    breadcrumbJsonLd([
      { name: "a", url: `${SITE_URL}/${locale}` },
      { name: "b", url: `${SITE_URL}/${locale}/work` },
    ]),
  ]);

  it("never produces a forbidden key", () => {
    for (const data of samples) {
      const keys = keysOf(data);
      for (const forbidden of FORBIDDEN_KEYS) expect(keys).not.toContain(forbidden);
    }
    expect(FORBIDDEN_KEYS).toEqual(
      expect.arrayContaining(["aggregateRating", "review", "offers", "price", "alumniOf"]),
    );
    expect(FORBIDDEN_KEYS).toEqual(expect.arrayContaining(["worksFor", "award"]));
  });

  it("describes the person from site.ts and the job title from the messages", () => {
    const home = homeJsonLd({ locale: "fr", homeUrl: `${SITE_URL}/fr`, jobTitle: fr.seo.jobTitle });
    const json = JSON.stringify(home);
    expect(json).toContain('"name":"Abdelhadi Bouchadi"');
    expect(json).toContain('"jobTitle":"Développeur full-stack"');
    expect(json).toContain('"addressLocality":"Agadir"');
    expect(json).toContain('"addressCountry":"MA"');
    expect(json).toContain("linkedin.com");
    expect(en.seo.jobTitle).toBe("Full-stack developer");
  });

  it("escapes < so no string can close the script element", () => {
    const out = serializeJsonLd({ name: "</script><script>alert(1)</script>" });
    expect(out).not.toContain("<");
    expect(JSON.parse(out)).toEqual({ name: "</script><script>alert(1)</script>" });
  });
});

describe("Open Graph cards", () => {
  it("has one card per page and public case study, each with copy in both locales", () => {
    const names = ogPages().map(ogCardName);
    expect(names).toEqual([
      "home.png",
      "work.png",
      "about.png",
      "contact.png",
      "work-dentaflow.png",
    ]);
    for (const name of names) expect(ogPageOf(name)).toBeDefined();
    expect(ogPageOf("legal.png")).toBeUndefined();
    for (const locale of routing.locales) {
      const { pages, cases } = MESSAGES[locale].seo;
      for (const key of ["home", "work", "about", "contact"] as const) {
        expect(pages[key].ogTitle.length).toBeGreaterThan(0);
        expect(pages[key].ogLine.length).toBeGreaterThan(0);
      }
      expect(cases.dentaflow.ogTitle).toBe("DentaFlow");
    }
  });
});

describe("project statuses (09)", () => {
  it("are no longer placeholders, and each has a label in both locales", () => {
    for (const p of PROJECTS) {
      expect(isTodo(p.status), p.slug).toBe(false);
      const key = statusKey(p);
      expect(fr.work.status[key].length).toBeGreaterThan(0);
      expect(en.work.status[key].length).toBeGreaterThan(0);
    }
    expect(LABELLED_STATUSES).toContain("ready");
    expect(Object.hasOwn(fr.work.status, "todo")).toBe(false);
    expect(Object.hasOwn(en.work.status, "todo")).toBe(false);
  });

  it("use my wording", () => {
    const by = (slug: string) => PROJECTS.find((p) => p.slug === slug)?.status;
    expect(by("meetai")).toBe("test-mode");
    expect(by("hms")).toBe("used");
    expect(by("yoga-booking")).toBe("working");
    expect(by("cote-royale")).toBe("concept");
    expect(fr.work.status.concept).toBe("Projet de démonstration");
    expect(en.work.status["test-mode"]).toBe("Deployed, subscription in test mode");
  });
});

describe("French copy", () => {
  it("passes check:fr", () => {
    expect(checkFrench(fr).errors).toEqual([]);
  });
});
