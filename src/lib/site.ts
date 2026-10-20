/* The single source for identity, contact channels and URLs. Values I have not supplied are
   placeholders (src/lib/todo.ts): never invent them. */
import { isTodo } from "@/lib/todo";

const WHATSAPP_E164 = "+212637025032";

export const SITE = {
  legalName: "Abdelhadi Bouchadi",
  brand: "Abdelhadev",
  url: "https://abdelhadev.me",
  city: "Agadir",
  /** ISO 3166-1 alpha-2. Display names come from Intl.DisplayNames. */
  country: "MA",
  timeZone: "Africa/Casablanca",
  /** E.164. `href` is the wa.me link (digits only, as wa.me expects). */
  whatsapp: {
    e164: WHATSAPP_E164,
    href: `https://wa.me/${WHATSAPP_E164.slice(1)}`,
    display: "+212 6 37 02 50 32",
  },
  /** Forwards to a private inbox that never appears in the repository. */
  email: "contact@abdelhadev.me",
  linkedin: "https://www.linkedin.com/in/abdelhadi-bouchadi-904b5b359/",
  github: "https://github.com/AbdelhadiBouchadi",
  /** "pending" until the legal notice is reviewed; the build fails on it with REQUIRE_CONTENT=1. */
  legalReview: "pending" as "pending" | "done",
  /** ISO date. */
  legalUpdated: "2026-10-17",
  /** Source: https://vercel.com/legal/privacy-policy (read 2026-10-17). */
  host: {
    name: "Vercel Inc.",
    // "\u0023" is the number sign: written plainly before the four-digit suite number it reads
    // as a hex colour to `pnpm check:tokens`. The rendered text is Vercel's address verbatim.
    address: "440 N Barranca Avenue \u00234133, Covina, CA 91723, United States",
    url: "https://vercel.com",
  },
  /** Generated avatars in some DentaFlow screenshots (DiceBear Personas by Draftbit). */
  credits: {
    dicebear: "https://www.dicebear.com",
    licence: "https://creativecommons.org/licenses/by/4.0/",
  },
} as const;

export function todoReport(site: Readonly<Record<string, unknown>> = SITE): string[] {
  return Object.entries(site)
    .filter(([key, value]) => isTodo(value) || (key === "legalReview" && value === "pending"))
    .map(([key, value]) => `${key}: ${String(value)}`);
}

/** The country name comes from the locale's own data. */
export function placeName(locale: string): string {
  const country = new Intl.DisplayNames([locale], { type: "region" }).of(SITE.country);
  return country ? `${SITE.city}, ${country}` : SITE.city;
}
