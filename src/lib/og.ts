/* A route and not the opengraph-image convention: in Next 16 the convention gives a per-locale alt
   only through generateImageMetadata, which Next calls without the [locale] param when it collects
   static paths, so the cards could not be generated at build. */
import { getMessages } from "next-intl/server";
import { routing, type Locale } from "@/i18n/routing";
import { caseStudyProjects } from "@/lib/content/projects";
import type { PageKey } from "@/lib/routes";
import { SITE } from "@/lib/site";
import { isKeyOf } from "@/lib/utils";

export const OG_SIZE = { width: 1200, height: 630 } as const;
export const OG_TYPE = "image/png";

/** The legal notice and the 404 use the home page's card. */
export type OgPage = Exclude<PageKey, "legal"> | { case: string };

const PAGE_CARDS = ["home", "work", "about", "contact"] as const satisfies readonly OgPage[];
const CASE_PREFIX = "work-";

export interface OgCopy {
  title: string;
  line: string;
  alt: string;
}

/** "work.png", or "work-<slug>.png" for a case study. */
export function ogCardName(page: OgPage): string {
  return `${typeof page === "string" ? page : `${CASE_PREFIX}${page.case}`}.png`;
}

export function ogPages(): OgPage[] {
  return [...PAGE_CARDS, ...caseStudyProjects().map(({ slug }) => ({ case: slug }))];
}

export function ogPageOf(name: string): OgPage | undefined {
  return ogPages().find((page) => ogCardName(page) === name);
}

export function ogCardPath(locale: Locale, page: OgPage): string {
  return `/${locale}/og/${ogCardName(page)}`;
}

/** generateStaticParams only produces valid locales. */
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

export async function ogImage(locale: Locale, page: OgPage) {
  const { alt } = await ogCopy(locale, page);
  return { url: ogCardPath(locale, page), alt, type: OG_TYPE, ...OG_SIZE };
}
