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

  it("ships both entries unconfirmed, so none is public", () => {
    expect(TESTIMONIALS.map((t) => [t.id, t.confirmed])).toEqual([
      ["sos-dental", false],
      ["festival", false],
    ]);
    expect(publicTestimonials()).toEqual([]);
  });

  it("returns only the confirmed entries", () => {
    const list = [fixture("sos-dental", true), fixture("festival", false)];
    expect(publicTestimonials(list).map((t) => t.id)).toEqual(["sos-dental"]);
  });
});

describe("testimonials placeholders", () => {
  it("ignores unconfirmed testimonials and lists a placeholder inside a confirmed one", () => {
    expect(todoReport({ fr, en })).toEqual([]);
    const report = todoReport({ fr, en }, [
      fixture("sos-dental", true),
      fixture("festival", false),
    ]);
    expect(report).toContain("testimonials.sos-dental.role (fr): [TODO: role]");
    expect(report).toContain("testimonials.sos-dental.text (en): [TODO: testimonial text]");
    expect(report.some((line) => line.startsWith("testimonials.festival."))).toBe(false);
    // The organisation is real text: not listed.
    expect(report.some((line) => line.includes(".organisation"))).toBe(false);
  });

  it("is quiet once a confirmed testimonial has real text", () => {
    const real = {
      testimonials: { "sos-dental": { role: "R", organisation: "O", text: "Real words." } },
    };
    expect(todoReport({ fr: real }, [fixture("sos-dental", true)])).toEqual([]);
  });

  it("keeps the build report free of unconfirmed testimonials", () => {
    const run = spawnSync(process.execPath, ["scripts/report-todos.mjs"], { encoding: "utf8" });
    expect(run.status).toBe(0);
    expect(run.stderr).toContain("Content placeholders");
    expect(run.stderr).not.toMatch(/testimonial text|texte du témoignage|\[TODO: role\]/);
  });
});

describe("Testimonials section", () => {
  it("renders nothing at all without items", () => {
    expect(renderToStaticMarkup(createElement(Testimonials, { title: "T", items: [] }))).toBe("");
  });

  it("renders a figure with the quote, the role and the organisation", () => {
    const html = renderToStaticMarkup(
      createElement(Testimonials, {
        title: "What clients say",
        items: [
          {
            id: "sos-dental",
            role: "Practice manager",
            organisation: "SOS Dental Clinic, Agadir",
            text: "Quote.",
          },
        ],
      }),
    );
    expect(html).toContain('id="testimonials"');
    expect(html).toContain('data-tone="night"');
    expect(html).toMatch(
      /<figure[^>]*><blockquote><p>Quote\.<\/p><\/blockquote><figcaption><span>Practice manager<\/span><span>SOS Dental Clinic, Agadir<\/span><\/figcaption><\/figure>/,
    );
    expect(html.match(/<figure/g)).toHaveLength(1);
  });
});
