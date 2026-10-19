// The pure logic behind the motion primitives, and the CSS start states that mirror lib/motion.ts.
import { readFileSync } from "node:fs";
import { describe, expect, it, vi } from "vitest";
import {
  CHARS_PACE,
  DURATION,
  MEDIA,
  MEDIA_REVEAL,
  REVEAL,
  SCRUB,
  SPY,
  STAGGER,
} from "@/lib/motion";
import { createScheduler } from "@/lib/schedule";
import {
  insetClip,
  lineRange,
  resolveTrigger,
  SPY_START,
  spyReduce,
  stageCondition,
  type SpyState,
  type TriggerSource,
} from "@/lib/scroll";

const css = (file: string) =>
  readFileSync(new URL(`../../src/styles/${file}`, import.meta.url), "utf8");

describe("lineRange", () => {
  it("turns an activation line into the range during which an element crosses it", () => {
    expect(lineRange(SPY.list)).toEqual({ start: "top 45%", end: "bottom 45%" });
    expect(lineRange(SPY.tour)).toEqual({ start: "top 55%", end: "bottom 55%" });
    expect(lineRange(0)).toEqual({ start: "top 0%", end: "bottom 0%" });
    expect(lineRange(0.333)).toEqual({ start: "top 33.3%", end: "bottom 33.3%" });
  });

  it("rejects a line outside the viewport", () => {
    expect(() => lineRange(1.2)).toThrow(RangeError);
    expect(() => lineRange(-0.1)).toThrow(RangeError);
    expect(() => lineRange(Number.NaN)).toThrow(RangeError);
  });
});

describe("stageCondition", () => {
  it("picks the matched condition, reduced motion first", () => {
    expect(stageCondition({ desktop: true, mobile: false, reduced: false })).toBe("desktop");
    expect(stageCondition({ desktop: false, mobile: true, reduced: false })).toBe("mobile");
    expect(stageCondition({ desktop: false, mobile: false, reduced: true })).toBe("reduced");
  });

  it("falls back to the still state when nothing matched", () => {
    expect(stageCondition({})).toBe("reduced");
  });
});

describe("spyReduce", () => {
  const run = (events: [number, boolean][], from: SpyState = SPY_START) =>
    events.reduce((state, [index, active]) => spyReduce(state, index, active), from);

  it("starts with nothing active", () => {
    expect(SPY_START.active).toBe(-1);
  });

  it("follows elements scrolling down one after the other", () => {
    expect(run([[0, true]]).active).toBe(0);
    expect(
      run([
        [0, true],
        [0, false],
        [1, true],
      ]).active,
    ).toBe(1);
  });

  it("keeps the last active element in a gap between elements", () => {
    expect(
      run([
        [0, true],
        [0, false],
      ]).active,
    ).toBe(0);
  });

  it("with overlapping elements, the latest to cross wins and the previous takes over after it", () => {
    const both = run([
      [0, true],
      [1, true],
    ]);
    expect(both.active).toBe(1);
    expect(both.crossing).toEqual([0, 1]);
    expect(spyReduce(both, 1, false).active).toBe(0);
  });

  it("follows elements scrolling back up", () => {
    expect(
      run([
        [2, true],
        [2, false],
        [1, true],
      ]).active,
    ).toBe(1);
  });

  it("does not duplicate an element that toggles on twice", () => {
    expect(
      run([
        [0, true],
        [0, true],
      ]).crossing,
    ).toEqual([0]);
  });
});

describe("insetClip", () => {
  it("writes the inset shape MediaReveal tweens", () => {
    expect(insetClip([18, 6, 0, 6], "18px")).toBe("inset(18% 6% 0% 6% round 18px)");
    expect(insetClip([0, 0, 0, 0], "26px")).toBe("inset(0% 0% 0% 0% round 26px)");
    // Start and end have the same shape, so GSAP interpolates every number.
    const numbers = (s: string) => s.match(/[\d.]+/g)?.length;
    expect(numbers(insetClip(MEDIA_REVEAL.scrub.inset, "18px"))).toBe(
      numbers(insetClip([0, 0, 0, 0], "18px")),
    );
  });
});

describe("resolveTrigger", () => {
  const section = { id: "section" };
  const elsewhere = { id: "elsewhere" };
  function source(closest: object | null): TriggerSource & { closestCalls: string[] } {
    const closestCalls: string[] = [];
    return {
      closestCalls,
      closest: (selector) => {
        closestCalls.push(selector);
        // Stand-ins for elements: resolveTrigger only passes them through.
        return closest as Element | null;
      },
      // The same kind of stand-in, for the document-wide match.
      ownerDocument: { querySelector: () => elsewhere as Element },
    };
  }

  it("is the element itself without a selector", () => {
    const el = source(section);
    expect(resolveTrigger(el)).toBe(el);
    expect(el.closestCalls).toEqual([]);
  });

  it("prefers the nearest matching ancestor, then the first match on the page", () => {
    expect(resolveTrigger(source(section), "[data-stage]")).toBe(section);
    expect(resolveTrigger(source(null), "#hero")).toBe(elsewhere);
  });
});

