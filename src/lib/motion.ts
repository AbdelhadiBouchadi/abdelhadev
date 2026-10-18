/* The motion system: the only place easing and duration values exist in TypeScript.
   Values: docs/choreography.md and docs/prototype/assets/site.js. Where a value also exists as a
   CSS custom property in src/styles/tokens.css, tests/unit/motion.test.ts asserts they match. */

/** Control points of the house ease, shared by CustomEase and CSS `--ease-warm`. */
export const WARM_CURVE = [0.625, 0.05, 0, 1] as const;

export const EASE = {
  /** CustomEase registered in src/lib/gsap.ts. */
  warm: "warm",
  /** Loader progress tween. */
  progress: "power2.out",
  /** The sun setting behind the curtain. */
  sunset: "power2.in",
  /** Loader letters and mark lifting out. */
  liftOut: "power3.in",
  /** Scrubbed timelines map scroll linearly. */
  none: "none",
} as const;

/** Seconds, as GSAP expects them. */
export const DURATION = {
  /** Mirrors --dur-fade: the cursor and its label fading. */
  fade: 0.3,
  /** Mirrors --dur-quick: skip link, fields, nav pill items. */
  quick: 0.4,
  /** Mirrors --dur-cursor: cursor label morph. */
  cursor: 0.45,
  /** Mirrors --dur-hover: button colours, rail items. */
  hover: 0.5,
  /** Mirrors --dur-base: the GSAP default, hovers, tone changes. */
  base: 0.6,
  /** Mirrors --dur-header: header hide and show. */
  header: 0.7,
  /** Case study tour screen crossfade. */
  crossfade: 0.7,
  /** Case study tour: a step dimming or returning to full strength. */
  stepDim: 0.5,
  /** Loader: one wordmark letter rising. */
  letter: 0.7,
  /** Loader: progress tween toward the settled weight. */
  progress: 0.8,
  /** Loader: final push to 100 %. */
  progressEnd: 0.45,
  /** Loader: horizon and reflection drawing from the centre. */
  horizon: 0.9,
  /** Loader exit: letters lifting out. */
  lettersOut: 0.55,
  /** Loader exit: mark lifting out. */
  markOut: 0.5,
  /** Loader exit: meta fading. */
  metaOut: 0.3,
  /** Loader exit: the panel sliding up. */
  panelOut: 1.15,
  /** Curtain: the panel rising on leave. */
  curtain: 0.8,
  /** Curtain: the sun setting. */
  sunset: 0.7,
  /** Reduced motion: the loader fades. */
  reducedFade: 0.25,
  /** Reduced motion: progress jumps without a visible tween. */
  instant: 0.01,
  /** Fade-up on enter. */
  fadeUp: 1,
  /** Heading lines rising through masks. */
  lines: 1.2,
  /** Home hero letters rising. */
  heroLetters: 1.35,
  /** Home 3D layer fading in. */
  scene: 1.8,
  /** Home hero wordmark width settling. */
  heroWidth: 1.9,
  /** Home sun glow and about arcs rising. */
  intro: 2.2,
  /** Case study product name letters rising. */
  caseLetters: 1.3,
  /** Case study hero screenshot: the clip opening. */
  shotClip: 1.6,
  /** Case study hero screenshot: the inner screen settling. */
  shotScale: 1.8,
  /** Line draw: one diagram node arriving (in scrubbed timeline units). */
  node: 0.4,
  /** Line draw: one wire drawing (in scrubbed timeline units). */
  wire: 0.5,
} as const;

/** Programmatic scrolls (hash links, back to top): the prototype's 1.6 s ease-out-quart. */
export const SCROLL_TO = {
  duration: 1.6,
  /** Seconds, at least, of a scroll re-aimed at an element that moved during the scroll. */
  minFollow: 0.3,
  easing: (t: number) => 1 - Math.pow(1 - t, 4),
} as const;

