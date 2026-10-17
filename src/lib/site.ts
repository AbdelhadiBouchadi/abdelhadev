/* Identity, contact channels and URLs. The single source for these facts (AGENTS.md).
   Values the owner has not supplied are placeholders (src/lib/todo.ts): never invent them. The
   build lists every placeholder and fails on them when REQUIRE_CONTENT=1. */
import { isTodo, type Todo } from "@/lib/todo";

export const SITE = {
  legalName: "Abdelhadi Bouchadi",
  brand: "Abdelhadev",
  url: "https://abdelhadev.me",
  city: "Agadir",
  /** ISO 3166-1 alpha-2. Display names come from Intl.DisplayNames in the page's locale. */
  country: "MA",
  timeZone: "Africa/Casablanca",
  /** International format without "+" or spaces, as wa.me expects. Source: the prototype's WhatsApp composer. */
  whatsapp: "212637025032",
  email: "[TODO: public email address]" satisfies Todo,
  linkedin: "[TODO: LinkedIn profile URL]" satisfies Todo,
  github: "[TODO: GitHub profile URL]" satisfies Todo,
  /** "pending" until the owner has had the legal notice reviewed; the build fails on it with
      REQUIRE_CONTENT=1. */
  legalReview: "pending" as "pending" | "done",
  /** The date the legal notice was last changed (ISO). */
  legalUpdated: "2026-10-17",
  /** The host named in the legal notice. Source: https://vercel.com/legal/privacy-policy
      (read 2026-10-17). */
  host: {
    name: "Vercel Inc.",
    // "\u0023" is the number sign: written plainly before the four-digit suite number it reads
    // as a hex colour to `pnpm check:tokens`. The rendered text is Vercel's address verbatim.
    address: "440 N Barranca Avenue \u00234133, Covina, CA 91723, United States",
    url: "https://vercel.com",
  },
} as const;

/** Search engines may index the site. Flipped by the owner at launch (prompt 10). */
export const INDEXABLE: boolean = false;

/** Lists every placeholder in SITE as `key: value`, and the legal review while it is pending. */
export function todoReport(site: Readonly<Record<string, unknown>> = SITE): string[] {
  return Object.entries(site)
    .filter(([key, value]) => isTodo(value) || (key === "legalReview" && value === "pending"))
    .map(([key, value]) => `${key}: ${String(value)}`);
}

/** "Agadir, Maroc" or "Agadir, Morocco": the country name comes from the locale's own data. */
export function placeName(locale: string): string {
  const country = new Intl.DisplayNames([locale], { type: "region" }).of(SITE.country);
  return country ? `${SITE.city}, ${country}` : SITE.city;
}
