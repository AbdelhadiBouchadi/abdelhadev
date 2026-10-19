// The work page's data and copy (prompts/04-work.md, "Tests"): publicProjects() and the schema
// rules, and the work page copy (08c). The derived screen count, the case study list and the
// sitemap moved to tests/unit/case.test.ts in 05.
import { createTranslator } from "next-intl";
import { describe, expect, it } from "vitest";
import en from "@messages/en.json";
import fr from "@messages/fr.json";
import { getProject, PROJECTS, publicProjects, WORK_ORDER } from "@/lib/content/projects";
import { MAX_SHEET_MEDIA, project, projects, type Project } from "@/lib/content/schema";

const dentaflow = getProject("dentaflow");
const hms = getProject("hms");
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

  it("shows the five projects in the work order (08c), DentaFlow first and the only case study", () => {
    const list = publicProjects();
    expect(list.map((p) => p.slug)).toEqual([...WORK_ORDER]);
    expect(WORK_ORDER).toEqual(["dentaflow", "meetai", "hms", "yoga-booking", "cote-royale"]);
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
      "yoga-booking": ["7 warm", "5 plain", "6 blue", "6 plain"],
      "cote-royale": ["12 warm", "6 plain", "6 blue"],
    });
    for (const p of PROJECTS) for (const m of p.media) expect(m.kind).toBe("image");
  });

  it("has a real stack for every project (08c), no placeholder left", () => {
    for (const p of PROJECTS) {
      expect(Array.isArray(p.stack), p.slug).toBe(true);
      for (const name of p.stack) expect(name, p.slug).not.toMatch(/\[TODO/);
    }
    expect(getProject("cote-royale")?.stack).toContain("GSAP (ScrollTrigger)");
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

describe("the work page copy (08c)", () => {
  for (const [locale, messages, title, shop] of [
    ["fr", fr, "Quelques projets que j'ai développés", /boutique/i],
    ["en", en, "Some projects I've built", /\bshops?\b/i],
  ] as const) {
    it(`${locale}: the heading, a lead without a count or a shop, the GitHub link`, () => {
      const t = createTranslator({ locale, messages, namespace: "work" });
      expect(t("title")).toBe(title);
      expect(t("lead")).not.toMatch(/\d/);
      expect(t("lead")).not.toMatch(shop);
      expect(messages.seo.pages.work.description).not.toMatch(shop);
      expect(t("github")).toMatch(/GitHub/);
    });
  }
});
