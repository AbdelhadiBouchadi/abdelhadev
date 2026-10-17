import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  createLoader,
  floorFor,
  isFirstVisit,
  markVisited,
  STORAGE_KEYS,
  type LoaderClock,
} from "@/lib/loader";
import { LOADER } from "@/lib/motion";

// Fake timers drive both the clock and the floor and ceiling timers.
const clock: LoaderClock = {
  now: () => Date.now(),
  wait: (ms) =>
    new Promise((resolve) => {
      setTimeout(resolve, ms);
    }),
};

function deferred() {
  let resolve: () => void = () => undefined;
  let reject: (reason?: unknown) => void = () => undefined;
  const promise = new Promise<void>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

describe("loader registry", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("weighs progress by task weight", async () => {
    const loader = createLoader("first", { clock });
    const fonts = deferred();
    const image = deferred();
    loader.track(LOADER.weights.fonts, fonts.promise);
    loader.track(LOADER.weights.image, image.promise);
    const seen: number[] = [];
    loader.subscribe((p) => seen.push(p));

    image.resolve();
    await vi.advanceTimersByTimeAsync(0);
    expect(loader.progress()).toBeCloseTo(1 / 4);

    fonts.resolve();
    await vi.advanceTimersByTimeAsync(0);
    expect(loader.progress()).toBe(1);
    expect(seen).toEqual([0.25, 1]);
  });

  it("waits for the floor even when every task has settled", async () => {
    const loader = createLoader("first", { clock });
    loader.track(2, Promise.resolve());
    const ready = vi.fn();
    void loader.whenReady().then(ready);

    await vi.advanceTimersByTimeAsync(LOADER.floorFirstMs - 1);
    expect(ready).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(1);
    expect(ready).toHaveBeenCalledOnce();
    expect(loader.isReady()).toBe(true);
  });

  it("uses the route floor after a route change and the reduced floor under reduced motion", () => {
    expect(floorFor("first")).toBe(1600);
    expect(floorFor("route")).toBe(700);
    expect(floorFor("reduced")).toBe(250);
  });

  it("stops waiting at the ceiling when a task never settles", async () => {
    const loader = createLoader("first", { clock });
    loader.track(3, new Promise(() => undefined));
    const ready = vi.fn();
    void loader.whenReady().then(ready);

    await vi.advanceTimersByTimeAsync(LOADER.ceilingMs - 1);
    expect(ready).not.toHaveBeenCalled();
    expect(loader.progress()).toBe(0);
    await vi.advanceTimersByTimeAsync(1);
    expect(ready).toHaveBeenCalledOnce();
    expect(loader.progress()).toBe(1);
  });

  it("counts a rejected task as settled", async () => {
    const loader = createLoader("route", { clock });
    loader.track(1, Promise.reject(new Error("image failed")));
    loader.track(1, Promise.resolve());
    await vi.advanceTimersByTimeAsync(LOADER.floorRouteMs);
    expect(loader.isReady()).toBe(true);
    expect(loader.progress()).toBe(1);
  });

  it("never lets progress go backwards when a task registers late", async () => {
    const loader = createLoader("first", { clock });
    loader.track(1, Promise.resolve());
    await vi.advanceTimersByTimeAsync(0);
    expect(loader.progress()).toBe(1);
    loader.track(3, new Promise(() => undefined));
    expect(loader.progress()).toBe(1);
    expect(loader.isReady()).toBe(false);
  });

  it("ignores tasks tracked after the cycle is ready", async () => {
    const loader = createLoader("route", { clock });
    await vi.advanceTimersByTimeAsync(LOADER.floorRouteMs);
    expect(loader.isReady()).toBe(true);
    loader.track(1, new Promise(() => undefined));
    expect(loader.isReady()).toBe(true);
  });

  it("starts a fresh cycle on reset for a route change", async () => {
    const loader = createLoader("first", { clock });
    const old = deferred();
    loader.track(1, old.promise);
    const seen: number[] = [];
    loader.subscribe((p) => seen.push(p));

    loader.reset("route");
    expect(loader.progress()).toBe(0);
    expect(loader.isReady()).toBe(false);

    // The previous page's task no longer counts.
    old.resolve();
    await vi.advanceTimersByTimeAsync(0);
    expect(loader.progress()).toBe(0);

    const ready = vi.fn();
    void loader.whenReady().then(ready);
    await vi.advanceTimersByTimeAsync(LOADER.floorRouteMs);
    expect(ready).toHaveBeenCalledOnce();
    expect(seen).toEqual([0, 1]);
  });

  it("stops notifying after unsubscribe", async () => {
    const loader = createLoader("route", { clock });
    const listener = vi.fn();
    const off = loader.subscribe(listener);
    off();
    loader.track(1, Promise.resolve());
    await vi.advanceTimersByTimeAsync(LOADER.floorRouteMs);
    expect(listener).not.toHaveBeenCalled();
  });
});

describe("first visit flag", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("is a first visit until marked visited", () => {
    const store = new Map<string, string>();
    vi.stubGlobal("window", {
      sessionStorage: {
        getItem: (k: string) => store.get(k) ?? null,
        setItem: (k: string, v: string) => store.set(k, v),
      },
    });
    expect(isFirstVisit()).toBe(true);
    markVisited();
    expect(store.get(STORAGE_KEYS.visited)).toBe("1");
    expect(isFirstVisit()).toBe(false);
  });

  it("treats blocked storage as a first visit and never throws", () => {
    vi.stubGlobal("window", {
      get sessionStorage(): Storage {
        throw new DOMException("blocked", "SecurityError");
      },
    });
    expect(isFirstVisit()).toBe(true);
    expect(() => markVisited()).not.toThrow();
  });

  it("is a first visit on the server", () => {
    expect(isFirstVisit()).toBe(true);
  });
});
