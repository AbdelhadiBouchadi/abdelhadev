// The about page's facts: the channels in site.ts, the CV placeholder gate, the banned words,
// the placeholder PDFs, the data's order and the CSS start state of the dawn glow.
import { spawnSync } from "node:child_process";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import en from "@messages/en.json";
import fr from "@messages/fr.json";
import { flatten } from "@scripts/lib/i18n-rules.mjs";
import { placeholderPdf } from "@scripts/make-placeholder-cv.mjs";
import { EXPERIENCE, SERVICES } from "@/lib/content/about";
import { CV, CV_ACTION, todoReport } from "@/lib/content/cv";
import { cvBytes, formatFileSize } from "@/lib/content/cv-file";
import { ABOUT } from "@/lib/motion";
import { SITE } from "@/lib/site";
import { resizeKind } from "@/lib/thread";

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

  it("has the public email and no other email-like string", () => {
    expect(SITE.email).toBe("contact@abdelhadev.me");
    const source = readFileSync("src/lib/site.ts", "utf8");
    expect(source.match(/[\w.+-]+@[\w-]+(?:\.[\w-]+)+/g)).toEqual(["contact@abdelhadev.me"]);
  });

  it("never holds the private inbox: no file in src, messages, docs or public names gmail.com", () => {
    const hits = ["src", "messages", "docs", "public"]
      .flatMap((dir) => readdirSync(dir, { recursive: true, withFileTypes: true }))
      .filter((entry) => entry.isFile())
      .map((entry) => join(entry.parentPath, entry.name))
      .filter((file) => /gmail\.com/i.test(readFileSync(file, "latin1")));
    expect(hits).toEqual([]);
  });
});

describe("CV gate", () => {
  it("lists every placeholder CV and nothing once both are final", () => {
    expect(todoReport()).toEqual(["cv.fr: placeholder", "cv.en: placeholder", CV_ACTION]);
    const final = { href: "/cv/x.pdf", filename: "x.pdf", status: "final" } as const;
    expect(todoReport({ fr: final, en: final })).toEqual([]);
    expect(todoReport({ fr: final, en: { ...final, status: "placeholder" } })).toEqual([
      "cv.en: placeholder",
      CV_ACTION,
    ]);
    expect(CV_ACTION).toContain("public/cv/");
  });

  it("links one PDF per locale under /cv/, saved under a clean name", () => {
    expect(CV.fr.href).toBe("/cv/abdelhadi-bouchadi-cv-fr.pdf");
    expect(CV.en.href).toBe("/cv/abdelhadi-bouchadi-cv-en.pdf");
    for (const file of Object.values(CV)) expect(file.filename).toMatch(/^[A-Za-z-]+\.pdf$/);
  });

  it("ships a real PDF for each locale: it starts with %PDF and is under 2 MB", () => {
    for (const locale of ["fr", "en"] as const) {
      const file = readFileSync(join("public", CV[locale].href));
      expect(file.subarray(0, 4).toString("latin1"), locale).toBe("%PDF");
      expect(file.byteLength, locale).toBeLessThan(2 * 1024 * 1024);
      expect(cvBytes(locale)).toBe(file.byteLength);
    }
  });

  it("shows the size as people read it in each language", () => {
    expect(formatFileSize(600, "fr")).toMatch(/^1\s?ko$/);
    expect(formatFileSize(24_000, "en")).toBe("23 kB");
    expect(formatFileSize(1_300_000, "fr")).toMatch(/^1,2\s?Mo$/);
    expect(formatFileSize(1_300_000, "en")).toBe("1.2 MB");
  });

  it("fails the build report with REQUIRE_CONTENT=1 while a CV is a placeholder", () => {
    const run = spawnSync(process.execPath, ["scripts/report-todos.mjs"], {
      env: { ...process.env, REQUIRE_CONTENT: "1" },
      encoding: "utf8",
    });
    expect(run.status).toBe(1);
    expect(run.stderr).toContain("cv.fr: placeholder");
    expect(run.stderr).toContain("cv.en: placeholder");
    expect(run.stderr).toContain(CV_ACTION);
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
  // No university, no graduation year, never "engineer", "student" or "étudiant".
  // A B.Eng is neither a French "licence" nor a "diplôme d'ingénieur" (docs/french-style.md).
  const BANNED = [
    /karabuk/i,
    /third[- ]year/i,
    /troisième année/i,
    /étudiant/i,
    /\bstudent/i,
    /ingénieur/i,
    /\bengineers?\b/i,
    /\blicence\b/i,
  ];

  // The degree is stated only in the education entry of the timeline.
  const DEGREE = [/B\.Eng/, /bachelor/i];
  const EDUCATION = "about.experience.items.education.";
  // There "licence" is the avatars' CC BY 4.0 licence, not a degree.
  const CREDITS = "pages.legal.credits.";

  it("never names the university, a year of study or a degree title", () => {
    for (const [locale, messages] of [
      ["fr", fr],
      ["en", en],
    ] as const) {
      for (const [key, value] of flatten(messages)) {
        for (const word of BANNED) {
          if (key.startsWith(CREDITS) && word.source.includes("licence")) continue;
          expect(value, `${locale}: ${key}`).not.toMatch(word);
        }
        if (key.startsWith(EDUCATION)) continue;
        for (const word of DEGREE) expect(value, `${locale}: ${key}`).not.toMatch(word);
      }
    }
  });

  it("states the degree in the education entry only, as I wrote it", () => {
    expect(fr.about.experience.items.education.title).toBe("Génie informatique");
    expect(fr.about.experience.items.education.when).toBe(
      "Dernière année de Bachelor of Engineering (B.Eng)",
    );
    expect(fr.about.experience.items.education.where).toBe("Formation");
    expect(en.about.experience.items.education.when).toBe("Final year of a B.Eng");
  });

  it("has a title and a line for each service, in my order", () => {
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

describe("dawn start state", () => {
  it("mirrors ABOUT.dawn.glowFrom in about.css", () => {
    const css = readFileSync("src/styles/about.css", "utf8");
    expect(css).toContain(
      `html.motion .dawn-glow {\n    opacity: 0;\n    transform: scaleY(${String(ABOUT.dawn.glowFrom.scaleY)});`,
    );
  });
});

describe("thread resize", () => {
  const built = { width: 390, height: 9000, viewWidth: 390, viewHeight: 844 };

  it("keeps the route for changes under 2 px wide and 4 px tall", () => {
    expect(resizeKind(built, { ...built, width: 391, height: 9003 }, false)).toBe("same");
    expect(resizeKind(built, { ...built, width: 392 }, false)).toBe("rebuild");
    expect(resizeKind(built, { ...built, height: 9004 }, false)).toBe("rebuild");
  });

  it("takes a height-only change of the window on a touch device as the address bar", () => {
    const bar = { ...built, height: 9168, viewHeight: 788 };
    expect(resizeKind(built, bar, true)).toBe("viewport");
    expect(resizeKind(built, bar, false)).toBe("rebuild");
    expect(resizeKind(built, { ...built, height: 9100 }, true)).toBe("rebuild");
    expect(resizeKind(built, { ...bar, width: 360, viewWidth: 360 }, true)).toBe("rebuild");
  });
});
