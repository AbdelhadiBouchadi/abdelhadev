// No field for a person's name, only confirmed testimonials are public, the placeholder report
// ignores the others, and the section renders nothing without items.
import { spawnSync } from "node:child_process";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import en from "@messages/en.json";
import fr from "@messages/fr.json";
import { Testimonials } from "@/components/sections/home/Testimonials";
import {
  publicTestimonials,
  TESTIMONIALS,
  testimonial,
  todoReport,
  type Testimonial,
} from "@/lib/content/testimonials";
import { QUOTES } from "@/lib/motion";
import { quoteTiming, type QuoteTiming } from "@/lib/quotes";

const fixture = (id: Testimonial["id"], confirmed: boolean): Testimonial => ({
  id,
  role: `testimonials.${id}.role`,
  organisation: `testimonials.${id}.organisation`,
  text: `testimonials.${id}.text`,
  confirmed,
});

describe("testimonials data", () => {
  it("has no field for a person's name and refuses one", () => {
    expect(Object.keys(testimonial.shape).sort()).toEqual(
      ["confirmed", "id", "organisation", "role", "text"].sort(),
    );
    expect(testimonial.safeParse({ ...fixture("festival", true), name: "x" }).success).toBe(false);
  });

  it("points every text at its own message key, present in both locales", () => {
    expect(testimonial.safeParse({ ...fixture("festival", true), text: "hello" }).success).toBe(
      false,
    );
    for (const { id } of TESTIMONIALS) {
      for (const messages of [fr, en]) {
        expect(Object.keys(messages.testimonials[id]).sort()).toEqual(
          ["organisation", "role", "text"].sort(),
        );
      }
    }
  });

  it("ships the three supplied testimonials in order, all confirmed", () => {
    expect(TESTIMONIALS.map((t) => [t.id, t.confirmed])).toEqual([
      ["festival", true],
      ["ophtachusm", true],
      ["sos-dental", true],
    ]);
    expect(publicTestimonials().map((t) => t.id)).toEqual(["festival", "ophtachusm", "sos-dental"]);
  });

  it("returns only the confirmed entries", () => {
    const list = [fixture("sos-dental", true), fixture("festival", false)];
    expect(publicTestimonials(list).map((t) => t.id)).toEqual(["sos-dental"]);
  });
});

describe("testimonials placeholders", () => {
  it("lists nothing for the shipped testimonials", () => {
    expect(todoReport({ fr, en })).toEqual([]);
  });

  it("ignores unconfirmed testimonials and lists a placeholder inside a confirmed one", () => {
    const todo = {
      testimonials: {
        "sos-dental": { role: "[TODO: role]", organisation: "O", text: "[TODO: text]" },
        festival: { role: "[TODO: role]", organisation: "O", text: "[TODO: text]" },
      },
    };
    const report = todoReport({ en: todo }, [
      fixture("sos-dental", true),
      fixture("festival", false),
    ]);
    expect(report).toEqual([
      "testimonials.sos-dental.role (en): [TODO: role]",
      "testimonials.sos-dental.text (en): [TODO: text]",
    ]);
  });

  it("keeps the build report free of testimonials", () => {
    const run = spawnSync(process.execPath, ["scripts/report-todos.mjs"], { encoding: "utf8" });
    expect(run.status).toBe(0);
    expect(run.stderr).toContain("Content placeholders");
    expect(run.stderr).not.toContain("testimonials");
  });
});

describe("Testimonials section", () => {
  it("renders nothing at all without items", () => {
    expect(renderToStaticMarkup(createElement(Testimonials, { title: "T", items: [] }))).toBe("");
  });

  it("renders a figure with the quote split into words, the role and the organisation", () => {
    const html = renderToStaticMarkup(
      createElement(Testimonials, {
        title: "What clients say",
        items: [
          {
            id: "sos-dental",
            role: "Practice manager",
            organisation: "SOS Dental Clinic, Agadir",
            text: "Truly\u00a0great work.",
          },
        ],
      }),
    );
    expect(html).toContain('id="testimonials"');
    expect(html).toContain('data-tone="night"');
    expect(html).toMatch(
      /<figure class="q" data-testimonial="sos-dental" style="--a:14%;--s:0.16%"><span class="q-mark" aria-hidden="true">“<\/span><blockquote><p><span class="w" style="--w:0"><span>Truly\u00a0great<\/span><\/span> <span class="w" style="--w:1"><span>work\.<\/span><\/span><\/p><\/blockquote><figcaption><span class="q-no" aria-hidden="true">01 \/ 01<\/span><span class="q-role">Practice manager<\/span><span class="q-org">SOS Dental Clinic, Agadir<\/span><\/figcaption><\/figure>/,
    );
    expect(html.match(/<figure/g)).toHaveLength(1);
  });

  it("fades every quote but the last", () => {
    const items = ["festival", "ophtachusm", "sos-dental"].map((id) => ({
      id,
      role: "R",
      organisation: "O",
      text: "A b c.",
    }));
    const html = renderToStaticMarkup(createElement(Testimonials, { title: "T", items }));
    expect(html.match(/class="q q-fade"/g)).toHaveLength(2);
    expect(html.match(/--o:/g)).toHaveLength(2);
    expect(html).toContain("03 / 03");
  });
});

describe("quote timing", () => {
  const done = ({ start, stagger }: QuoteTiming, words: number) =>
    start + (words - 1) * stagger + QUOTES.word;

  it("keeps the prototype's stagger when the quote is short enough", () => {
    expect(quoteTiming(0, 3, 48)).toEqual({ start: 14, fade: 32, stagger: 0.16 });
    expect(quoteTiming(2, 3, 44)).toEqual({ start: 58, fade: null, stagger: 0.16 });
  });

  it("tightens the stagger so the last word lands before the hold", () => {
    const t = quoteTiming(1, 3, 61);
    expect(t.stagger).toBeLessThan(0.16);
    expect(done(t, 61)).toBeLessThanOrEqual(52 - QUOTES.hold);
  });

  it("lands every shipped quote in time, in both locales", () => {
    for (const messages of [fr, en]) {
      const ids = publicTestimonials().map((t) => t.id);
      for (const [i, id] of ids.entries()) {
        const words = messages.testimonials[id].text.trim().split(/ +/).length;
        const t = quoteTiming(i, ids.length, words);
        expect(done(t, words)).toBeLessThanOrEqual((t.fade ?? QUOTES.end) - QUOTES.hold);
      }
    }
  });

  it("never fades the last quote, even when fewer than three are confirmed", () => {
    expect(quoteTiming(1, 2, 10).fade).toBeNull();
    expect(quoteTiming(0, 1, 10).fade).toBeNull();
  });
});
