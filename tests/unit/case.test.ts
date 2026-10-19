// The case study's data: caseStudyProjects(), the screen count from the media manifest, the
// schema, the next project, the copy every data key needs, and the sitemap.
import { describe, expect, it } from "vitest";
import en from "@messages/en.json";
import fr from "@messages/fr.json";
import sitemap from "@/app/sitemap";
import { CASE_STUDIES, getCaseStudy } from "@/lib/content/case-studies";
import {
  caseStudyProjects,
  getProject,
  hasMoreScreens,
  nextProject,
  screenCount,
  sheetMedia,
} from "@/lib/content/projects";
import {
  ADAPT_STEPS,
  caseStudies,
  caseStudy,
  TOUR_STEPS,
  type Project,
} from "@/lib/content/schema";

import { tourMedia } from "@/lib/media";

const dentaflow = getProject("dentaflow");
const hms = getProject("hms");
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
  it("counts the tour's real screens, so DentaFlow's sheet links to the case study", () => {
    expect(study.tour).toHaveLength(7);
    expect(screenCount(dentaflow)).toBe(tourMedia("dentaflow").size);
    expect(screenCount(dentaflow)).toBeGreaterThan(sheetMedia(dentaflow).length);
    expect(hasMoreScreens(dentaflow)).toBe(true);
  });

  it("is the sheet's real screens without a case study, and then there is nothing more", () => {
    expect(screenCount(hms)).toBe(sheetMedia(hms).length);
    expect(sheetMedia(hms).length).toBeLessThanOrEqual(hms.media.length);
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
    // The work order: DentaFlow, MeetAI, Ophtachusm, then Côte Royale.
    expect(nextProject("dentaflow")?.slug).toBe("meetai");
    expect(nextProject("meetai")?.slug).toBe("hms");
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
    it(`${locale}: has a text for every tour step, card and list item, and the hero screen`, () => {
      const copy = messages.projects.dentaflow.case;
      const has = (group: object, key: string) => Object.hasOwn(group, key);
      for (const { key } of study.tour) {
        expect(has(copy.tour, key), key).toBe(true);
      }
      // The tour screens' alt texts come from the media map's keys (tests/unit/media.test.ts).
      expect(has(copy.screens, "hero")).toBe(true);
      for (const key of study.adapt) expect(has(copy.adapt, key), key).toBe(true);
      for (const key of study.arch.listKeys) expect(has(copy.arch, key), key).toBe(true);
    });
  }
});

describe("sitemap", () => {
  // The legal notice is noindex, so it is not listed.
  it("lists every indexable page and only the case studies that exist, in both locales", () => {
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
      ].toSorted(),
    );
    expect(urls.some((url) => url.includes("/hms"))).toBe(false);
    expect(urls.some((url) => url.includes("/lab"))).toBe(false);
  });
});
