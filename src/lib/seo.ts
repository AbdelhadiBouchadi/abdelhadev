/* Metadata helpers: metadata base, title template, alternates per locale, robots that follow
   INDEXABLE. JSON-LD builders arrive in 09. */
import type { Metadata } from "next";
import { getPathname } from "@/i18n/navigation";
import { routing, type Locale } from "@/i18n/routing";
import { INDEXABLE, SITE } from "@/lib/site";

type Href = Parameters<typeof getPathname>[0]["href"];

export function absoluteUrl(path: string): string {
  return new URL(path, SITE.url).toString();
}

/** Canonical URL for `locale` and hreflang alternates for every locale (plus x-default). */
export function alternates(
  href: Href,
  locale: Locale,
): { canonical: string; languages: Record<string, string> } {
  const languages: Record<string, string> = {};
  for (const l of routing.locales) languages[l] = absoluteUrl(getPathname({ href, locale: l }));
  languages["x-default"] = absoluteUrl(getPathname({ href, locale: routing.defaultLocale }));
  return { canonical: absoluteUrl(getPathname({ href, locale })), languages };
}

export const robots: NonNullable<Metadata["robots"]> = INDEXABLE
  ? { index: true, follow: true }
  : { index: false, follow: false };

export function baseMetadata(locale: Locale, description: string): Metadata {
  return {
    metadataBase: new URL(SITE.url),
    title: { template: `%s · ${SITE.brand}`, default: SITE.brand },
    description,
    applicationName: SITE.brand,
    authors: [{ name: SITE.legalName }],
    robots,
    openGraph: openGraph(locale),
  };
}

// Next merges metadata shallowly per key: every page repeats the shared Open Graph fields.
function openGraph(locale: Locale) {
  return {
    type: "website",
    siteName: SITE.brand,
    locale: locale === "fr" ? "fr_MA" : "en_US",
  } as const;
}

/** Metadata for one page: title, description and alternates. */
export function pageMetadata(
  href: Href,
  locale: Locale,
  { title, description }: { title: string; description?: string },
): Metadata {
  const url = alternates(href, locale);
  return {
    title,
    ...(description ? { description } : {}),
    alternates: url,
    openGraph: { ...openGraph(locale), title, url: url.canonical },
  };
}
