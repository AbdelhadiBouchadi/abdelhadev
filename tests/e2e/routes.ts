// Every public route in both locales (the localised pathnames table in docs/architecture.md),
// generated from the same sources as the app so a new route or case study is covered
// automatically. Only the projects with a case study have a page (caseStudyProjects, 05).
import { routing } from "@/i18n/routing";
import { caseStudyProjects } from "@/lib/content/projects";

export interface Route {
  locale: "fr" | "en";
  path: string;
}

function localise(locale: "fr" | "en", key: keyof typeof routing.pathnames): string {
  const entry = routing.pathnames[key];
  const path = typeof entry === "string" ? entry : entry[locale];
  return `/${locale}${path === "/" ? "" : path}`;
}

export const ROUTES: Route[] = routing.locales.flatMap((locale) => [
  { locale, path: localise(locale, "/") },
  { locale, path: localise(locale, "/work") },
  ...caseStudyProjects().map(({ slug }) => ({
    locale,
    path: localise(locale, "/work/[slug]").replace("[slug]", slug),
  })),
  { locale, path: localise(locale, "/about") },
  { locale, path: localise(locale, "/contact") },
  { locale, path: localise(locale, "/legal") },
]);

export const LEGAL_NAME = "Abdelhadi Bouchadi";

/** A filesystem-safe name for a route, for screenshots. */
export const slugOf = (path: string) => path.replace(/^\//, "").replaceAll("/", "_") || "root";