/** Media queries the motion code branches on. */
export const MEDIA = {
  motion: "(prefers-reduced-motion: no-preference)",
  reduce: "(prefers-reduced-motion: reduce)",
  /** A mouse or trackpad: the cursor and magnetic buttons run only here. */
  finePointer: "(hover: hover) and (pointer: fine)",
  /** The prototype's desk / mob split (Pages.home), the `nav` breakpoint in globals.css. */
  desktop: "(min-width: 761px)",
  mobile: "(max-width: 760px)",
  /** The prototype's two-column split (max-width 900), the `split` breakpoint in globals.css:
      the work rail and the case study tour stage show from here. */
  split: "(min-width: 901px)",
} as const;

/** Distances of the shell's moves, in px unless noted. */
export const SHELL = {
  /** The header hides when scrolling down past this offset. */
  headerHideAfter: 240,
  /** Tone triggers: where a section takes over the shell tone (prototype initTone). */
  toneLine: 50,
  toneStart: "top 50px",
  toneEnd: "bottom 50px",
  /** Footer wordmark rise, yPercent. */
  footerWordFrom: 60,
  footerWordTo: 14,
  /** Footer CTA heading lines start when the heading reaches this point. */
  footerCtaStart: "top 80%",
} as const;

/** Loader moves, in px (letters, mark) and mark units (sun, in SUN). */
export const LOADER_MOVE = {
  letterY: 26,
  letterOutY: -30,
  markOutY: -24,
  /** The curved edge of the panel while it moves, and flat. */
  curve: "50% 14vh",
  flat: "50% 0vh",
  /** The horizon and reflection grow from the centre of the horizon line. */
  horizonOrigin: "32 41",
} as const;

/** Seconds of the loader exit timeline at which events start. */
export const LOADER_EXIT_AT = {
  mark: 0.1,
  panel: 0.3,
  /** The page intro starts 0.55 s into the exit. */
  ready: 0.55,
} as const;

/** Seconds of the curtain timeline at which the sun starts setting. */
export const CURTAIN_AT = { sun: 0.2 } as const;

/** Every scroll-linked timeline uses the same smoothing. */
export const SCRUB = 0.8;

export const STAGGER = {
  lines: 0.08,
  words: 0.1,
  horizon: 0.08,
  lettersOut: 0.025,
  heroLetters: 0.045,
  projectHead: 0.07,
  tiles: 0.32,
  arcs: 0.14,
  /** Fade-up groups (prototype fadeUpOnEnter default). */
  reveal: 0.08,
  caseLetters: 0.05,
  /** Case study: the back link, lead and facts after the product name (Pages.case intro). */
  caseLater: 0.07,
  /** Case study: the adaptation cards (fadeUpOnEnter(".steps", 0.09)). */
  adapt: 0.09,
  /** Case study: the architecture list (fadeUpOnEnter(".arch-list", 0.1)). */
  archList: 0.1,
} as const;

export const LENIS = { lerp: 0.1 } as const;

/** Cursor follow, lerp per frame at 60 fps (frame-rate independent in use). */
export const CURSOR = { lerp: 0.16 } as const;

/** Magnetic pull as a fraction of the pointer offset from the centre. */
export const MAGNETIC = { x: 0.22, y: 0.3 } as const;

/** Seconds from the start of the loader exit until the panel has left the viewport. */
export const LOADER_EXIT_TOTAL = LOADER_EXIT_AT.panel + DURATION.panelOut;

/** 5000 − 1450 would be 3550; 250 ms of it is margin for a busy main thread, where the deadline
    timer, the final push and the exit each end late (on the 4x-CPU profile the exit started 70 to
    150 ms late on a quiet machine, and later while hydration was still running; docs/spikes/tbt.md). */
const CEILING_MS = 3300;

export const LOADER = {
  floorFirstMs: 1600,
  floorRouteMs: 700,
  floorReducedMs: 250,
  /** The latest moment the exit starts, from navigation start (first visit) or from the cover
      (route change). Exit start plus the exit (LOADER_EXIT_TOTAL, 1.45 s) stays under the 5 s
      the loader may cover content (docs/quality.md). */
  ceilingMs: CEILING_MS,
  /** When the registry stops waiting for tasks: the final push to 100 % still plays before the
      exit, so it ends at the ceiling. */
  tasksDeadlineMs: CEILING_MS - DURATION.progressEnd * 1000,
  /** The boot script reveals the page if nothing has marked it ready by then. */
  failsafeMs: 7000,
  weights: { fonts: 3, load: 2, image: 1, scene: 3 },
} as const;

