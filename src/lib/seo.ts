/* Metadata for every page, built from its message keys (messages: seo.*): title, description,
   canonical, hreflang alternates, Open Graph and Twitter, and robots. Pages call pageMetadata or
   caseMetadata in generateMetadata and never write metadata by hand. Also the robots file and the
   sitemap entries, from the same route table (lib/routes.ts).

   Indexing: only the production deployment (VERCEL_ENV=production) is indexable. Previews and
   local builds send `noindex, nofollow` on every page and disallow everything in robots.txt. */
import type { Metadata, MetadataRoute } from "next";
import { getMessages } from "next-intl/server";
import { routing, type Locale } from "@/i18n/routing";
import { env } from "@/lib/env";
import { breadcrumbJsonLd, homeJsonLd, type JsonLdObject } from "@/lib/json-ld";
import { ogImage } from "@/lib/og";
import { localizedPath, type RouteHref } from "@/lib/paths";
import { caseHref, PAGES, type PageKey } from "@/lib/routes";
import { SITE } from "@/lib/site";
import { isKeyOf } from "@/lib/utils";
import type fr from "@messages/fr.json";

/** Whether search engines may index a deployment: production only. */
export function isIndexable(vercelEnv: string | undefined): boolean {
  return vercelEnv === "production";
}

export const INDEXABLE = isIndexable(env.VERCEL_ENV);

/** Every title but the home page's (which is complete on its own). */
export const TITLE_TEMPLATE = `%s | ${SITE.brand}`;
export const TITLE_MAX = 60;
export const DESCRIPTION_RANGE = { min: 110, max: 160 } as const;

export function fullTitle(title: string): string {
  return TITLE_TEMPLATE.replace("%s", title);
}

/** Open Graph locales: each page names its own and the other one as an alternate. */
export const OG_LOCALE: Readonly<Record<Locale, string>> = { fr: "fr_FR", en: "en_US" };

export function absoluteUrl(path: string): string {
  return new URL(path, SITE.url).toString();
}

/** Canonical URL for `locale`, and hreflang alternates for every locale plus x-default (French).
    The paths come from the routing table (lib/paths.ts), so every pair is reciprocal. */
export function alternates(
  href: RouteHref,
  locale: Locale,
): { canonical: string; languages: Record<string, string> } {
  return { canonical: absoluteUrl(localizedPath(locale, href)), languages: languages(href) };
}

function languages(href: RouteHref): Record<string, string> {
  const map: Record<string, string> = {};
  for (const l of routing.locales) map[l] = absoluteUrl(localizedPath(l, href));
  map["x-default"] = absoluteUrl(localizedPath(routing.defaultLocale, href));
  return map;
}

/** Robots for a page: nothing is indexed outside production; a page that is never indexed (the
    legal notice, the 404) keeps its links followed in production. */
export function robotsFor(
  page: { indexable: boolean },
  siteIndexable: boolean = INDEXABLE,
): NonNullable<Metadata["robots"]> {
  if (!siteIndexable) return { index: false, follow: false };
  return { index: page.indexable, follow: true };
}

interface PageInput {
  locale: Locale;
  title: string;
  description: string;
  /** The page's href; absent for the 404, which has no canonical URL. */
  href?: RouteHref;
  /** The title is complete without the template (the home page). */
  absoluteTitle?: boolean;
  indexable: boolean;
  /** The page's Open Graph card (lib/og.ts), also the Twitter image. */
  image?: { url: string; alt: string; width: number; height: number; type: string };
}

/** The metadata of one page. Pure, so tests can call it with any input. */
export function buildMetadata(
  { locale, title, description, href, absoluteTitle = false, indexable, image }: PageInput,
  siteIndexable: boolean = INDEXABLE,
): Metadata {
  const shown = absoluteTitle ? title : fullTitle(title);
  const urls = href ? alternates(href, locale) : undefined;
  return {
    // Repeated here for the root 404, which sits outside the locale layout's baseMetadata.
    metadataBase: new URL(SITE.url),
    title: absoluteTitle ? { absolute: title } : title,
    description,
    robots: robotsFor({ indexable }, siteIndexable),
    ...(urls ? { alternates: urls } : {}),
    openGraph: {
      ...openGraphBase(locale),
      title: shown,
      description,
      ...(urls ? { url: urls.canonical } : {}),
      ...(image ? { images: [image] } : {}),
    },
    twitter: {
      card: "summary_large_image",
      title: shown,
      description,
      ...(image ? { images: [{ url: image.url, alt: image.alt }] } : {}),
    },
  };
}

