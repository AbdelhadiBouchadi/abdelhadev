/* Localised paths from the routing table, without next-intl's navigation module: lib may import
   @/i18n/routing and nothing else from the app (docs/architecture.md, "Import boundaries").
   Same output as next-intl's getPathname for this project's config (localePrefix "always"). */
import { routing, type Locale, type Pathname } from "@/i18n/routing";

type DynamicPathname = Extract<Pathname, `${string}[${string}]${string}`>;

/** An internal pathname, with its params when it has dynamic segments. */
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
