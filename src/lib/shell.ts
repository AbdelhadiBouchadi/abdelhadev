/* The shell's shared state, framework-free (no React, no GSAP), so the Loader (components/layout),
   the TransitionProvider and SmoothScroll (primitives) and the hooks can meet without importing
   each other (docs/architecture.md, "Import boundaries").

   - One loader registry for the whole visit (spike S2): the first-visit cycle and every route
     cycle are the same registry, restarted with `reset("route" | "reduced")`.
   - The ready signal: fired 0.55 s into the loader's exit (and the curtain's lift), when page
     intros start. It mirrors itself on `html.ready`.
   - The busy flag: true while the loader or a curtain is on screen. Lenis stops and the content
     under the overlay is inert while it is true.
   - The overlay port: the Loader registers the functions that drive the overlay; the
     TransitionProvider calls them. */
import { createLoader, isFirstVisit, type LoaderKind, type LoaderRegistry } from "@/lib/loader";
import { MEDIA } from "@/lib/motion";

// ---------- small reactive pieces ----------

export interface Signal {
  fire: () => void;
  reset: () => void;
  fired: () => boolean;
  /** Calls `listener` on every fire. Returns unsubscribe. */
  subscribe: (listener: () => void) => () => void;
}

export function createSignal(): Signal {
  const listeners = new Set<() => void>();
  let isFired = false;
  return {
    fire() {
      if (isFired) return;
      isFired = true;
      for (const listener of [...listeners]) listener();
    },
    reset() {
      isFired = false;
    },
    fired: () => isFired,
    subscribe(listener) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
  };
}

export interface Store<T> {
  get: () => T;
  set: (value: T) => void;
  /** Calls `listener` on every change. Returns unsubscribe. */
  subscribe: (listener: (value: T) => void) => () => void;
}

export function createStore<T>(initial: T): Store<T> {
  const listeners = new Set<(value: T) => void>();
  let value = initial;
  return {
    get: () => value,
    set(next) {
      if (Object.is(next, value)) return;
      value = next;
      for (const listener of [...listeners]) listener(value);
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
  };
}

// ---------- the overlay port ----------

export interface Overlay {
  /** Leaving a page: the panel rises over the page while the sun sets. */
  cover: () => Promise<void>;
  /** Back and Forward: the panel is put over the viewport at once, before the browser paints. */
  coverNow: () => void;
  /** Runs the current loader cycle (progress, sunrise, letters) and the exit. `beforeExit` runs
      under the full panel, right before it lifts (the scroll position goes there); `afterExit`
      runs once the content is no longer inert (focus goes there: an inert element cannot take
      it). `drawIn` draws the horizon from the centre (first visit only). */
  run: (options?: {
    beforeExit?: () => void;
    afterExit?: () => void;
    drawIn?: boolean;
  }) => Promise<void>;
}

let overlay: Overlay | null = null;

/** Registers the overlay. Returns a cleanup that unregisters it if it is still the current one. */
export function setOverlay(next: Overlay): () => void {
  overlay = next;
  return () => {
    if (overlay === next) overlay = null;
  };
}

export function getOverlay(): Overlay | null {
  return overlay;
}

// ---------- the visit ----------

/** The loader kind for the current page load, read from the boot script's classes. */
export function detectKind(
  doc: Pick<Document, "documentElement"> = document,
  reducedMotion: boolean = window.matchMedia(MEDIA.reduce).matches,
  firstVisit: boolean = isFirstVisit(),
): LoaderKind {
  if (reducedMotion) return "reduced";
  if (doc.documentElement.classList.contains("arriving") || !firstVisit) return "route";
  return "first";
}

/** The loader kind for a route change. */
export function routeKind(reducedMotion: boolean): LoaderKind {
  return reducedMotion ? "reduced" : "route";
}

let registry: LoaderRegistry | null = null;

/** The visit's loader registry, created on first use (in the browser only). */
export function shellRegistry(): LoaderRegistry {
  registry ??= createLoader(detectKind(), { elapsedMs: performance.now() });
  return registry;
}

/** Fired when the page intro may start (0.55 s into the loader exit). */
export const shellReady: Signal = createSignal();

/** True while the loader or a curtain covers the page. Starts true: the loader is up at first paint
    whenever JavaScript runs. */
export const shellBusy: Store<boolean> = createStore(true);

export function fireReady(doc: Pick<Document, "documentElement"> = document): void {
  doc.documentElement.classList.add("ready");
  shellReady.fire();
}

export function resetReady(doc: Pick<Document, "documentElement"> = document): void {
  doc.documentElement.classList.remove("ready");
  shellReady.reset();
}

/** The elements the overlay covers (header, mobile nav, main, footer) carry this attribute. */
export const SHELL_CONTENT_ATTR = "data-shell-content";

/** Makes the content under the overlay inert, or gives it back. */
export function setContentInert(root: Pick<ParentNode, "querySelectorAll">, inert: boolean): void {
  for (const el of root.querySelectorAll(`[${SHELL_CONTENT_ATTR}]`)) {
    el.toggleAttribute("inert", inert);
  }
}
