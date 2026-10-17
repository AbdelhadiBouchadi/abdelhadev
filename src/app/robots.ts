import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/lib/seo";

// Crawling stays allowed so crawlers can read the noindex robots meta while INDEXABLE is false;
// a Disallow here would hide that tag from them.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/" },
    sitemap: absoluteUrl("/sitemap.xml"),
  };
}
