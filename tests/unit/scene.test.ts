// The home 3D scene without WebGL (src/components/three): the placement maths, the mobile and
// desktop specs, the screen textures' colours, and disposal, on mocked three.js objects that
// record what is created and freed. What a real GPU does with them is not covered here (see the
// home e2e spec and the reply's "Not verified").
import { beforeEach, describe, expect, it, vi } from "vitest";

const made = vi.hoisted(() => ({
  geometries: [] as { dispose: () => void }[],
  materials: [] as { dispose: () => void }[],
  textures: [] as { dispose: () => void }[],
  lights: [] as { dispose: () => void }[],
  renderers: [] as {
    dispose: () => void;
    forceContextLoss: () => void;
    render: () => void;
    setSize: (w: number, h: number) => void;
  }[],
  scenes: [] as { children: unknown[]; clear: () => void }[],
}));

vi.mock("three", () => {
  class Vec3 {
    x = 0;
    y = 0;
    z = 0;
    set(x: number, y: number, z: number) {
      this.x = x;
      this.y = y;
      this.z = z;
      return this;
    }
  }
  class Object3D {
    position = new Vec3();
    rotation = new Vec3();
    children: unknown[] = [];
    add(...objects: unknown[]) {
      this.children.push(...objects);
      return this;
    }
  }
  class Geometry {
    dispose = vi.fn();
    translate = vi.fn();
    constructor() {
      made.geometries.push(this);
    }
  }
  class Material {
    dispose = vi.fn();
    constructor(readonly params: Record<string, unknown> = {}) {
      made.materials.push(this);
    }
  }
  class Light extends Object3D {
    dispose = vi.fn();
    constructor(readonly args: unknown[]) {
      super();
      made.lights.push(this);
    }
  }
  return {
    ColorManagement: { enabled: true },
    SRGBColorSpace: "srgb",
    Vector2: class {
      constructor(
        readonly x: number,
        readonly y: number,
      ) {}
    },
    Shape: class {
      moveTo = vi.fn();
      lineTo = vi.fn();
      quadraticCurveTo = vi.fn();
    },
    ExtrudeGeometry: Geometry,
    LatheGeometry: Geometry,
    PlaneGeometry: Geometry,
    MeshBasicMaterial: Material,
    MeshPhysicalMaterial: Material,
    Group: Object3D,
    Mesh: class extends Object3D {
      constructor(
        readonly geometry: unknown,
        readonly material: unknown,
      ) {
        super();
      }
    },
    CanvasTexture: class {
      colorSpace = "";
      anisotropy = 1;
      dispose = vi.fn();
      constructor(readonly image: unknown) {
        made.textures.push(this);
      }
    },
    AmbientLight: class extends Light {
      constructor(...args: unknown[]) {
        super(args);
      }
    },
    HemisphereLight: class extends Light {
      constructor(...args: unknown[]) {
        super(args);
      }
    },
    DirectionalLight: class extends Light {
      constructor(...args: unknown[]) {
        super(args);
      }
    },
    Scene: class extends Object3D {
      clear = vi.fn(() => {
        this.children = [];
      });
      constructor() {
        super();
        made.scenes.push(this);
      }
    },
    PerspectiveCamera: class extends Object3D {
      aspect = 1;
      updateProjectionMatrix = vi.fn();
    },
    WebGLRenderer: class {
      outputColorSpace = "";
      capabilities = { getMaxAnisotropy: () => 8 };
      setPixelRatio = vi.fn();
      setClearColor = vi.fn();
      setSize = vi.fn();
      render = vi.fn();
      dispose = vi.fn();
      forceContextLoss = vi.fn();
      constructor(readonly options: unknown) {
        made.renderers.push(this);
      }
    },
  };
});

const { ColorManagement } = await import("three");
const { SCENE_TOKENS } = await import("@/components/three/palette");
const {
  AT_REST,
  CAMERA,
  createScene,
  depthOf,
  exitOf,
  frameFor,
  mix,
  partOf,
  pointerEase,
  poseOf,
  STOP_AT,
} = await import("@/components/three/scene");
const { capsulePlacements, slabSpecs, unitFor, MOBILE_UNIT } =
  await import("@/components/three/slabs");