/** Loader geometry in mark units: the sun disc sits 19 below the horizon when set. */
export const SUN = { setY: 19 } as const;

// ---------- primitives (docs/primitives.md) ----------

/** Text and group reveals: prototype linesUp, wordsLight, fadeUpOnEnter, Pages.home, Pages.case. */
export const REVEAL = {
  /** SplitReveal lines start this far below their mask. */
  linesYPercent: 110,
  /** SplitReveal chars start this far below their mask. */
  charsYPercent: 115,
  /** Where an `enter` reveal plays (fadeUpOnEnter, Pages.case next project). */
  enterStart: "top 85%",
  /** Reveal: px the group rises from. */
  fadeY: 28,
  /** WordsLight: unlit words start at this opacity. The prototype's 0.14 gave 1.32:1 on paper;
      0.5 gives ink on paper about 3.1:1 and moon on night about 4.5:1, over the 3:1 that large
      text needs (Lighthouse color-contrast, 03). */
  wordsFrom: 0.5,
  /** WordsLight default range (prototype wordsLight). */
  wordsStart: "top 75%",
  wordsEnd: "bottom 40%",
} as const;

/** SplitReveal chars pace: the home hero wordmark and the case study product name. */
export const CHARS_PACE = {
  hero: { duration: DURATION.heroLetters, stagger: STAGGER.heroLetters },
  case: { duration: DURATION.caseLetters, stagger: STAGGER.caseLetters },
} as const;

/** Seconds a ready-time intro waits after the ready signal. */
export const DELAY = {
  /** Case study hero screenshot (Pages.case intro). */
  shot: 0.5,
} as const;

/** MediaReveal (prototype revealMedia and the case study hero shot). Insets are % (top, right,
    bottom, left); the radius is a token name (`--r-<name>`). src/styles/primitives.css mirrors
    the start states (tests/unit/primitives.test.ts keeps them in sync). */
export const MEDIA_REVEAL = {
  scrub: { inset: [18, 6, 0, 6], radius: "media", scale: 1.16, start: "top 95%", end: "top 45%" },
  intro: { inset: [30, 8, 0, 8], radius: "shot", scale: 1.2 },
} as const;

/** LineDraw (Pages.case architecture): positions in scrubbed timeline units. */
export const LINE_DRAW = {
  nodeY: 16,
  /** Each node and each wire starts this long after the previous one. */
  step: 0.35,
  /** The first wire starts this long after the first node. */
  wireOffset: 0.2,
  start: "top 70%",
  end: "bottom 60%",
} as const;

/** useStageTimeline default range: the stage section from its top to its bottom. */
export const STAGE = { start: "top top", end: "bottom bottom" } as const;

/** useScrollSpy activation lines, as a fraction of the viewport height from the top. */
export const SPY = { list: 0.45, tour: 0.55 } as const;

/** Scrub end states of the simple scrubs (Pages.home hero, Pages.about dawn). */
export const SETTLE = {
  heroWord: { yPercent: -14, scale: 0.92 },
  heroMeta: { opacity: 0, y: -30 },
  arcs: { yPercent: -10, scale: 1.25, opacity: 0.25 },
} as const;

// ---------- home (Pages.home, docs/choreography.md "Home") ----------

/** The home page's own choreography: the hero intro around the primitives, the sun, the dusk sky
    and the featured work stage. Timeline positions and durations of the scrubbed stages are in
    timeline units, as in the prototype (a scrubbed timeline is stretched over its scroll range). */