describe("createScheduler", () => {
  it("runs every task queued in the same commit together, once, in a later task", () => {
    const pending: (() => void)[] = [];
    const scheduler = createScheduler((run) => pending.push(run));
    const a = vi.fn();
    const b = vi.fn();
    scheduler.afterCommit(a);
    scheduler.afterCommit(b);
    expect(a).not.toHaveBeenCalled();
    expect(pending).toHaveLength(1);
    pending[0]?.();
    expect(a).toHaveBeenCalledTimes(1);
    expect(b).toHaveBeenCalledTimes(1);
  });

  it("never runs a cancelled task (unmount, StrictMode's simulated unmount)", () => {
    const pending: (() => void)[] = [];
    const scheduler = createScheduler((run) => pending.push(run));
    const first = vi.fn();
    const second = vi.fn();
    const cancel = scheduler.afterCommit(first);
    cancel();
    scheduler.afterCommit(second);
    pending[0]?.();
    expect(first).not.toHaveBeenCalled();
    expect(second).toHaveBeenCalledTimes(1);
  });

  it("schedules a new flush for tasks queued after one has run", () => {
    const pending: (() => void)[] = [];
    const scheduler = createScheduler((run) => pending.push(run));
    scheduler.afterCommit(vi.fn());
    pending[0]?.();
    const later = vi.fn();
    scheduler.afterCommit(later);
    expect(pending).toHaveLength(2);
    pending[1]?.();
    expect(later).toHaveBeenCalledTimes(1);
  });

  it("runs the same function queued twice twice, and cancels only its own entry", () => {
    const scheduler = createScheduler(() => undefined);
    const task = vi.fn();
    const cancel = scheduler.afterCommit(task);
    scheduler.afterCommit(task);
    cancel();
    scheduler.flush();
    expect(task).toHaveBeenCalledTimes(1);
  });
});

describe("the primitives keep the documented values", () => {
  it("text reveals (prototype linesUp, wordsLight, Pages.home, Pages.case)", () => {
    expect(REVEAL).toMatchObject({
      linesYPercent: 110,
      charsYPercent: 115,
      fadeY: 28,
      wordsFrom: 0.14,
      enterStart: "top 85%",
    });
    expect(DURATION.lines).toBe(1.2);
    expect(STAGGER.lines).toBe(0.08);
    expect(STAGGER.words).toBe(0.1);
    expect(CHARS_PACE.hero).toEqual({ duration: 1.35, stagger: 0.045 });
    expect(CHARS_PACE.case).toEqual({ duration: 1.3, stagger: 0.05 });
    expect(SCRUB).toBe(0.8);
  });

  it("media reveal (prototype revealMedia and the case study hero shot)", () => {
    expect(MEDIA_REVEAL.scrub).toMatchObject({
      inset: [18, 6, 0, 6],
      scale: 1.16,
      start: "top 95%",
      end: "top 45%",
    });
    expect(MEDIA_REVEAL.intro).toMatchObject({ inset: [30, 8, 0, 8], scale: 1.2 });
    expect([DURATION.shotClip, DURATION.shotScale]).toEqual([1.6, 1.8]);
  });
});

describe("primitives.css mirrors lib/motion.ts", () => {
  const primitives = css("primitives.css");
  const tokens = css("tokens.css");

  for (const variant of ["scrub", "intro"] as const) {
    it(`the ${variant} media start state`, () => {
      const spec = MEDIA_REVEAL[variant];
      const clip = insetClip(spec.inset, `var(--r-${spec.radius})`);
      expect(primitives).toContain(`[data-media-reveal="${variant}"] {\n    clip-path: ${clip};`);
      expect(primitives).toContain(
        `[data-media-reveal="${variant}"] [data-media-inner] {\n    transform: scale(${String(spec.scale)});`,
      );
      expect(tokens).toMatch(new RegExp(`--r-${spec.radius}:\\s*\\d+px;`));
    });
  }

  it("the stage's mobile breakpoint", () => {
    const width = /\(max-width: (\d+)px\)/.exec(MEDIA.mobile)?.[1];
    expect(width).toBeDefined();
    expect(primitives).toContain(`@media (max-width: ${String(width)}px)`);
    expect(MEDIA.desktop).toBe(`(min-width: ${String(Number(width) + 1)}px)`);
  });

  it("every start state is gated by html.motion", () => {
    const selectors = primitives
      .replace(/\/\*[\s\S]*?\*\//g, "")
      .match(/^\s*[^@{}\s][^{}]*\{/gm)
      ?.map((s) => s.trim());
    expect(selectors?.length).toBeGreaterThan(0);
    for (const selector of selectors ?? []) {
      for (const part of selector.replace("{", "").split(",")) {
        expect(part.trim(), selector).toMatch(/^html\.motion /);
      }
    }
  });
});
