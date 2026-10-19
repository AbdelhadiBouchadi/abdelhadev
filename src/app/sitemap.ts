import type { MetadataRoute } from "next";
import { indexableHrefs } from "@/lib/routes";
import { sitemapEntries } from "@/lib/seo";

export default function sitemap(): MetadataRoute.Sitemap {
  return sitemapEntries(indexableHrefs());
}
