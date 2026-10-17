/* The loader task registry, framework-free (no React, no GSAP), ported from `Loader` in
   docs/prototype/assets/site.js.

   A cycle starts when the page starts loading (first visit) or when a route change is covered by
   the curtain. Anything the page really needs registers with `track(weight, promise)`: fonts,
   window load, critical images, the home 3D scene. Progress is the settled weight over the total
   weight. A rejected task counts as settled: a failed image must not hold the page hostage.

   The cycle is ready when the floor has passed AND (every task has settled OR the ceiling has
   passed). The floor keeps the sunrise readable; the ceiling keeps a slow network from hiding the
   page. */
import { LOADER } from "@/lib/motion";

export type LoaderKind = "first" | "route" | "reduced";

export interface LoaderClock {
  now: () => number;
  wait: (ms: number) => Promise<void>;
}

export interface LoaderRegistry {
  /** Registers a task. Tasks tracked after the cycle is ready are ignored. */
  track: (weight: number, task: PromiseLike<unknown>) => void;
  /** Calls `listener` with progress in [0, 1]; never decreases within a cycle. Returns unsubscribe. */
  subscribe: (listener: (progress: number) => void) => () => void;
  /** Resolves when the current cycle is ready. */
  whenReady: () => Promise<void>;
  /** Current progress of the current cycle. */
  progress: () => number;
  isReady: () => boolean;
  /** Starts a new cycle (route change). Tasks of the previous cycle no longer count. */
  reset: (kind: LoaderKind) => void;
}

export const STORAGE_KEYS = {
  visited: "abd-visited",
  arriving: "abd-arriving",
} as const;

const defaultClock: LoaderClock = {
  now: () => performance.now(),
  wait: (ms) =>
    new Promise((resolve) => {
      setTimeout(resolve, ms);
    }),
};

export function floorFor(kind: LoaderKind): number {
  switch (kind) {
    case "first":
      return LOADER.floorFirstMs;
    case "route":
      return LOADER.floorRouteMs;
    case "reduced":
      return LOADER.floorReducedMs;
  }
}

interface Cycle {
  id: number;
  t0: number;
  floorMs: number;
  total: number;
  settled: number;
  pending: number;
  progress: number;
  ready: boolean;
  floorPassed: boolean;
  ceilingPassed: boolean;
  resolve: () => void;
  promise: Promise<void>;
}

export function createLoader(
  kind: LoaderKind,
  {
    clock = defaultClock,
    ceilingMs = LOADER.ceilingMs,
  }: { clock?: LoaderClock; ceilingMs?: number } = {},
): LoaderRegistry {
  const listeners = new Set<(progress: number) => void>();
  let nextId = 0;
  let cycle = open(kind);

  function open(k: LoaderKind): Cycle {
    let resolve: () => void = () => undefined;
    const promise = new Promise<void>((r) => {
      resolve = r;
    });
    const c: Cycle = {
      id: nextId++,
      t0: clock.now(),
      floorMs: floorFor(k),
      total: 0,
      settled: 0,
      pending: 0,
      progress: 0,
      ready: false,
      floorPassed: false,
      ceilingPassed: false,
      resolve,
      promise,
    };
    void clock.wait(c.floorMs).then(() => {
      c.floorPassed = true;
      check(c);
    });
    void clock.wait(ceilingMs).then(() => {
      c.ceilingPassed = true;
      check(c);
    });
    return c;
  }

  function emit(c: Cycle, value: number) {
    if (c.id !== cycle.id) return;
    const next = Math.max(c.progress, Math.min(1, value));
    if (next === c.progress) return;
    c.progress = next;
    for (const listener of listeners) listener(next);
  }

  function check(c: Cycle) {
    if (c.ready || c.id !== cycle.id) return;
    if (!c.floorPassed) return;
    if (c.pending > 0 && !c.ceilingPassed) return;
    c.ready = true;
    emit(c, 1);
    c.resolve();
  }

  return {
    track(weight, task) {
      const c = cycle;
      if (c.ready || weight <= 0) return;
      c.total += weight;
      c.pending += 1;
      const settle = () => {
        if (c.id !== cycle.id) return;
        c.settled += weight;
        c.pending -= 1;
        emit(c, c.settled / c.total);
        check(c);
      };
      Promise.resolve(task).then(settle, settle);
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    whenReady: () => cycle.promise,
    progress: () => cycle.progress,
    isReady: () => cycle.ready,
    reset(k) {
      cycle = open(k);
      for (const listener of listeners) listener(0);
    },
  };
}

function session(): Storage | null {
  try {
    return typeof window === "undefined" ? null : window.sessionStorage;
  } catch {
    // Storage blocked (privacy mode, sandboxed frame).
    return null;
  }
}

export function isFirstVisit(): boolean {
  try {
    return session()?.getItem(STORAGE_KEYS.visited) !== "1";
  } catch {
    return true;
  }
}

export function markVisited(): void {
  try {
    session()?.setItem(STORAGE_KEYS.visited, "1");
  } catch {
    // Storage full or blocked: the next visit plays the full sequence again, which is harmless.
  }
}
