import type { MetadataRoute } from "next";
import { robotsFile } from "@/lib/seo";

// Production allows everything and names the sitemap; previews and local builds disallow
// everything (lib/seo.ts, robotsFile).
export default function robots(): MetadataRoute.Robots {
  return robotsFile();
}
