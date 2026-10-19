// The project copy and data of 08c (prompts/08c-project-copy.md, "Tests"): the five projects in
// order, no banned word in any project text, FR and EN for every field, the yoga media and the
// hero screens resolved in the manifest, and the French rules.
import { describe, expect, it } from "vitest";
import en from "@messages/en.json";
import fr from "@messages/fr.json";
import { checkFrench } from "@scripts/lib/fr-rules.mjs";
import { EXPERIENCE } from "@/lib/content/about";
import { PROJECT_SLUGS, PROJECTS } from "@/lib/content/projects";
import { heroMedia, MEDIA_MAP, workMedia } from "@/lib/media";
import { isKeyOf } from "@/lib/utils";

const FIELDS = ["name", "kind", "challenge", "built"] as const;

/** Every string of a project's copy, in one locale. */
function copyOf(messages: typeof fr | typeof en, slug: string): Record<string, string> {
  const { projects } = messages;
  if (!isKeyOf(projects, slug)) throw new Error(`messages.projects.${slug} is missing`);
  const out: Record<string, string> = {};
  for (const field of FIELDS) {
    const value: unknown = Reflect.get(projects[slug], field);
    if (typeof value === "string") out[field] = value;
  }
  return out;
}

/** Words no project text uses (AGENTS.md, decisions P3, P5, P17, P18). The names of the studio,
    the hospital and its professors are not in the repository, so they are caught by shape: a
    capitalised name right after the place or the title. */
const BANNED: readonly RegExp[] = [
  /flowshop/i,
  /ingénieur/i,
  /\bengineer\b/i,
  /étudiant/i,
  /\bstudents?\b/i,
  /en production/i,
  /in production/i,
  /\d+(?:[.,]\d+)?\s?(?:€|eur|dh|mad|\$)/i,
  /\b(?:prix|tarifs?|price|pricing)\b/i,
  /(?:studio|hôpital|hospital)\s+(?!de\b|d['’]|of\b|in\b|à\b)[A-Z]/,
  /\b(?:Pr|Dr|Professeur|Professor)\.?\s+[A-Z]/,
];

describe("project copy (08c)", () => {
  it("has exactly the five projects, in the work order", () => {
    expect(PROJECT_SLUGS).toEqual(["dentaflow", "meetai", "hms", "yoga-booking", "cote-royale"]);
    expect(PROJECTS.every((p) => p.permission === "confirmed")).toBe(true);
  });

  it("has FR and EN for each field, the same fields, and no placeholder outside DentaFlow", () => {
    for (const slug of PROJECT_SLUGS) {
      const a = copyOf(fr, slug);
      const b = copyOf(en, slug);
      expect(Object.keys(a), slug).toEqual([...FIELDS]);
      expect(Object.keys(b), slug).toEqual(Object.keys(a));
      for (const field of FIELDS) {
        expect(a[field], `fr ${slug}.${field}`).not.toBe("");
        expect(b[field], `en ${slug}.${field}`).not.toBe("");
        // DentaFlow's copy is the owner's to rework (08c); the four others are written.
        if (slug !== "dentaflow") {
          expect(a[field], `fr ${slug}.${field}`).not.toMatch(/\[TODO/);
          expect(b[field], `en ${slug}.${field}`).not.toMatch(/\[TODO/);
        }
      }
    }
  });

  it("uses no banned word in any project text or timeline entry", () => {
    const texts: [string, string][] = [];
    for (const [locale, messages] of [
      ["fr", fr],
      ["en", en],
    ] as const) {
      for (const slug of PROJECT_SLUGS) {
        for (const [field, text] of Object.entries(copyOf(messages, slug))) {
          texts.push([`${locale} ${slug}.${field}`, text]);
        }
      }
      for (const { key } of EXPERIENCE) {
        const item: unknown = Reflect.get(messages.about.experience.items, key);
        if (item && typeof item === "object") {
          for (const value of Object.values(item)) {
            if (typeof value === "string") texts.push([`${locale} about.${key}`, value]);
          }
        }
      }
    }
    for (const [where, text] of texts) {
      for (const pattern of BANNED)
        expect(text, `${where} ${String(pattern)}`).not.toMatch(pattern);
    }
  });

  it("keeps the shape checks honest", () => {
    const hits = (text: string) => BANNED.some((p) => p.test(text));
    expect(hits("le studio Zen")).toBe(true);
    expect(hits("Pr Alaoui")).toBe(true);
    expect(hits("un studio de yoga")).toBe(false);
    expect(hits("un hôpital d'Agadir")).toBe(false);
    expect(hits("a hospital in Agadir")).toBe(false);
  });

  it("dates Ophtachusm 2024 to 2025 and puts the yoga platform on the timeline", () => {
    expect(fr.about.experience.items.hms.when).toBe("2024 à 2025");
    expect(en.about.experience.items.hms.when).toBe("2024 to 2025");
    expect(EXPERIENCE.map((e) => e.key)).toEqual([
      "freelance",
      "dentaflow",
      "yoga",
      "hms",
      "education",
    ]);
    expect(fr.about.experience.items.yoga.when).toBe("2025 à 2026");
    expect(en.about.experience.items.yoga.where).toBe("Client");
  });

  it("resolves every yoga-booking screen of the map in the manifest", () => {
    const mapped = (MEDIA_MAP.projects["yoga-booking"] ?? []).filter((e) => e.role === "work");
    expect(mapped.length).toBeGreaterThan(0);
    expect(workMedia("yoga-booking")).toHaveLength(mapped.length);
  });

  it("resolves DentaFlow's hero screens: one for the case study, four for the home tiles", () => {
    expect(heroMedia("dentaflow", "case")).toHaveLength(1);
    expect(heroMedia("dentaflow", "home")).toHaveLength(4);
  });

  it("passes the French rules", () => {
    expect(checkFrench(fr).errors).toEqual([]);
    expect(checkFrench(fr).warnings).toEqual([]);
  });
});
