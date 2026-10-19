/* The CV's file size, read from public/ when the page renders: the about page is static, so it is
   measured at build time and always matches the file that ships. Server only (node:fs). */
import "server-only";
import { statSync } from "node:fs";
import { join } from "node:path";
import type { Locale } from "@/i18n/routing";
import { CV } from "@/lib/content/cv";

export function cvBytes(locale: Locale): number {
  return statSync(join(process.cwd(), "public", CV[locale].href)).size;
}

/** A size as people read it: "24 ko" or "1,2 Mo" in French, "24 kB" or "1.2 MB" in English. */
export function formatFileSize(bytes: number, locale: Locale): string {
  const mega = bytes >= 1024 * 1024;
  const value = mega ? bytes / (1024 * 1024) : Math.max(1, Math.round(bytes / 1024));
  return new Intl.NumberFormat(locale, {
    style: "unit",
    unit: mega ? "megabyte" : "kilobyte",
    unitDisplay: "short",
    maximumFractionDigits: mega ? 1 : 0,
  }).format(value);
}
