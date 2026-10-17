import { describe, expect, it, vi } from "vitest";
import {
  createSignal,
  createStore,
  detectKind,
  fireReady,
  getOverlay,
  resetReady,
  routeKind,
  setContentInert,
  setOverlay,
  shellReady,
  type Overlay,
} from "@/lib/shell";
import { todoReport } from "@/lib/site";

function fakeHtml(classes: string[] = []) {
  const set = new Set(classes);
  return {
    documentElement: {
      classList: {
        contains: (c: string) => set.has(c),
        add: (c: string) => set.add(c),
        remove: (c: string) => set.delete(c),
      },
    },
    set,
  };
}
// Test stub: only the classList members the module uses.
const asDoc = (f: ReturnType<typeof fakeHtml>) => f as unknown as Pick<Document, "documentElement">;

describe("signal", () => {
  it("fires once until reset, and tells late listeners it fired", () => {
    const s = createSignal();
    const listener = vi.fn();
    s.subscribe(listener);
    s.fire();
    s.fire();
    expect(listener).toHaveBeenCalledOnce();
    expect(s.fired()).toBe(true);
    s.reset();
    expect(s.fired()).toBe(false);
    s.fire();
    expect(listener).toHaveBeenCalledTimes(2);
  });

  it("stops calling after unsubscribe", () => {
    const s = createSignal();
    const listener = vi.fn();
    s.subscribe(listener)();
    s.fire();
    expect(listener).not.toHaveBeenCalled();
  });
});

describe("store", () => {
  it("notifies on change only", () => {
    const store = createStore(true);
    const seen: boolean[] = [];
    store.subscribe((v) => seen.push(v));
    store.set(true);
    store.set(false);
    store.set(false);
    store.set(true);
    expect(seen).toEqual([false, true]);
    expect(store.get()).toBe(true);
  });
});

describe("ready", () => {
  it("mirrors itself on html.ready", () => {
    const doc = fakeHtml();
    resetReady(asDoc(doc));
    fireReady(asDoc(doc));
    expect(doc.set.has("ready")).toBe(true);
    expect(shellReady.fired()).toBe(true);
    resetReady(asDoc(doc));
    expect(doc.set.has("ready")).toBe(false);
    expect(shellReady.fired()).toBe(false);
  });
});

describe("loader kind", () => {
  it("is reduced under reduced motion, route when arriving or visited, first otherwise", () => {
    expect(detectKind(asDoc(fakeHtml()), true, true)).toBe("reduced");
    expect(detectKind(asDoc(fakeHtml(["arriving"])), false, true)).toBe("route");
    expect(detectKind(asDoc(fakeHtml()), false, false)).toBe("route");
    expect(detectKind(asDoc(fakeHtml()), false, true)).toBe("first");
    expect(routeKind(true)).toBe("reduced");
    expect(routeKind(false)).toBe("route");
  });
});

describe("overlay port", () => {
  it("unregisters only the overlay it registered", () => {
    const a = {} as Overlay; // test stub, never called
    const b = {} as Overlay; // test stub, never called
    const offA = setOverlay(a);
    const offB = setOverlay(b);
    offA();
    expect(getOverlay()).toBe(b);
    offB();
    expect(getOverlay()).toBeNull();
  });
});

describe("inert content", () => {
  it("toggles inert on every shell content element", () => {
    const attrs = [new Set<string>(), new Set<string>()];
    const els = attrs.map((set) => ({
      toggleAttribute: (name: string, on: boolean) => (on ? set.add(name) : set.delete(name)),
    }));
    const root = {
      querySelectorAll: (selector: string) => (selector.includes("data-shell-content") ? els : []),
    };
    // Test stub: only querySelectorAll is used.
    const asRoot = root as unknown as Pick<ParentNode, "querySelectorAll">;
    setContentInert(asRoot, true);
    expect(attrs.every((s) => s.has("inert"))).toBe(true);
    setContentInert(asRoot, false);
    expect(attrs.some((s) => s.has("inert"))).toBe(false);
  });
});

describe("todo report", () => {
  it("lists placeholders and the pending legal review", () => {
    expect(todoReport({ email: "[TODO: email]", legalReview: "pending", city: "Agadir" })).toEqual([
      "email: [TODO: email]",
      "legalReview: pending",
    ]);
    expect(todoReport({ legalReview: "done" })).toEqual([]);
  });
});
