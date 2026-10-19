// Every public route in both locales, from the same table as the sitemap and the page metadata
// (src/lib/routes.ts), with the paths of the routing table (src/lib/paths.ts): a new page or case
// study is covered automatically. Only the projects with a case study have a page (05).
import { routing } from "@/i18n/routing";
import { caseStudyProjects } from "@/lib/content/projects";
import { localizedPath } from "@/lib/paths";
import { caseHref, PAGES, type PageKey } from "@/lib/routes";

export interface Route {
  locale: "fr" | "en";
  path: string;
  /** The page has WordsLight statements (home manifesto, case-study problem, about chapters). */
  wordsLight: boolean;
  /** Search engines may index it in production (the legal notice may not). */
  indexable: boolean;
  /** The page's key in lib/routes.ts, or the case study's slug. */
  page: PageKey | { case: string };
}

const WORDS_LIGHT: ReadonlySet<PageKey> = new Set(["home", "about"]);

export const ROUTES: Route[] = routing.locales.flatMap((locale) => {
  const page = (key: PageKey): Route => ({
    locale,
    path: localizedPath(locale, PAGES[key].href),
    wordsLight: WORDS_LIGHT.has(key),
    indexable: PAGES[key].indexable,
    page: key,
  });
  return [
    page("home"),
    page("work"),
    ...caseStudyProjects().map(({ slug }): Route => ({
      locale,
      path: localizedPath(locale, caseHref(slug)),
      wordsLight: true,
      indexable: true,
      page: { case: slug },
    })),
    page("about"),
    page("contact"),
    page("legal"),
  ];
});

export const LEGAL_NAME = "Abdelhadi Bouchadi";

/** A filesystem-safe name for a route, for screenshots. */
export const slugOf = (path: string) => path.replace(/^\//, "").replaceAll("/", "_") || "root";