// Next merges metadata shallowly per key: every page repeats the shared Open Graph fields.
function openGraphBase(locale: Locale) {
  return {
    type: "website",
    siteName: SITE.brand,
    locale: OG_LOCALE[locale],
    alternateLocale: routing.locales.filter((l) => l !== locale).map((l) => OG_LOCALE[l]),
  } as const;
}

/** The layout's defaults, under every page's own metadata. */
export function baseMetadata(locale: Locale, description: string): Metadata {
  return {
    metadataBase: new URL(SITE.url),
    title: { template: TITLE_TEMPLATE, default: SITE.brand },
    description,
    applicationName: SITE.brand,
    authors: [{ name: SITE.legalName }],
    robots: robotsFor({ indexable: true }),
    openGraph: openGraphBase(locale),
    twitter: { card: "summary_large_image" },
  };
}

export type SeoMessages = (typeof fr)["seo"];

export async function seoMessages(locale: Locale): Promise<SeoMessages> {
  return (await getMessages({ locale })).seo;
}

/** Metadata for one of the pages in lib/routes.ts. */
export async function pageMetadata(locale: Locale, key: PageKey): Promise<Metadata> {
  const copy = (await seoMessages(locale)).pages[key];
  const page = PAGES[key];
  return buildMetadata({
    locale,
    href: page.href,
    title: copy.title,
    description: copy.description,
    absoluteTitle: key === "home",
    indexable: page.indexable,
    // The legal notice has no card of its own: it shares the home page's.
    image: await ogImage(locale, key === "legal" ? "home" : key),
  });
}

/** Metadata for a case study (messages: seo.cases.<slug>). */
export async function caseMetadata(locale: Locale, slug: string): Promise<Metadata> {
  const { cases } = await seoMessages(locale);
  if (!isKeyOf(cases, slug)) throw new Error(`messages: seo.cases.${slug} is missing`);
  const copy = cases[slug];
  return buildMetadata({
    locale,
    href: caseHref(slug),
    title: copy.title,
    description: copy.description,
    indexable: true,
    image: await ogImage(locale, { case: slug }),
  });
}

/** The 404: no canonical URL, never indexed. */
export async function notFoundMetadata(locale: Locale): Promise<Metadata> {
  const copy = (await seoMessages(locale)).pages.notFound;
  return buildMetadata({
    locale,
    title: copy.title,
    description: copy.description,
    indexable: false,
    image: await ogImage(locale, "home"),
  });
}

/** robots.txt: production allows everything and names the sitemap; any other deployment
    disallows everything. Private paths are never listed. */
export function robotsFile(siteIndexable: boolean = INDEXABLE): MetadataRoute.Robots {
  if (!siteIndexable) return { rules: { userAgent: "*", disallow: "/" } };
  return {
    rules: { userAgent: "*", allow: "/" },
    sitemap: absoluteUrl("/sitemap.xml"),
  };
}

/** The sitemap: each href in every locale, each entry with all its alternates. No lastModified:
    the site has no truthful date per page. */
export function sitemapEntries(hrefs: readonly RouteHref[]): MetadataRoute.Sitemap {
  return hrefs.flatMap((href) => {
    const alternatesForHref = { languages: languages(href) };
    return routing.locales.map((locale) => ({
      url: absoluteUrl(localizedPath(locale, href)),
      alternates: alternatesForHref,
    }));
  });
}

/** The home page's structured data: the person and the website. */
export async function homeStructuredData(locale: Locale): Promise<JsonLdObject> {
  const { jobTitle } = await seoMessages(locale);
  return homeJsonLd({ locale, homeUrl: absoluteUrl(localizedPath(locale, "/")), jobTitle });
}

/** The breadcrumb of the work page, or of a case study when `project` is given. */
export async function workBreadcrumb(
  locale: Locale,
  project?: { slug: string; name: string },
): Promise<JsonLdObject> {
  const { nav } = await getMessages({ locale });
  const url = (href: RouteHref) => absoluteUrl(localizedPath(locale, href));
  return breadcrumbJsonLd([
    { name: nav.home, url: url("/") },
    { name: nav.work, url: url("/work") },
    ...(project ? [{ name: project.name, url: url(caseHref(project.slug)) }] : []),
  ]);
}
