import type { MetadataRoute } from "next";
import { indexableHrefs } from "@/lib/routes";
import { sitemapEntries } from "@/lib/seo";

// Every indexable page in both locales, each with its alternates: the pages lib/routes.ts marks
// indexable (not the legal notice) and the public case studies (decision P7). The same table
// gives the canonical URLs (lib/seo.ts) and the tests' route list (tests/e2e/routes.ts).
export default function sitemap(): MetadataRoute.Sitemap {
  return sitemapEntries(indexableHrefs());
}
