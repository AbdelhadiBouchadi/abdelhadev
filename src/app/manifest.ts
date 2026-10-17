import type { MetadataRoute } from "next";
import { SITE } from "@/lib/site";
import { cssToken } from "@/lib/tokens";

export default function manifest(): MetadataRoute.Manifest {
  const paper = cssToken("paper");
  return {
    name: SITE.brand,
    short_name: SITE.brand,
    start_url: "/",
    display: "standalone",
    theme_color: paper,
    background_color: paper,
    icons: [
      { src: "/brand/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/brand/icon-512.png", sizes: "512x512", type: "image/png" },
      {
        src: "/brand/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