export const HOME = {
  hero: {
    /** The wordmark's width axis settles from 75 to 100 (DURATION.heroWidth). */
    wdthFrom: 75,
    wdthTo: 100,
    /** Meta and foot fade up from this offset, starting this long after ready, one stagger for
        the four of them (meta's two paragraphs, then the foot's paragraph and actions). */
    laterY: 18,
    laterDelay: 0.6,
    laterStagger: 0.07,
    /** The meta has faded out at this point of the hero's scroll. */
    metaEnd: "45% top",
  },
  scene: {
    /** The 3D layer fades in (DURATION.scene) this long after ready. */
    delay: 0.3,
    /** The layer dims to this opacity while the manifesto scrolls in. */
    dim: 0.3,
  },
  sun: {
    /** Intro: the glow rises from here (DURATION.intro). */
    fromYPercent: 40,
    /** Scroll, from the hero's top to the dusk's centre: the sun sinks, then fades. */
    sink: { yPercent: 62, scale: 0.86 },
    sinkDuration: 1,
    fadeAt: 0.65,
    fadeDuration: 0.35,
  },
  dusk: {
    /** The header turns to night at the section's centre. */
    toneStart: "center 50px",
    start: "top bottom",
    end: "bottom top",
    /** The stage timeline: sky paper → sunset → night, text colours crossing to moon. */
    sunsetDuration: 0.28,
    nightAt: 0.28,
    nightDuration: 0.32,
    colourAt: 0.32,
    colourDuration: 0.25,
    subAt: 0.3,
    subDuration: 0.2,
    subY: 20,
    /** The title lines (SplitReveal scrub on the dusk section): the prototype places them at 0.14
        to about 0.5 of its 0.6-long timeline over "top bottom".."bottom top" of the 190 vh
        section, which is the section's top from 32 % to -142 % of the viewport. */
    linesStart: "top 32%",
    linesEnd: "top -142%",
  },
  featured: {
    copyY: 34,
    copyStagger: 0.07,
    copyDuration: 0.5,
    tilesAt: 0.15,
    tileDuration: 0.8,
    innerDuration: 0.9,
    /** Inner screens settle from this scale. */
    innerFrom: 1.22,
    /** Hold at the end of the stage. */
    tail: 0.4,
    /** Mobile: the copy fades up on entry, each screen opens on its own range. */
    mobileCopyY: 26,
    mobileCopyStagger: 0.08,
    mobileCopyDuration: 0.9,
    mobileCopyStart: "top 80%",
    mobileTileStart: "top 92%",
    mobileTileEnd: "top 50%",
  },
} as const;

// ---------- work (Pages.work, docs/choreography.md "Work") ----------

/** The work page around the primitives: the hero's lead and link fade up after the title lines,
    each sheet's head fades up on entry (STAGGER.projectHead), the rail's progress line fills while
    the projects cross the spy line (SPY.list, 45 %). */
export const WORK = {
  hero: { laterY: 20, laterDelay: 0.35 },
  head: { y: 30, start: "top 80%" },
  progress: { start: "top 45%", end: "bottom 45%" },
} as const;

// ---------- case study (Pages.case, docs/choreography.md "Case study") ----------

/** The case study around the primitives. */
export const CASE = {
  /** The back link, lead and facts rise from this offset, starting this long after ready, one
      STAGGER.caseLater apart (back link first). */
  hero: { laterY: 22, laterDelay: 0.4 },
  /** The problem statement's words light over its section (prototype wordsLight(".problem")). */
  problem: { start: "top 70%", end: "bottom 55%" },
  tour: {
    /** Inactive steps. The prototype's 0.35 left the step text at about 1.7:1 on paper; 0.88 is
        the lowest opacity that keeps --ink-soft on --paper at 4.5:1 (4.62:1; 0.87 gives 4.52:1,
        0.86 fails), too close to full to read as dimmed on its own, so the step also scales down
        and only the active step's number turns Majorelle (src/styles/case.css). */
    dimOpacity: 0.88,
    dimScale: 0.96,
    /** Inactive stage screens wait at this scale, hidden, and grow to 1 as they fade in. */
    screenFrom: 0.97,
  },
} as const;