const { drawScreen, textureSize } = await import("@/components/three/textures");
const { condensedOffsets } = await import("@/components/sections/home/HeroWordmark");

// Opaque stand-ins for the token values: the scene never parses them.
const colors = Object.fromEntries(SCENE_TOKENS.map((name) => [name, `token:${name}`])) as Record<
  (typeof SCENE_TOKENS)[number],
  string
>; // built from SCENE_TOKENS, so every key is present

/** A 2D context that records every fill colour. */
function recordingPen() {
  const fills: string[] = [];
  const pen = {
    beginPath: vi.fn(),
    moveTo: vi.fn(),
    arcTo: vi.fn(),
    arc: vi.fn(),
    closePath: vi.fn(),
    fillRect: vi.fn(),
    save: vi.fn(),
    restore: vi.fn(),
    clip: vi.fn(),
    fill: vi.fn(() => {
      fills.push(String(pen.fillStyle));
    }),
    fillStyle: "",
  };
  return { pen, fills };
}

function canvasStub(withContext = true) {
  return () => {
    const { pen } = recordingPen();
    // Only getContext("2d") is used by the texture code.
    return { getContext: () => (withContext ? pen : null) } as unknown as HTMLCanvasElement;
  };
}

beforeEach(() => {
  for (const list of Object.values(made)) list.length = 0;
});

// ---------- maths ----------

describe("placement maths", () => {
  it("mixes linearly", () => {
    expect(mix(2, 6, 0)).toBe(2);
    expect(mix(2, 6, 0.5)).toBe(4);
    expect(mix(2, 6, 1)).toBe(6);
  });

  it("measures the visible half-size at the origin for a 35° camera 12 units away", () => {
    const { halfH, halfW } = frameFor(16 / 10);
    expect(halfH).toBeCloseTo(Math.tan((17.5 * Math.PI) / 180) * 12, 10);
    expect(halfW).toBeCloseTo(halfH * 1.6, 10);
    expect(CAMERA).toMatchObject({ fov: 35, z: 12 });
  });

  it("parts with the hero (×0.45) and the manifesto (×0.75), capped at 1", () => {
    expect(partOf({ p1: 0, p2: 0, p3: 0 })).toBe(0);
    expect(partOf({ p1: 1, p2: 0, p3: 0 })).toBeCloseTo(0.45, 10);
    expect(partOf({ p1: 0, p2: 1, p3: 0 })).toBeCloseTo(0.75, 10);
    expect(partOf({ p1: 1, p2: 1, p3: 0 })).toBe(1);
    expect(partOf({ p1: 0, p2: 0, p3: 1 })).toBe(0);
  });

  it("exits with the dusk only, and stops near its end", () => {
    expect(exitOf({ p1: 1, p2: 1, p3: 0 })).toBe(0);
    expect(exitOf({ p1: 0, p2: 0, p3: 0.6 })).toBe(0.6);
    expect(STOP_AT).toBe(0.98);
  });

  it("weights depth from 1 at z = -4", () => {
    expect(depthOf(-4)).toBe(1);
    expect(depthOf(0)).toBe(2);
    expect(depthOf(-2)).toBe(1.5);
  });

  const frame = { halfW: 10, halfH: 5 };
  const placement = { nx: 0.5, ny: -0.4, z: -2, rx: 0.1, ry: 0.2, rz: 0.3 };
  const still = { x: 0, y: 0 };

  it("rests at fractions of the visible half-size, with the idle float at t = 0", () => {
    const pose = poseOf(placement, 1.7, 0, 0, 0, still, frame);
    expect(pose.position[0]).toBeCloseTo(0.5 * 10 * 0.86, 10);
    expect(pose.position[1]).toBeCloseTo(-0.4 * 5 * 0.86 + Math.sin(1.7) * 0.08, 10);
    expect(pose.position[2]).toBe(-2);
    expect(pose.rotation[0]).toBeCloseTo(0.1 + Math.sin(1.7) * 0.05, 10);
    expect(pose.rotation[1]).toBeCloseTo(0.2, 10);
    expect(pose.rotation[2]).toBeCloseTo(0.3 + Math.cos(1.7) * 0.03, 10);
  });

  it("parts outwards, lifts and recedes", () => {
    const rest = poseOf(placement, 0, 0, 0, 0, still, frame);
    const parted = poseOf(placement, 0, 0, 1, 0, still, frame);
    expect(parted.position[0]).toBeCloseTo(rest.position[0] * 1.55, 10);
    expect(parted.position[1]).toBeCloseTo((rest.position[1] - 0) * 1.2 + 5 * 0.12, 10);
    expect(parted.position[2]).toBeCloseTo(-2 - 1.6, 10);
    expect(parted.rotation[0] - rest.rotation[0]).toBeCloseTo(0.25, 10);
    expect(parted.rotation[1] - rest.rotation[1]).toBeCloseTo(0.35, 10);
  });

  it("flies up by 2.8 half-heights per unit of depth on exit", () => {
    const rest = poseOf(placement, 0, 0, 0, 0, still, frame);
    const gone = poseOf(placement, 0, 0, 0, 1, still, frame);
    expect(gone.position[1] - rest.position[1]).toBeCloseTo(5 * 2.8 * depthOf(-2), 10);
  });

  it("follows the pointer more when nearer", () => {
    const near = { ...placement, z: 0 };
    const far = { ...placement, z: -4 };
    const pointer = { x: 1, y: 1 };
    const dx = (p: typeof placement) =>
      poseOf(p, 0, 0, 0, 0, pointer, frame).position[0] -
      poseOf(p, 0, 0, 0, 0, still, frame).position[0];
    expect(dx(far)).toBeCloseTo(0.22, 10);
    expect(dx(near)).toBeCloseTo(0.44, 10);
  });

  it("smooths the pointer by 0.06 per 60 fps frame, independent of the frame rate", () => {
    expect(pointerEase(1)).toBeCloseTo(0.06, 10);
    expect(pointerEase(2)).toBeCloseTo(1 - 0.94 * 0.94, 10);
    expect(pointerEase(0)).toBe(0);
  });

  it("rests with nothing parted or flown", () => {
    expect(AT_REST).toEqual({ p1: 0, p2: 0, p3: 0 });
  });
});

