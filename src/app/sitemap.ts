import type { MetadataRoute } from "next";
import { getPathname } from "@/i18n/navigation";
import { routing, type Pathname } from "@/i18n/routing";
import { PROJECT_SLUGS } from "@/lib/content/projects";
import { absoluteUrl } from "@/lib/seo";

type Href = Parameters<typeof getPathname>[0]["href"];

// Every public route; each locale is listed with its alternates. The lab is excluded.
const STATIC_ROUTES: Exclude<Pathname, "/work/[slug]" | "/lab">[] = [
  "/",
  "/work",
  "/about",
  "/contact",
  "/legal",
];

export default function sitemap(): MetadataRoute.Sitemap {
  const hrefs: Href[] = [
    ...STATIC_ROUTES,
    ...PROJECT_SLUGS.map((slug): Href => ({
      pathname: "/work/[slug]",
      params: { slug },
    })),
  ];
  return hrefs.flatMap((href) => {
    const languages = Object.fromEntries(
      routing.locales.map((locale) => [locale, absoluteUrl(getPathname({ locale, href }))]),
    );
    return routing.locales.map((locale) => ({
      url: absoluteUrl(getPathname({ locale, href })),
      alternates: { languages },
    }));
  });
}
