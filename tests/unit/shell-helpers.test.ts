import { describe, expect, it } from "vitest";
import { CLOCK_PLACEHOLDER, formatClock } from "@/lib/clock";
import {
  isExternalHref,
  isModifiedClick,
  isSamePath,
  shouldTransition,
  splitHash,
  type ClickLike,
} from "@/lib/links";
import { localizedPath } from "@/lib/paths";
import { applyShellTone, shellToneOf, toneAt, untriggeredToneAt } from "@/lib/tone";

const click = (over: Partial<ClickLike> = {}): ClickLike => ({
  button: 0,
  metaKey: false,
  ctrlKey: false,
  shiftKey: false,
  altKey: false,
  defaultPrevented: false,
  ...over,
});

describe("links", () => {
  it("treats a plain primary click on an internal link as a transition", () => {
    expect(shouldTransition(click(), { href: "/fr/projets" })).toBe(true);
    expect(shouldTransition(click(), { href: "/fr/projets#dentaflow", target: "_self" })).toBe(
      true,
    );
  });

  it("leaves modified and non-primary clicks to the browser", () => {
    for (const over of [
      { metaKey: true },
      { ctrlKey: true },
      { shiftKey: true },
      { altKey: true },
      { button: 1 },
    ]) {
      expect(isModifiedClick(click(over))).toBe(true);
      expect(shouldTransition(click(over), { href: "/fr" })).toBe(false);
    }
  });

  it("leaves new tabs, downloads, prevented clicks and other schemes alone", () => {
    expect(shouldTransition(click(), { href: "/fr", target: "_blank" })).toBe(false);
    expect(shouldTransition(click(), { href: "/cv.pdf", download: true })).toBe(false);
    expect(shouldTransition(click({ defaultPrevented: true }), { href: "/fr" })).toBe(false);
    for (const href of [
      "https://github.com",
      "http://x.ma",
      "mailto:a@b.ma",
      "tel:+212600000000",
      "//cdn.example.com",
    ]) {
      expect(isExternalHref(href), href).toBe(true);
      expect(shouldTransition(click(), { href })).toBe(false);
    }
    expect(isExternalHref("/fr/contact")).toBe(false);
  });

  it("splits hashes and compares paths", () => {
    expect(splitHash("/fr/projets#dentaflow")).toEqual({ path: "/fr/projets", hash: "dentaflow" });
    expect(splitHash("/fr")).toEqual({ path: "/fr", hash: "" });
    expect(isSamePath("/fr/a-propos/", "/fr/a-propos")).toBe(true);
    expect(isSamePath("/fr/%C3%A0", "/fr/à")).toBe(true);
    expect(isSamePath("/fr", "/en")).toBe(false);
    expect(isSamePath("/", "/")).toBe(true);
  });
});

describe("clock", () => {
  it("formats 24-hour Agadir time", () => {
    // 2026-07-01 13:05 UTC is 14:05 in Casablanca (UTC+1).
    expect(formatClock(new Date(Date.UTC(2026, 6, 1, 13, 5)))).toBe("14:05");
    expect(formatClock(new Date(Date.UTC(2026, 0, 1, 23, 59)), "UTC")).toBe("23:59");
    expect(formatClock(new Date(Date.UTC(2026, 0, 1, 0, 7)), "UTC")).toBe("00:07");
  });

  it("falls back to the placeholder on an unknown time zone", () => {
    expect(formatClock(new Date(), "Not/AZone")).toBe(CLOCK_PLACEHOLDER);
  });
});

describe("tone", () => {
  it("maps section tones to shell tones", () => {
    expect(shellToneOf("day")).toBe("day");
    expect(shellToneOf("sheet")).toBe("day");
    expect(shellToneOf("night")).toBe("night");
  });

  const el = (tone: string, top: number, bottom: number) => ({
    dataset: { tone } as Record<string, string | undefined>,
    getBoundingClientRect: () => ({ top, bottom }),
  });
  const root = (items: unknown[]) =>
    ({ querySelectorAll: () => items }) as unknown as Pick<ParentNode, "querySelectorAll">; // test stub

  it("reads the tone under the header line, day when nothing is there", () => {
    const sections = [el("day", -900, 40), el("night", 40, 900), el("sheet", 900, 1800)];
    expect(toneAt(root(sections), 50)).toBe("night");
    expect(toneAt(root(sections), 1000)).toBe("day");
    expect(toneAt(root([]), 50)).toBe("day");
  });

  it("leaving a section, only sections without their own trigger take over (else null)", () => {
    const triggered = (tone: string, top: number, bottom: number) => ({
      ...el(tone, top, bottom),
      querySelector: () => ({}),
    });
    const plain = (tone: string, top: number, bottom: number) => ({
      ...el(tone, top, bottom),
      querySelector: () => null,
    });
    // The home dusk: its top is under the line but it takes over at its centre, by its trigger.
    expect(untriggeredToneAt(root([plain("day", -900, 40), triggered("night", 40, 900)]), 50)).toBe(
      null,
    );
    // A section without a trigger (a plain data-tone section) still gives the tone.
    expect(untriggeredToneAt(root([triggered("day", -900, 40), plain("night", 40, 900)]), 50)).toBe(
      "night",
    );
    expect(untriggeredToneAt(root([]), 50)).toBe(null);
  });

  it("sets data-tone on every shell element", () => {
    const shell = [{ dataset: { tone: "day" } }, { dataset: {} }] as {
      dataset: Record<string, string>;
    }[];
    applyShellTone(root(shell), "night");
    expect(shell.map((s) => s.dataset.tone)).toEqual(["night", "night"]);
  });
});

describe("localised paths", () => {
  it("matches the routing table, params included", () => {
    expect(localizedPath("fr", "/")).toBe("/fr");
    expect(localizedPath("en", "/")).toBe("/en");
    expect(localizedPath("fr", "/work")).toBe("/fr/projets");
    expect(localizedPath("en", "/legal")).toBe("/en/legal-notice");
    expect(localizedPath("fr", "/contact")).toBe("/fr/contact");
    expect(localizedPath("fr", { pathname: "/work/[slug]", params: { slug: "dentaflow" } })).toBe(
      "/fr/projets/dentaflow",
    );
  });
});
