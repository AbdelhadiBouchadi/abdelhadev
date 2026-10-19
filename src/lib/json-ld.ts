/* Structured data (JSON-LD), built only from site.ts, the content data and message strings the
   caller passes in: nothing here is a new fact. Rendered on the server by components/ui/JsonLd.
   Never produced, anywhere: ratings, reviews, offers or prices (decision P5), employers, schools,
   awards or years of experience (P3, P6), client names (P10). FORBIDDEN_KEYS lists them and
   tests/unit/seo.test.ts walks every builder's output for them. */
import type { Locale } from "@/i18n/routing";
import { STACK } from "@/lib/content/about";
import { SITE } from "@/lib/site";

export type JsonLdValue = string | number | boolean | JsonLdObject | readonly JsonLdValue[];
export interface JsonLdObject {
  readonly [key: string]: JsonLdValue;
}

export const FORBIDDEN_KEYS = [
  "aggregateRating",
  "review",
  "offers",
  "price",
  "alumniOf",
  "worksFor",
  "award",
  "yearsOfExperience",
  "employer",
  "client",
] as const;

const PERSON_ID = `${SITE.url}/#person`;
const WEBSITE_ID = `${SITE.url}/#website`;

/** The technologies the about page names as daily and per-project tools (not the ones he is
    only exploring). */
export function knowsAbout(): string[] {
  return STACK.filter((group) => group.key !== "exploring").flatMap((group) => [...group.items]);
}

/** The home page: the person and the website, linked by @id. `homeUrl` is the localised home. */
export function homeJsonLd({
  locale,
  homeUrl,
  jobTitle,
}: {
  locale: Locale;
  homeUrl: string;
  jobTitle: string;
}): JsonLdObject {
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Person",
        "@id": PERSON_ID,
        name: SITE.legalName,
        alternateName: SITE.brand,
        jobTitle,
        url: homeUrl,
        email: SITE.email,
        sameAs: [SITE.linkedin, SITE.github],
        address: {
          "@type": "PostalAddress",
          addressLocality: SITE.city,
          addressCountry: SITE.country,
        },
        knowsAbout: knowsAbout(),
      },
      {
        "@type": "WebSite",
        "@id": WEBSITE_ID,
        name: SITE.brand,
        url: homeUrl,
        inLanguage: locale,
        publisher: { "@id": PERSON_ID },
      },
    ],
  };
}

/** A breadcrumb trail, from the home page to the current page. */
export function breadcrumbJsonLd(items: readonly { name: string; url: string }[]): JsonLdObject {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

/** JSON for a <script type="application/ld+json">: `<` is escaped so no string can close the
    script element or open a comment. */
export function serializeJsonLd(data: JsonLdObject): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}
