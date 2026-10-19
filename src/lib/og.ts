/* The Open Graph cards: which pages have one, where each is served, and its copy in each
   language (messages: seo.pages.<key> and seo.cases.<slug>, ogTitle and ogLine, and the alt text
   template seo.ogAlt). The drawing is components/brand/og-card.tsx; the route
   app/[locale]/og/[card]/route.tsx prerenders every card at build, and lib/seo.ts links it from
   each page's metadata with its alt text.

   Why a route and not the opengraph-image file convention: in Next 16 the convention can give a
   per-locale alt only through generateImageMetadata, which Next calls without the [locale] param
   when it collects static paths, so the cards could not be generated at build. */
import { getMessages } from "next-intl/server";
import { routing, type Locale } from "@/i18n/routing";
import { caseStudyProjects } from "@/lib/content/projects";
import type { PageKey } from "@/lib/routes";
import { SITE } from "@/lib/site";
import { isKeyOf } from "@/lib/utils";

export const OG_SIZE = { width: 1200, height: 630 } as const;
export const OG_TYPE = "image/png";

/** The pages with their own card. The legal notice and the 404 use the home page's. */
export type OgPage = Exclude<PageKey, "legal"> | { case: string };

const PAGE_CARDS = ["home", "work", "about", "contact"] as const satisfies readonly OgPage[];
const CASE_PREFIX = "work-";

export interface OgCopy {
  title: string;
  line: string;
  alt: string;
}

/** A card's file name in the route: "work.png", or "work-<slug>.png" for a case study. */
export function ogCardName(page: OgPage): string {
  return `${typeof page === "string" ? page : `${CASE_PREFIX}${page.case}`}.png`;
}

/** Every card, for the route's generateStaticParams: the pages and each public case study. */
export function ogPages(): OgPage[] {
  return [...PAGE_CARDS, ...caseStudyProjects().map(({ slug }) => ({ case: slug }))];
}

/** The page a card name stands for, or undefined for an unknown name. */
export function ogPageOf(name: string): OgPage | undefined {
  return ogPages().find((page) => ogCardName(page) === name);
}

/** The card's path, from the site root. */
export function ogCardPath(locale: Locale, page: OgPage): string {
  return `/${locale}/og/${ogCardName(page)}`;
}

/** The [locale] param as a locale (generateStaticParams only produces valid ones). */
export function ogLocale(value: string): Locale {
  const locale = routing.locales.find((l) => l === value);
  if (!locale) throw new Error(`Unknown locale ${value}`);
  return locale;
}

export async function ogCopy(locale: Locale, page: OgPage): Promise<OgCopy> {
  const { seo } = await getMessages({ locale });
  let entry: { ogTitle: string; ogLine: string };
  if (typeof page === "string") {
    entry = seo.pages[page];
  } else {
    if (!isKeyOf(seo.cases, page.case)) {
      throw new Error(`messages: seo.cases.${page.case} is missing`);
    }
    entry = seo.cases[page.case];
  }
  const alt = seo.ogAlt
    .replace("{brand}", SITE.brand)
    .replace("{title}", entry.ogTitle)
    .replace("{line}", entry.ogLine);
  return { title: entry.ogTitle, line: entry.ogLine, alt };
}

/** The image entry for a page's Open Graph and Twitter metadata. */
export async function ogImage(locale: Locale, page: OgPage) {
  const { alt } = await ogCopy(locale, page);
  return { url: ogCardPath(locale, page), alt, type: OG_TYPE, ...OG_SIZE };
}