describe("mobile and desktop specs", () => {
  it("has six slabs on desktop and four at 60 % on mobile", () => {
    expect(slabSpecs(false).map((s) => s.kind)).toEqual([
      "agenda",
      "patient",
      "chart",
      "invoice",
      "ai",
      "calendar",
    ]);
    expect(slabSpecs(true).map((s) => s.kind)).toEqual(["agenda", "patient", "ai", "chart"]);
    expect(unitFor(false)).toBe(1);
    expect(unitFor(true)).toBe(MOBILE_UNIT);
    expect(MOBILE_UNIT).toBe(0.6);
  });

  it("keeps every slab inside the visible half-size", () => {
    for (const s of [...slabSpecs(false), ...slabSpecs(true)]) {
      expect(Math.abs(s.nx)).toBeLessThanOrEqual(1);
      expect(Math.abs(s.ny)).toBeLessThanOrEqual(1);
    }
  });

  it("moves the capsules on mobile", () => {
    expect(capsulePlacements(false).blue).toMatchObject({ nx: 0.95, ny: -0.42 });
    expect(capsulePlacements(true).blue).toMatchObject({ nx: 0.8, ny: 0.05 });
    expect(capsulePlacements(false).warm).toMatchObject({ nx: -0.96, ny: 0.12 });
    expect(capsulePlacements(true).warm).toMatchObject({ nx: -0.82, ny: 0.9 });
  });
});

describe("screen textures", () => {
  it("are 640 px wide with the slab's aspect ratio", () => {
    expect(textureSize(2.7, 1.75)).toEqual({ width: 640, height: 415 });
    expect(textureSize(1.7, 2.2)).toEqual({ width: 640, height: 828 });
  });

  it("paint only with token colours", () => {
    const allowed = new Set(Object.values(colors));
    for (const kind of ["agenda", "patient", "chart", "invoice", "ai", "calendar"] as const) {
      const { pen, fills } = recordingPen();
      drawScreen(pen, kind, 640, 415, colors);
      expect(fills.length, kind).toBeGreaterThan(5);
      for (const fill of fills) expect(allowed.has(fill), `${kind}: ${fill}`).toBe(true);
      expect(pen.save).toHaveBeenCalledTimes(1);
      expect(pen.restore).toHaveBeenCalledTimes(1);
    }
  });
});

