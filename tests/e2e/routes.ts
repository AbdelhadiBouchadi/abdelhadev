// From the same table as the sitemap and the metadata (src/lib/routes.ts), so a new page or case
// study is covered automatically.
import { routing } from "@/i18n/routing";
import { caseStudyProjects } from "@/lib/content/projects";
import { localizedPath } from "@/lib/paths";
import { caseHref, PAGES, type PageKey } from "@/lib/routes";

export interface Route {
  locale: "fr" | "en";
  path: string;
  wordsLight: boolean;
  /** The legal notice is never indexed. */
  indexable: boolean;
  /** Its key in lib/routes.ts, or the case study's slug. */
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

export const slugOf = (path: string) => path.replace(/^\//, "").replaceAll("/", "_") || "root";
