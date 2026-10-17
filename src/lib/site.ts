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
} as const;

/** Search engines may index the site. Flipped by the owner at launch (prompt 10). */
export const INDEXABLE: boolean = false;

/** Lists every placeholder in SITE as `key: value`. */
export function todoReport(site: Readonly<Record<string, unknown>> = SITE): string[] {
  return Object.entries(site)
    .filter(([, value]) => isTodo(value))
    .map(([key, value]) => `${key}: ${String(value)}`);
}
