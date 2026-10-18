/* Locales and localised pathnames (docs/architecture.md, "Routing"). Keys are the internal paths,
   which are also the folder names under src/app/[locale]. */
import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["fr", "en"],
  defaultLocale: "fr",
  localePrefix: "always",
  // hreflang comes from page metadata (lib/seo.ts) on the canonical domain. The middleware's Link
  // header would repeat it with the request host and conflict with the canonical URL.
  alternateLinks: false,
  pathnames: {
    "/": "/",
    "/work": { fr: "/projets", en: "/work" },
    "/work/[slug]": { fr: "/projets/[slug]", en: "/work/[slug]" },
    "/about": { fr: "/a-propos", en: "/about" },
    "/contact": "/contact",
    "/legal": { fr: "/mentions-legales", en: "/legal-notice" },
  },
});

export type Locale = (typeof routing.locales)[number];
export type Pathname = keyof typeof routing.pathnames;
