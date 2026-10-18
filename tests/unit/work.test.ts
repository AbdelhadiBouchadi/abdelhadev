// The work page's data and copy (prompts/04-work.md, "Tests"): publicProjects() and the schema
// rules, and the plural in the lead. The derived screen count, the case study list and the
// sitemap moved to tests/unit/case.test.ts in 05.
import { createTranslator } from "next-intl";
import { describe, expect, it } from "vitest";
import en from "@messages/en.json";
import fr from "@messages/fr.json";
import { PROJECTS, publicProjects } from "@/lib/content/projects";
import { MAX_SHEET_MEDIA, project, projects, type Project } from "@/lib/content/schema";

const [dentaflow, hms] = PROJECTS;
if (!dentaflow || !hms) throw new Error("the projects are missing");

const pending: Project = {
  ...hms,
  slug: "hidden",
  copyKey: "projects.hidden",
  permission: "pending",
};

describe("publicProjects", () => {
  it("keeps only the projects whose permission is confirmed, in order", () => {
    const fixture = [dentaflow, pending, hms];
    expect(publicProjects(fixture).map((p) => p.slug)).toEqual(["dentaflow", "hms"]);
  });

  it("shows all five projects today, DentaFlow first and the only case study", () => {
    const list = publicProjects();
    expect(list.map((p) => p.slug)).toEqual([
      "dentaflow",
      "hms",
      "meetai",
      "flowshop",
      "cote-royale",
    ]);
    expect(list.filter((p) => p.caseStudy).map((p) => p.slug)).toEqual(["dentaflow"]);
  });

  it("ports the prototype's media layouts", () => {
    const spans = Object.fromEntries(
      PROJECTS.map((p) => [p.slug, p.media.map((m) => `${String(m.span)} ${m.tone}`)]),
    );
    expect(spans).toEqual({
      dentaflow: ["7 warm", "5 plain", "4 plain", "4 blue", "4 plain"],
      hms: ["8 dark", "4 warm", "6 plain", "6 blue"],
      meetai: ["5 blue", "7 plain", "12 warm"],
      flowshop: ["6 warm", "6 plain", "4 blue", "8 plain"],
      "cote-royale": ["12 warm", "6 plain", "6 blue"],
    });
    for (const p of PROJECTS) for (const m of p.media) expect(m.kind).toBe("image");
  });

  it("starts Côte Royale's stack with GSAP and TypeScript, the rest a placeholder", () => {
    const cote = PROJECTS.find((p) => p.slug === "cote-royale");
    expect(cote?.stack).toEqual(["GSAP", "TypeScript", expect.stringMatching(/^\[TODO: .+\]$/)]);
  });
});

describe("project schema", () => {
  const media = { span: 4, tone: "plain", layout: "default", skeleton: "plan" } as const;

  it(`rejects more than ${String(MAX_SHEET_MEDIA)} media on a sheet`, () => {
    const result = project.safeParse({
      ...dentaflow,
      media: Array(MAX_SHEET_MEDIA + 1).fill(media),
    });
    expect(result.success).toBe(false);
  });

  it("defaults a media kind to image and accepts video", () => {
    const parsed = project.parse({ ...hms, media: [media, { ...media, kind: "video" }] });
    expect(parsed.media.map((m) => m.kind)).toEqual(["image", "video"]);
  });

  it("rejects an unknown permission, span or skeleton", () => {
    expect(project.safeParse({ ...hms, permission: "maybe" }).success).toBe(false);
    expect(project.safeParse({ ...hms, media: [{ ...media, span: 3 }] }).success).toBe(false);
    expect(project.safeParse({ ...hms, media: [{ ...media, skeleton: "map" }] }).success).toBe(
      false,
    );
  });

  it("no longer stores a screen count: it is derived from the case study (05)", () => {
    expect(project.safeParse({ ...dentaflow, screenCount: 9 }).success).toBe(false);
  });

  it("rejects duplicate slugs and a copyKey that does not match the slug", () => {
    expect(projects.safeParse([hms, hms]).success).toBe(false);
    expect(projects.safeParse([{ ...hms, copyKey: "projects.meetai" }]).success).toBe(false);
  });
});

describe("the work lead", () => {
  for (const [locale, messages, one, five] of [
    ["fr", fr, "1 projet,", "5 projets,"],
    ["en", en, "1 project,", "5 projects,"],
  ] as const) {
    it(`${locale}: counts the projects with a plural`, () => {
      const t = createTranslator({ locale, messages, namespace: "work" });
      expect(t("lead", { count: 1 })).toMatch(new RegExp(`^${one}`));
      expect(t("lead", { count: 5 })).toMatch(new RegExp(`^${five}`));
    });
  }
});
