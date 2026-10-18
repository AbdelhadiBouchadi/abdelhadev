// The about page's facts and gates (prompts/06-about.md, "Tests"): the channels in site.ts, the
// CV placeholder gate (cv.ts and the build report), the words that must appear nowhere in the
// copy, the placeholder PDFs, the data's order and the CSS start state of the arcs.
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import en from "@messages/en.json";
import fr from "@messages/fr.json";
import { flatten } from "@scripts/lib/i18n-rules.mjs";
import { placeholderPdf } from "@scripts/make-placeholder-cv.mjs";
import { EXPERIENCE, SERVICES } from "@/lib/content/about";
import { CV, todoReport } from "@/lib/content/cv";
import { ABOUT } from "@/lib/motion";
import { SITE } from "@/lib/site";

describe("site channels", () => {
  it("links LinkedIn and GitHub over https", () => {
    for (const url of [SITE.linkedin, SITE.github]) {
      expect(new URL(url).protocol).toBe("https:");
    }
    expect(SITE.linkedin).toBe("https://www.linkedin.com/in/abdelhadi-bouchadi-904b5b359/");
    expect(SITE.github).toBe("https://github.com/AbdelhadiBouchadi");
  });

  it("writes WhatsApp in E.164 and builds the wa.me link from it", () => {
    expect(SITE.whatsapp.e164).toMatch(/^\+[1-9]\d{7,14}$/);
    expect(SITE.whatsapp.href).toBe("https://wa.me/212637025032");
    expect(SITE.whatsapp.display.replaceAll(" ", "")).toBe(SITE.whatsapp.e164);
  });

  it("has no email key: the public email stays unset until the owner has a mailbox", () => {
    expect(Object.keys(SITE).some((key) => /mail/i.test(key))).toBe(false);
    expect(JSON.stringify(SITE)).not.toMatch(/@gmail\./i);
  });
});

describe("CV gate", () => {
  it("lists every placeholder CV and nothing once both are final", () => {
    expect(todoReport()).toEqual(["cv.fr: placeholder", "cv.en: placeholder"]);
    const final = { href: "/cv/x.pdf", status: "final" } as const;
    expect(todoReport({ fr: final, en: final })).toEqual([]);
    expect(todoReport({ fr: final, en: { ...final, status: "placeholder" } })).toEqual([
      "cv.en: placeholder",
    ]);
  });

  it("links one PDF per locale under /cv/", () => {
    expect(CV.fr.href).toBe("/cv/abdelhadi-bouchadi-cv-fr.pdf");
    expect(CV.en.href).toBe("/cv/abdelhadi-bouchadi-cv-en.pdf");
  });

  it("fails the build report with REQUIRE_CONTENT=1 while a CV is a placeholder", () => {
    const run = spawnSync(process.execPath, ["scripts/report-todos.mjs"], {
      env: { ...process.env, REQUIRE_CONTENT: "1" },
      encoding: "utf8",
    });
    expect(run.status).toBe(1);
    expect(run.stderr).toContain("cv.fr: placeholder");
    expect(run.stderr).toContain("cv.en: placeholder");
  });
});

describe("placeholder PDF", () => {
  const pdf = placeholderPdf("CV placeholder, to be replaced").toString("latin1");

  it("is a one-page PDF reading the placeholder line", () => {
    expect(pdf.startsWith("%PDF-1.4\n")).toBe(true);
    expect(pdf.trimEnd().endsWith("%%EOF")).toBe(true);
    expect(pdf).toContain("/Count 1");
    expect(pdf).toContain("(CV placeholder, to be replaced) Tj");
  });

  it("has a cross-reference table that points at each object", () => {
    const startxref = Number(/startxref\n(\d+)/.exec(pdf)?.[1]);
    expect(pdf.slice(startxref).startsWith("xref\n")).toBe(true);
    const offsets = [...pdf.slice(startxref).matchAll(/^(\d{10}) 00000 n $/gm)].map((m) =>
      Number(m[1]),
    );
    expect(offsets).toHaveLength(5);
    offsets.forEach((offset, i) => {
      expect(pdf.slice(offset).startsWith(`${String(i + 1)} 0 obj`)).toBe(true);
    });
  });

  it("matches the files in public/cv", () => {
    for (const locale of ["fr", "en"]) {
      const file = readFileSync(`public/cv/abdelhadi-bouchadi-cv-${locale}.pdf`, "latin1");
      expect(file).toBe(pdf);
    }
  });
});

describe("copy", () => {
  // Decision P3: no university, no year of study, no degree title until the owner confirms.
  const BANNED = [
    /karabuk/i,
    /third[- ]year/i,
    /troisième année/i,
    /bachelor/i,
    /étudiant/i,
    /\bstudent/i,
    /ingénieur/i,
    /\bengineers?\b/i,
  ];

  it("never names the university, a year of study or a degree title", () => {
    for (const [locale, messages] of [
      ["fr", fr],
      ["en", en],
    ] as const) {
      for (const [key, value] of flatten(messages)) {
        for (const word of BANNED) expect(value, `${locale}: ${key}`).not.toMatch(word);
      }
    }
  });

  it("has a title and a line for each service, in the owner's order", () => {
    expect(SERVICES).toEqual(["clinics", "ai", "shops", "websites", "other"]);
    for (const messages of [fr, en]) {
      expect(Object.keys(messages.about.services.items)).toEqual([...SERVICES]);
    }
  });

  it("gives the education entry no line of detail", () => {
    for (const { key, detail } of EXPERIENCE) {
      for (const messages of [fr, en]) {
        expect(Object.hasOwn(messages.about.experience.items[key], "text"), key).toBe(detail);
      }
    }
  });
});

describe("arcs start state", () => {
  it("mirrors ABOUT.dawn.arcsFrom in about.css", () => {
    const css = readFileSync("src/styles/about.css", "utf8");
    const { yPercent, scale } = ABOUT.dawn.arcsFrom;
    expect(css).toContain(
      `html.motion .arc {\n    opacity: 0;\n    transform: translateY(${String(yPercent)}%) scale(${String(scale)});`,
    );
  });
});
