/* Copy lives in messages (namespace `about`, same keys). Technology names are not translated,
   so the stack chips live here. */

export const SERVICES = ["clinics", "ai", "shops", "websites", "other"] as const;

export const PROCESS = ["listen", "scope", "quote", "build", "deliver"] as const;

export const CHAPTERS = ["who", "how", "why"] as const;

/** Newest first. `detail: false` has no line of text (the education entry). */
export const EXPERIENCE = [
  { key: "freelance", detail: true },
  { key: "dentaflow", detail: true },
  { key: "yoga", detail: true },
  { key: "hms", detail: true },
  { key: "education", detail: false },
] as const;

export const STACK = [
  {
    key: "daily",
    items: [
      "Next.js",
      "TypeScript",
      "tRPC",
      "Drizzle ORM",
      "PostgreSQL (Neon)",
      "Better Auth",
      "Arcjet",
      "shadcn/ui",
    ],
  },
  {
    key: "project",
    items: ["AI SDK", "OpenAI API", "Shopify headless", "WordPress", "GSAP"],
  },
  { key: "exploring", items: ["Trigger.dev", "Browserbase"] },
] as const;

export const NOW = [
  { key: "dentaflow", link: "case" },
  { key: "open", link: "contact" },
  { key: "exploring", link: null },
] as const;

export type ServiceKey = (typeof SERVICES)[number];
export type ProcessKey = (typeof PROCESS)[number];
export type ChapterKey = (typeof CHAPTERS)[number];
export type ExperienceKey = (typeof EXPERIENCE)[number]["key"];
export type StackKey = (typeof STACK)[number]["key"];
export type NowKey = (typeof NOW)[number]["key"];
