/* The only place easing and duration values exist in TypeScript. tests/unit/motion.test.ts checks
   the ones that also exist as CSS custom properties in src/styles/tokens.css. */

/** Shared by CustomEase and CSS `--ease-warm`. */
export const WARM_CURVE = [0.625, 0.05, 0, 1] as const;

export const EASE = {
  warm: "warm",
  progress: "power2.out",
  sunset: "power2.in",
  liftOut: "power3.in",
  /** The about halos accelerate as they pass the camera. */
  halo: "power1.in",
  settle: "power2.out",
  none: "none",
} as const;

/** Seconds, as GSAP expects them. */
export const DURATION = {
  /** `fade` to `header` mirror their --dur-* tokens. */
  fade: 0.3,
  quick: 0.4,
  cursor: 0.45,
  hover: 0.5,
  base: 0.6,
  header: 0.7,
  crossfade: 0.7,
  stepDim: 0.5,
  letter: 0.7,
  progress: 0.8,
  progressEnd: 0.45,
  horizon: 0.9,
  lettersOut: 0.55,
  markOut: 0.5,
  metaOut: 0.3,
  panelOut: 1.15,
  curtain: 0.8,
  sunset: 0.7,
  reducedFade: 0.25,
  instant: 0.01,
  fadeUp: 1,
  lines: 1.2,
  heroLetters: 1.35,
  scene: 1.8,
  heroWidth: 1.9,
  intro: 2.2,
  caseLetters: 1.3,
  shotClip: 1.6,
  shotScale: 1.8,
  /** node and wire are in scrubbed timeline units. */
  node: 0.4,
  wire: 0.5,
} as const;

/** Hash links and back to top: ease-out-quart. */
export const SCROLL_TO = {
  duration: 1.6,
  /** Seconds, at least, of a scroll re-aimed at an element that moved during the scroll. */
  minFollow: 0.3,
  easing: (t: number) => 1 - Math.pow(1 - t, 4),
} as const;

export const MEDIA = {
  motion: "(prefers-reduced-motion: no-preference)",
  reduce: "(prefers-reduced-motion: reduce)",
  /** The cursor and magnetic buttons run only here. */
  finePointer: "(hover: hover) and (pointer: fine)",
  /** The `nav` breakpoint in globals.css. */
  desktop: "(min-width: 761px)",
  mobile: "(max-width: 760px)",
  /** The `split` breakpoint in globals.css: the work rail and the tour stage show from here. */
  split: "(min-width: 901px)",
} as const;

/** px unless noted. */
export const SHELL = {
  headerHideAfter: 240,
  toneLine: 50,
  toneStart: "top 50px",
  toneEnd: "bottom 50px",
  /** yPercent. */
  footerWordFrom: 60,
  footerWordTo: 14,
  footerCtaStart: "top 80%",
} as const;

/** px, except the sun (mark units, in SUN). */
export const LOADER_MOVE = {
  letterY: 26,
  letterOutY: -30,
  markOutY: -24,
  curve: "50% 14vh",
  flat: "50% 0vh",
  horizonOrigin: "32 41",
} as const;

/** Seconds into the loader exit. */
export const LOADER_EXIT_AT = {
  mark: 0.1,
  panel: 0.3,
  ready: 0.55,
} as const;

/** Seconds into the curtain. */
export const CURTAIN_AT = { sun: 0.2 } as const;

export const SCRUB = 0.8;

export const STAGGER = {
  lines: 0.08,
  words: 0.1,
  horizon: 0.08,
  lettersOut: 0.025,
  heroLetters: 0.045,
  projectHead: 0.07,
  tiles: 0.32,
  reveal: 0.08,
  caseLetters: 0.05,
  caseLater: 0.07,
  adapt: 0.09,
  archList: 0.1,
} as const;

export const LENIS = { lerp: 0.1 } as const;

/** Per frame at 60 fps; frame-rate independent in use. */
export const CURSOR = { lerp: 0.16 } as const;

/** A fraction of the pointer's offset from the centre. */
export const MAGNETIC = { x: 0.22, y: 0.3 } as const;

export const LOADER_EXIT_TOTAL = LOADER_EXIT_AT.panel + DURATION.panelOut;

/** 5000 − 1450 would be 3550. The 250 ms left is margin for a busy main thread, where the
    deadline timer, the final push and the exit each end late (docs/spikes/tbt.md). */
const CEILING_MS = 3300;

export const LOADER = {
  floorFirstMs: 1600,
  floorRouteMs: 700,
  floorReducedMs: 250,
  /** From navigation start (first visit) or from the cover (route change). Plus the exit, it stays
      under the 5 s the loader may cover content (docs/quality.md). */
  ceilingMs: CEILING_MS,
  /** The final push to 100 % still plays after this, so it ends at the ceiling. */
  tasksDeadlineMs: CEILING_MS - DURATION.progressEnd * 1000,
  /** The boot script reveals the page if nothing has marked it ready by then. */
  failsafeMs: 7000,
  weights: { fonts: 3, load: 2, image: 1, scene: 3 },
} as const;

/** Mark units: the sun disc sits 19 below the horizon when set. */
export const SUN = { setY: 19 } as const;

export const REVEAL = {
  linesYPercent: 110,
  charsYPercent: 115,
  enterStart: "top 85%",
  fadeY: 28,
  /** The words reach 1 within their scrubbed range, before they are read. Under reduced motion
      and without JavaScript they are fully opaque. */
  wordsFrom: 0.14,
  wordsStart: "top 75%",
  wordsEnd: "bottom 40%",
} as const;

