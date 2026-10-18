import type { MetadataRoute } from "next";
import { routing, type Pathname } from "@/i18n/routing";
import { publicProjects } from "@/lib/content/projects";
import { localizedPath, type RouteHref } from "@/lib/paths";
import { absoluteUrl } from "@/lib/seo";

// Every public route; each locale is listed with its alternates. The lab is excluded, and so is
// any project whose permission is pending (decision P7). Paths come from lib/paths.ts, as in the
// page metadata (lib/seo.ts), so the sitemap and the canonical URLs agree.
const STATIC_ROUTES: Exclude<Pathname, "/work/[slug]" | "/lab">[] = [
  "/",
  "/work",
  "/about",
  "/contact",
  "/legal",
];

export default function sitemap(): MetadataRoute.Sitemap {
  const hrefs: RouteHref[] = [
    ...STATIC_ROUTES,
    ...publicProjects().map(({ slug }): RouteHref => ({
      pathname: "/work/[slug]",
      params: { slug },
    })),
  ];
  return hrefs.flatMap((href) => {
    const languages = Object.fromEntries(
      routing.locales.map((locale) => [locale, absoluteUrl(localizedPath(locale, href))]),
    );
    return routing.locales.map((locale) => ({
      url: absoluteUrl(localizedPath(locale, href)),
      alternates: { languages },
    }));
  });
}
