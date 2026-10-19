import type { MetadataRoute } from "next";
import { robotsFile } from "@/lib/seo";

export default function robots(): MetadataRoute.Robots {
  return robotsFile();
}