export const CHARS_PACE = {
  hero: { duration: DURATION.heroLetters, stagger: STAGGER.heroLetters },
  case: { duration: DURATION.caseLetters, stagger: STAGGER.caseLetters },
} as const;

/** Seconds after the ready signal. */
export const DELAY = {
  shot: 0.5,
} as const;

/** Insets in % (top, right, bottom, left); the radius is a token name (`--r-<name>`).
    src/styles/primitives.css mirrors the start states (tests/unit/primitives.test.ts). */
export const MEDIA_REVEAL = {
  scrub: { inset: [18, 6, 0, 6], radius: "media", scale: 1.16, start: "top 95%", end: "top 45%" },
  intro: { inset: [30, 8, 0, 8], radius: "shot", scale: 1.2 },
} as const;

/** Scrubbed timeline units. */
export const LINE_DRAW = {
  nodeY: 16,
  step: 0.35,
  wireOffset: 0.2,
  start: "top 70%",
  end: "bottom 60%",
} as const;

export const STAGE = { start: "top top", end: "bottom bottom" } as const;

/** Fractions of the viewport height from the top. */
export const SPY = { list: 0.45, tour: 0.55 } as const;

export const SETTLE = {
  heroWord: { yPercent: -14, scale: 0.92 },
  heroMeta: { opacity: 0, y: -30 },
} as const;

/** Scrubbed stage positions and durations are in timeline units: a scrubbed timeline is
    stretched over its scroll range. */
export const HOME = {
  hero: {
    wdthFrom: 75,
    wdthTo: 100,
    laterY: 18,
    laterDelay: 0.6,
    laterStagger: 0.07,
    metaEnd: "45% top",
  },
  scene: {
    delay: 0.3,
    dim: 0.3,
  },
  sun: {
    fromYPercent: 40,
    sink: { yPercent: 62, scale: 0.86 },
    sinkDuration: 1,
    fadeAt: 0.65,
    fadeDuration: 0.35,
  },
  dusk: {
    toneStart: "center 50px",
    start: "top bottom",
    end: "bottom top",
    sunsetDuration: 0.28,
    nightAt: 0.28,
    nightDuration: 0.32,
    colourAt: 0.32,
    colourDuration: 0.25,
    subAt: 0.3,
    subDuration: 0.2,
    subY: 20,
    /** 0.14 to about 0.5 of the 0.6-long stage timeline, mapped onto the 190 vh section. */
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
    innerFrom: 1.22,
    tail: 0.4,
    mobileCopyY: 26,
    mobileCopyStagger: 0.08,
    mobileCopyDuration: 0.9,
    mobileCopyStart: "top 80%",
    mobileTileStart: "top 92%",
    mobileTileEnd: "top 50%",
  },
} as const;

export const WORK = {
  hero: { laterY: 20, laterDelay: 0.35 },
  head: { y: 30, start: "top 80%" },
  progress: { start: "top 45%", end: "bottom 45%" },
} as const;

export const CASE = {
  hero: { laterY: 22, laterDelay: 0.4 },
  problem: { start: "top 70%", end: "bottom 55%" },
  tour: {
    /** 0.88 is the lowest opacity that keeps --ink-soft on --paper at 4.5:1. That is too close to
        full to read as dimmed, so the step also scales down and only the active number turns
        Majorelle (src/styles/case.css). */
    dimOpacity: 0.88,
    dimScale: 0.96,
    screenFrom: 0.97,
  },
} as const;

export const ABOUT = {
  dawn: {
    titleDelay: 0.3,
    laterY: 20,
    laterDelay: 0.8,
    /** src/styles/about.css mirrors this start state (tests/unit/about.test.ts). */
    glowFrom: { scaleY: 0.6 },
    glowRise: 2,
    /** Lighter than SCRUB: Lenis already smooths the scroll under it. */
    scrub: 0.6,
    start: "top top",
    /** Screens at the end of the section with no scene: the sticky stage's own and the one the
        chapters slide over. */
    tailScreens: 2,
    /** The rest is in timeline units: the scene runs from 0 to `end` over its scroll range. */
    copy: { yPercent: -28, duration: 0.2 },
    glow: { scaleY: 2.4, duration: 0.22 },
    sky: { at: 0.04, duration: 0.2 },
    /** Scale `from` to `to`; each halo fades in over `fadeIn` and out `fadeOutAt` after it starts. */
    halos: {
      at: 0.12,
      step: 0.12,
      from: 0.08,
      to: 1.9,
      rise: 0.42,
      fadeIn: 0.08,
      fadeOutAt: 0.28,
      fadeOut: 0.14,
    },
    sun: {
      dayAt: 0.66,
      dayDuration: 0.2,
      glowOpacity: 0.55,
      horizonAt: 0.7,
      discAt: 0.74,
      reflectionAt: 0.8,
      barDuration: 0.12,
      discDuration: 0.18,
    },
    end: 1,
  },
  chapter: {
    labelY: 24,
    labelStart: "top 60%",
    wordsStart: "top 20%",
    wordsEnd: "bottom bottom",
  },
  stagger: { services: 0.08, timeline: 0.08, stack: 0.08, now: 0.1 },
} as const;

export const CONTACT = {
  lead: { y: 20, delay: 0.35 },
  cards: { y: 40, delay: 0.45, duration: 1.1, stagger: 0.1 },
  done: { y: 20, duration: 0.8 },
  /** Sonner counts in milliseconds. On mobile the toast sits above the floating nav pill. */
  toast: {
    durationMs: 5000,
    offset: { bottom: "24px", right: "24px", left: "24px" },
    mobileOffset: {
      bottom: "calc(88px + env(safe-area-inset-bottom, 0px))",
      right: "16px",
      left: "16px",
    },
  },
} as const;
