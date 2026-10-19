/* The site's pages, one table for the metadata (lib/seo.ts), the sitemap and the tests
   (tests/e2e/routes.ts), so a page cannot be indexed, listed or tested without the others knowing.
   Pure: no server-only import, so Playwright can read it. */
import type { RouteHref } from "@/lib/paths";
import { caseStudyProjects } from "@/lib/content/projects";

/** The pages with their own metadata (messages: seo.pages.<key>). */
export const PAGES = {
  home: { href: "/", indexable: true },
  work: { href: "/work", indexable: true },
  about: { href: "/about", indexable: true },
  contact: { href: "/contact", indexable: true },
  // The legal notice is served and linked, never indexed (09).
  legal: { href: "/legal", indexable: false },
} as const satisfies Record<string, { href: RouteHref; indexable: boolean }>;

export type PageKey = keyof typeof PAGES;

/** A case study's href (messages: seo.cases.<slug>). */
export function caseHref(slug: string): RouteHref {
  return { pathname: "/work/[slug]", params: { slug } };
}

/** Every page a search engine may index: the indexable pages, then the public case studies
    (decision P7: a hidden or unconfirmed project never gets a URL). */
export function indexableHrefs(): RouteHref[] {
  const pages = Object.values(PAGES)
    .filter((page) => page.indexable)
    .map((page): RouteHref => page.href);
  return [...pages, ...caseStudyProjects().map(({ slug }) => caseHref(slug))];
}
