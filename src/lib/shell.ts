/* Framework-free, so the Loader, the TransitionProvider, SmoothScroll and the hooks share it
   without importing each other (docs/architecture.md). One loader registry serves the whole visit
   and restarts on each route change. */
import { createLoader, isFirstVisit, type LoaderKind, type LoaderRegistry } from "@/lib/loader";
import { MEDIA } from "@/lib/motion";

export interface Signal {
  fire: () => void;
  reset: () => void;
  fired: () => boolean;
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

export interface Overlay {
  cover: () => Promise<void>;
  /** Back and Forward: the panel covers the viewport at once, before the browser paints. */
  coverNow: () => void;
  /** `beforeExit` runs under the full panel, right before it lifts. `afterExit` runs once the
      content is no longer inert, because an inert element cannot take focus. */
  run: (options?: {
    beforeExit?: () => void;
    afterExit?: () => void;
    drawIn?: boolean;
  }) => Promise<void>;
}

let overlay: Overlay | null = null;

/** The cleanup unregisters it only if it is still the current one. */
export function setOverlay(next: Overlay): () => void {
  overlay = next;
  return () => {
    if (overlay === next) overlay = null;
  };
}

export function getOverlay(): Overlay | null {
  return overlay;
}

export function detectKind(
  doc: Pick<Document, "documentElement"> = document,
  reducedMotion: boolean = window.matchMedia(MEDIA.reduce).matches,
  firstVisit: boolean = isFirstVisit(),
): LoaderKind {
  if (reducedMotion) return "reduced";
  if (doc.documentElement.classList.contains("arriving") || !firstVisit) return "route";
  return "first";
}

export function routeKind(reducedMotion: boolean): LoaderKind {
  return reducedMotion ? "reduced" : "route";
}

let registry: LoaderRegistry | null = null;

/** Created on first use, in the browser only. */
export function shellRegistry(): LoaderRegistry {
  registry ??= createLoader(detectKind(), { elapsedMs: performance.now() });
  return registry;
}

/** 0.55 s into the loader exit, when page intros may start. */
export const shellReady: Signal = createSignal();

/** Starts true: the loader is up at first paint whenever JavaScript runs. */
export const shellBusy: Store<boolean> = createStore(true);

export function fireReady(doc: Pick<Document, "documentElement"> = document): void {
  doc.documentElement.classList.add("ready");
  shellReady.fire();
}

export function resetReady(doc: Pick<Document, "documentElement"> = document): void {
  doc.documentElement.classList.remove("ready");
  shellReady.reset();
}

export const SHELL_CONTENT_ATTR = "data-shell-content";

export function setContentInert(root: Pick<ParentNode, "querySelectorAll">, inert: boolean): void {
  for (const el of root.querySelectorAll(`[${SHELL_CONTENT_ATTR}]`)) {
    el.toggleAttribute("inert", inert);
  }
}
