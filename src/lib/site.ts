/* Identity, contact channels and URLs. The single source for these facts (AGENTS.md).
   Values the owner has not supplied are placeholders (src/lib/todo.ts): never invent them. The
   build lists every placeholder and fails on them when REQUIRE_CONTENT=1. */
import { isTodo } from "@/lib/todo";

const WHATSAPP_E164 = "+212637025032";

export const SITE = {
  legalName: "Abdelhadi Bouchadi",
  brand: "Abdelhadev",
  url: "https://abdelhadev.me",
  city: "Agadir",
  /** ISO 3166-1 alpha-2. Display names come from Intl.DisplayNames in the page's locale. */
  country: "MA",
  timeZone: "Africa/Casablanca",
  /** WhatsApp Business (supplied by the owner in 06). The number is E.164; `href` is the wa.me
      link built from it (digits only, as wa.me expects); `display` is how it is written. */
  whatsapp: {
    e164: WHATSAPP_E164,
    href: `https://wa.me/${WHATSAPP_E164.slice(1)}`,
    display: "+212 6 37 02 50 32",
  },
  /** The public email (supplied by the owner in 08a), shown in the footer and the legal notice.
      It forwards to a private inbox that never appears in the repository. */
  email: "contact@abdelhadev.me",
  linkedin: "https://www.linkedin.com/in/abdelhadi-bouchadi-904b5b359/",
  github: "https://github.com/AbdelhadiBouchadi",
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
