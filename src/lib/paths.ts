/* lib may not import next-intl's navigation module (docs/architecture.md), so this gives the same
   output as getPathname for localePrefix "always". */
import { routing, type Locale, type Pathname } from "@/i18n/routing";

type DynamicPathname = Extract<Pathname, `${string}[${string}]${string}`>;

export type RouteHref =
  | Exclude<Pathname, DynamicPathname>
  | { pathname: DynamicPathname; params: Record<string, string> };

export function localizedPath(locale: Locale, href: RouteHref): string {
  const key = typeof href === "string" ? href : href.pathname;
  const entry = routing.pathnames[key];
  let path: string = typeof entry === "string" ? entry : entry[locale];
  if (typeof href !== "string") {
    for (const [name, value] of Object.entries(href.params)) {
      path = path.replace(`[${name}]`, encodeURIComponent(value));
    }
  }
  return `/${locale}${path === "/" ? "" : path}`;
}
