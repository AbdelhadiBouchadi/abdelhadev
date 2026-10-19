/* The about page's structure: what is shown and in which order. The copy of every entry lives in
   messages (namespace `about`, same keys); technology names are proper nouns and are not
   translated, so the stack chips live here. Only the owner's facts (docs/content.md, "About and
   experience"); the order of the services is his and is fixed. */

/** What he builds, in the owner's order (messages: about.services.items.<key>). */
export const SERVICES = ["clinics", "ai", "shops", "websites", "other"] as const;

/** How a project runs, first call to delivery (messages: about.process.steps.<key>). */
export const PROCESS = ["listen", "scope", "quote", "build", "deliver"] as const;

/** The three chapters of the sticky stage (messages: about.chapters.<key>). */
export const CHAPTERS = ["who", "how", "why"] as const;

/** The timeline, newest first (messages: about.experience.items.<key>). `detail: false` has no
    line of text (the education entry: no university, no year, decision P3). */
export const EXPERIENCE = [
  { key: "freelance", detail: true },
  { key: "dentaflow", detail: true },
  { key: "hms", detail: true },
  { key: "education", detail: false },
] as const;

/** The stack, by how often he reaches for it (messages: about.stack.groups.<key>). */
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

/** "Right now" (messages: about.now.cards.<key>): where each card links, if anywhere. */
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
