import { describe, expect, it } from "vitest";
import en from "@messages/en.json";
import fr from "@messages/fr.json";
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

  it("lists the identity values the owner still has to supply and the pending legal review", () => {
    // LinkedIn, GitHub and WhatsApp were supplied in 06, the public email in 08a.
    expect(todoReport()).toEqual(["legalReview: pending"]);
    expect(todoReport({ ...SITE, github: "[TODO: GitHub]" })).toEqual([
      "github: [TODO: GitHub]",
      "legalReview: pending",
    ]);
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
