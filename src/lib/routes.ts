/* One table for the metadata, the sitemap and the tests, so a page cannot be indexed, listed or
   tested without the others knowing. No server-only import: Playwright reads it. */
import type { RouteHref } from "@/lib/paths";
import { caseStudyProjects } from "@/lib/content/projects";

export const PAGES = {
  home: { href: "/", indexable: true },
  work: { href: "/work", indexable: true },
  about: { href: "/about", indexable: true },
  contact: { href: "/contact", indexable: true },
  // Served and linked, never indexed.
  legal: { href: "/legal", indexable: false },
} as const satisfies Record<string, { href: RouteHref; indexable: boolean }>;

export type PageKey = keyof typeof PAGES;

export function caseHref(slug: string): RouteHref {
  return { pathname: "/work/[slug]", params: { slug } };
}

/** A hidden or unconfirmed project never gets a URL. */
export function indexableHrefs(): RouteHref[] {
  const pages = Object.values(PAGES)
    .filter((page) => page.indexable)
    .map((page): RouteHref => page.href);
  return [...pages, ...caseStudyProjects().map(({ slug }) => caseHref(slug))];
}
