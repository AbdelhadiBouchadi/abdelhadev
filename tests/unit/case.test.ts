// The case study's data (prompts/05-case-study.md, "Tests"): caseStudyProjects(), the screen count
// derived from the tour, the case study schema, the next project, the copy every data key needs,
// and the sitemap (the DentaFlow case study listed, the projects without one left out).
import { describe, expect, it } from "vitest";
import en from "@messages/en.json";
import fr from "@messages/fr.json";
import sitemap from "@/app/sitemap";
import { CASE_STUDIES, getCaseStudy } from "@/lib/content/case-studies";
import {
  caseStudyProjects,
  hasMoreScreens,
  nextProject,
  PROJECTS,
  screenCount,
} from "@/lib/content/projects";
import {
  ADAPT_STEPS,
  caseStudies,
  caseStudy,
  TOUR_STEPS,
  type Project,
} from "@/lib/content/schema";

const [dentaflow, hms] = PROJECTS;
if (!dentaflow || !hms) throw new Error("the projects are missing");
const study = getCaseStudy("dentaflow");
if (!study) throw new Error("the DentaFlow case study is missing");

describe("caseStudyProjects", () => {
  it("is DentaFlow alone today", () => {
    expect(caseStudyProjects().map((p) => p.slug)).toEqual(["dentaflow"]);
    expect(Object.keys(CASE_STUDIES)).toEqual(["dentaflow"]);
  });

  it("keeps only public projects with a case study, in order", () => {
    const pending: Project = { ...dentaflow, slug: "hidden", permission: "pending" };
    const other: Project = { ...hms, slug: "other", caseStudy: true };
    expect(caseStudyProjects([pending, hms, other, dentaflow]).map((p) => p.slug)).toEqual([
      "other",
      "dentaflow",
    ]);
  });
});

describe("the screen count", () => {
  it("comes from the tour, so DentaFlow's sheet links to all seven screens", () => {
    expect(study.tour).toHaveLength(7);
    expect(screenCount(dentaflow)).toBe(7);
    expect(hasMoreScreens(dentaflow)).toBe(true);
  });

  it("is the sheet's media without a case study, and then there is nothing more to see", () => {
    expect(screenCount(hms)).toBe(hms.media.length);
    expect(hasMoreScreens(hms)).toBe(false);
  });
});

describe("the case study schema", () => {
  it("ports the DentaFlow tour in the prompt's order and skeletons", () => {
    expect(study.tour.map((s) => `${s.key} ${s.skeleton}`)).toEqual([
      "agenda agenda",
      "patients list",
      "record record",
      "odontogram plan",
      "acts list",
      "documents invoice",
      "statistics chart",
    ]);
    expect(study.adapt).toHaveLength(ADAPT_STEPS);
  });

  it(`takes ${String(TOUR_STEPS.min)} to ${String(TOUR_STEPS.max)} tour steps with unique keys`, () => {
    const step = { key: "a", tone: "plain", skeleton: "agenda" } as const;
    const tour = (n: number) =>
      Array.from({ length: n }, (_, i) => ({ ...step, key: `k${"x".repeat(i)}` }));
    expect(caseStudy.safeParse({ ...study, tour: tour(TOUR_STEPS.min) }).success).toBe(true);
    expect(caseStudy.safeParse({ ...study, tour: tour(TOUR_STEPS.max) }).success).toBe(true);
    expect(caseStudy.safeParse({ ...study, tour: tour(TOUR_STEPS.min - 1) }).success).toBe(false);
    expect(caseStudy.safeParse({ ...study, tour: tour(TOUR_STEPS.max + 1) }).success).toBe(false);
    expect(caseStudy.safeParse({ ...study, tour: [step, step, step] }).success).toBe(false);
  });

  it("takes exactly four adaptation keys and rejects unknown fields and skeletons", () => {
    expect(caseStudy.safeParse({ ...study, adapt: ["a", "b", "c"] }).success).toBe(false);
    expect(caseStudy.safeParse({ ...study, adapt: ["a", "a", "b", "c"] }).success).toBe(false);
    expect(caseStudy.safeParse({ ...study, screens: 12 }).success).toBe(false);
    expect(
      caseStudy.safeParse({ ...study, hero: { tone: "plain", skeleton: "map" } }).success,
    ).toBe(false);
    expect(caseStudies.safeParse({ "Not A Slug": study }).success).toBe(false);
  });
});

describe("nextProject", () => {
  it("is the next public project on the work page, or null after the last one", () => {
    expect(nextProject("dentaflow")?.slug).toBe("hms");
    expect(nextProject("cote-royale")).toBeNull();
    expect(nextProject("nope")).toBeNull();
    const pending: Project = { ...hms, permission: "pending" };
    expect(nextProject("dentaflow", [dentaflow, pending])).toBeNull();
  });
});

describe("the case study copy", () => {
  for (const [locale, messages] of [
    ["fr", fr],
    ["en", en],
  ] as const) {
    it(`${locale}: has a text for every tour step, screen, card and list item`, () => {
      const copy = messages.projects.dentaflow.case;
      const has = (group: object, key: string) => Object.hasOwn(group, key);
      for (const { key } of study.tour) {
        expect(has(copy.tour, key), key).toBe(true);
        expect(has(copy.screens, key), key).toBe(true);
      }
      for (const key of study.adapt) expect(has(copy.adapt, key), key).toBe(true);
      for (const key of study.arch.listKeys) expect(has(copy.arch, key), key).toBe(true);
    });
  }
});

describe("sitemap", () => {
  it("lists every public page and only the case studies that exist, in both locales", () => {
    const urls = sitemap().map((entry) => entry.url.replace("https://abdelhadev.me", ""));
    expect(urls.toSorted()).toEqual(
      [
        "/fr",
        "/en",
        "/fr/projets",
        "/en/work",
        "/fr/projets/dentaflow",
        "/en/work/dentaflow",
        "/fr/a-propos",
        "/en/about",
        "/fr/contact",
        "/en/contact",
        "/fr/mentions-legales",
        "/en/legal-notice",
      ].toSorted(),
    );
    expect(urls.some((url) => url.includes("/hms"))).toBe(false);
    expect(urls.some((url) => url.includes("/lab"))).toBe(false);
  });
});
