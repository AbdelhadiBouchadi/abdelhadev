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
} as const;

/** Programmatic scrolls (hash links, back to top): the prototype's 1.6 s ease-out-quart. */
export const SCROLL_TO = {
  duration: 1.6,
  easing: (t: number) => 1 - Math.pow(1 - t, 4),
} as const;

/** Media queries the motion code branches on. */
export const MEDIA = {
  motion: "(prefers-reduced-motion: no-preference)",
  reduce: "(prefers-reduced-motion: reduce)",
  /** A mouse or trackpad: the cursor and magnetic buttons run only here. */
  finePointer: "(hover: hover) and (pointer: fine)",
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
  /** Line reveals start below their mask. */
  linesYPercent: 110,
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
} as const;

export const LENIS = { lerp: 0.1 } as const;

/** Cursor follow, lerp per frame at 60 fps (frame-rate independent in use). */
export const CURSOR = { lerp: 0.16 } as const;

/** Magnetic pull as a fraction of the pointer offset from the centre. */
export const MAGNETIC = { x: 0.22, y: 0.3 } as const;

export const LOADER = {
  floorFirstMs: 1600,
  floorRouteMs: 700,
  floorReducedMs: 250,
  ceilingMs: 4500,
  /** The boot script reveals the page if nothing has marked it ready by then. */
  failsafeMs: 7000,
  weights: { fonts: 3, load: 2, image: 1, scene: 3 },
} as const;

/** Loader geometry in mark units: the sun disc sits 19 below the horizon when set. */
export const SUN = { setY: 19 } as const;