// ---------- the scene and its disposal ----------

describe("createScene", () => {
  const options = (mobile: boolean, withContext = true) => ({
    canvas: {} as HTMLCanvasElement, // handed to the mocked renderer only
    colors,
    mobile,
    pixelRatio: 3,
    makeCanvas: canvasStub(withContext),
  });

  it("keeps the prototype's colours (no colour management) and caps the pixel ratio", () => {
    ColorManagement.enabled = true;
    createScene(options(false));
    expect(ColorManagement.enabled).toBe(false);
    const renderer = made.renderers[0] as unknown as { setPixelRatio: ReturnType<typeof vi.fn> };
    expect(renderer.setPixelRatio).toHaveBeenCalledWith(1.75);
  });

  it("builds six slabs and two capsules on desktop, four slabs on mobile", () => {
    createScene(options(false));
    // Each slab: a body and a screen face; plus two capsules.
    expect(made.geometries).toHaveLength(6 * 2 + 2);
    expect(made.textures).toHaveLength(6);
    expect(made.lights).toHaveLength(4);
    for (const list of Object.values(made)) list.length = 0;
    createScene(options(true));
    expect(made.geometries).toHaveLength(4 * 2 + 2);
    expect(made.textures).toHaveLength(4);
  });

  it("disposes every geometry, material, texture and light, then the renderer and its context", () => {
    const scene = createScene(options(false));
    scene.size(1440, 900);
    scene.render(1, AT_REST);
    const [renderer] = made.renderers;
    if (!renderer) throw new Error("no renderer");
    expect(renderer.render).toHaveBeenCalledTimes(1);

    scene.dispose();
    for (const list of [made.geometries, made.materials, made.textures, made.lights]) {
      expect(list.length).toBeGreaterThan(0);
      for (const item of list) expect(item.dispose).toHaveBeenCalledTimes(1);
    }
    expect(made.materials).toHaveLength(1 + 6 + 2);
    expect(renderer.dispose).toHaveBeenCalledTimes(1);
    expect(renderer.forceContextLoss).toHaveBeenCalledTimes(1);
    expect(made.scenes[0]?.clear).toHaveBeenCalledTimes(1);

    // Disposing twice frees nothing twice; a late frame or resize does nothing.
    scene.dispose();
    scene.render(2, AT_REST);
    scene.renderStatic();
    scene.size(800, 600);
    expect(renderer.dispose).toHaveBeenCalledTimes(1);
    expect(renderer.forceContextLoss).toHaveBeenCalledTimes(1);
    expect(renderer.render).toHaveBeenCalledTimes(1);
    expect(renderer.setSize).toHaveBeenCalledTimes(1);
    for (const item of made.geometries) expect(item.dispose).toHaveBeenCalledTimes(1);
  });

  it("releases the renderer and rethrows when the textures cannot be drawn", () => {
    expect(() => createScene(options(false, false))).toThrow(/2D context/);
    const [renderer] = made.renderers;
    expect(renderer?.dispose).toHaveBeenCalledTimes(1);
    expect(renderer?.forceContextLoss).toHaveBeenCalledTimes(1);
  });

  it("ignores an empty size (a hidden layer)", () => {
    const scene = createScene(options(false));
    scene.size(0, 900);
    expect(made.renderers[0]?.setSize).not.toHaveBeenCalled();
  });
});

describe("hero wordmark offsets", () => {
  it("puts each letter box where it starts in the condensed word", () => {
    // Rest widths 2, 3, 4; condensed 1, 2, 3: starts 0, 2, 5 at rest and 0, 1, 3 condensed.
    expect(condensedOffsets([2, 3, 4], [1, 2, 3])).toEqual([0, -1, -2]);
    expect(condensedOffsets([], [])).toEqual([]);
    expect(condensedOffsets([1, 1], [1, 1])).toEqual([0, 0]);
  });
});
