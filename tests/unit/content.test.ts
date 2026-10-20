import { describe, expect, it } from "vitest";
import en from "@messages/en.json";
import fr from "@messages/fr.json";
import { readFileSync } from "node:fs";
import { PROJECTS, PROJECT_SLUGS } from "@/lib/content/projects";
import { project } from "@/lib/content/schema";
import { DEFAULT_CONTACT_FROM, parseEnv } from "@/lib/env";
import { SITE, todoReport } from "@/lib/site";
import { isTodo } from "@/lib/todo";

describe("projects", () => {
  it("lists the five projects of docs/content.md in the work order (08c)", () => {
    expect(PROJECT_SLUGS).toEqual(["dentaflow", "meetai", "hms", "yoga-booking", "cote-royale"]);
  });

  it("has localised copy for every project in both locales", () => {
    for (const slug of PROJECT_SLUGS) {
      expect(Object.hasOwn(fr.projects, slug), `fr ${slug}`).toBe(true);
      expect(Object.hasOwn(en.projects, slug), `en ${slug}`).toBe(true);
    }
  });

  it("keeps DentaFlow's known facts and invents no year", () => {
    const dentaflow = PROJECTS.find((p) => p.slug === "dentaflow");
    expect(dentaflow?.status).toBe("ready");
    expect(dentaflow?.featured).toBe(true);
    for (const p of PROJECTS) expect(p.year).toBeUndefined();
  });

  it("rejects an unknown status that is not a placeholder", () => {
    const result = project.safeParse({ ...PROJECTS[0], status: "maybe" });
    expect(result.success).toBe(false);
  });
});

describe("placeholders", () => {
  it("recognises only well-formed placeholders", () => {
    expect(isTodo("[TODO: email]")).toBe(true);
    expect(isTodo("[TODO]")).toBe(false);
    expect(isTodo("TODO: email")).toBe(false);
    expect(isTodo(3)).toBe(false);
  });

  it("lists the identity values still to supply and the pending legal review", () => {
    expect(todoReport()).toEqual(["legalReview: pending"]);
    expect(todoReport({ ...SITE, github: "[TODO: GitHub]" })).toEqual([
      "github: [TODO: GitHub]",
      "legalReview: pending",
    ]);
  });
});

describe("final content", () => {
  const LOCALES = { fr, en };

  it("leaves no placeholder in either messages file", () => {
    for (const locale of ["fr", "en"]) {
      expect(readFileSync(`messages/${locale}.json`, "utf8"), locale).not.toContain("[TODO");
    }
  });

  it("states how long contact messages are kept, in both languages", () => {
    expect(fr.pages.legal.data.retentionValue).toBe(
      "Les messages sont conservés douze mois au plus, puis supprimés.",
    );
    expect(en.pages.legal.data.retentionValue).toBe(
      "Messages are kept for up to 12 months, then deleted.",
    );
  });

  it("never claims treatment plans for DentaFlow", () => {
    const plan = /treatment plans?|plans? de traitement/i;
    for (const [locale, messages] of Object.entries(LOCALES)) {
      const dentaflow = JSON.stringify([
        messages.home.featured,
        messages.projects.dentaflow,
        messages.testimonials["sos-dental"],
      ]);
      expect(dentaflow, locale).not.toMatch(plan);
    }
    expect(PROJECTS.find((p) => p.slug === "dentaflow")?.features).toEqual([
      "agenda",
      "records",
      "treatments",
      "invoices",
    ]);
    expect(fr.home.featured.features.treatments).toBe("Actes et odontogramme");
    expect(en.home.featured.features.treatments).toBe("Treatments and dental chart");
  });
});

describe("env", () => {
  it("treats empty values as unset and keeps Resend optional", () => {
    expect(parseEnv({ VERCEL_ENV: "", RESEND_API_KEY: "" })).toEqual({
      NODE_ENV: "development",
      CONTACT_FROM: DEFAULT_CONTACT_FROM,
      CONTACT_DRY_RUN: "0",
    });
  });

  it("rejects an invalid email or environment", () => {
    expect(() => parseEnv({ CONTACT_TO: "nope" })).toThrow();
    expect(() => parseEnv({ VERCEL_ENV: "staging" })).toThrow();
  });
});
