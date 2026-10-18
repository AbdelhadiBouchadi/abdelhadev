/* The home 3D scene, plain three.js (decision T6), ported from the prototype's createScene
   (docs/prototype/assets/site.js). A factory with no React and no GSAP: HeroScene.tsx owns the
   loop, the observers and the lifecycle; this module builds the scene, places the objects for a
   given scroll progress, renders, and disposes everything it created.

   The placement maths is exported as pure functions so tests/unit can check it without WebGL. */
import {
  ColorManagement,
  PerspectiveCamera,
  Scene,
  SRGBColorSpace,
  WebGLRenderer,
  type Light,
} from "three";
import { addLights } from "@/components/three/lights";
import type { SceneColors } from "@/components/three/palette";
import { buildObjects, type Placement, type SceneItem } from "@/components/three/slabs";
import type { MakeCanvas } from "@/components/three/textures";
import type { SceneProgress } from "@/lib/scene-state";

// ---------- constants (prototype values) ----------

export const CAMERA = { fov: 35, z: 12, near: 0.1, far: 100 } as const;

/** The renderer never draws at more than this device pixel ratio. */
export const MAX_PIXEL_RATIO = 1.75;

/** The canvas stops rendering (and hides) once the dusk's p3 reaches this. */
export const STOP_AT = 0.98;

const LAYOUT = {
  /** Objects rest within 86 % of the visible half-size. */
  spread: 0.86,
  /** Parted: x spreads ×1.55, y ×1.2 and lifts by 12 % of the half-height, z recedes by 1.6. */
  partX: 1.55,
  partY: 1.2,
  partLift: 0.12,
  partZ: 1.6,
  /** How much each scroll beat parts the objects. */
  partFromHero: 0.45,
  partFromManifesto: 0.75,
  /** Exit: the objects fly up by 2.8 half-heights, weighted by depth. */
  exitY: 2.8,
  /** Parted objects tilt by these angles. */
  partRotX: 0.25,
  partRotY: 0.35,
} as const;

const MOTION = {
  /** Idle float: sin(t · 0.6) · 0.08. */
  floatSpeed: 0.6,
  floatAmount: 0.08,
  /** Idle wobble of the rotation. */
  wobbleX: { speed: 0.4, amount: 0.05 },
  wobbleZ: { speed: 0.3, amount: 0.03 },
  /** Pointer parallax, per unit of depth weight. */
  parallaxX: 0.22,
  parallaxY: 0.16,
  parallaxTurn: 0.12,
  /** Pointer smoothing per 60 fps frame. */
  pointerLerp: 0.06,
} as const;

// ---------- pure maths ----------

export interface Frame {
  halfW: number;
  halfH: number;
}

export interface Pointer {
  x: number;
  y: number;
}

export interface Pose {
  position: [number, number, number];
  rotation: [number, number, number];
}

export function mix(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

/** The visible half-size of the plane at the origin, for a camera at CAMERA.z. */
export function frameFor(aspect: number): Frame {
  const halfH = Math.tan(((CAMERA.fov / 2) * Math.PI) / 180) * CAMERA.z;
  return { halfH, halfW: halfH * aspect };
}

/** How far apart the objects are, in [0, 1]: the hero leaving and the manifesto scrolling. */
export function partOf(progress: Readonly<SceneProgress>): number {
  return Math.min(1, progress.p1 * LAYOUT.partFromHero + progress.p2 * LAYOUT.partFromManifesto);
}

/** How far up the objects have flown, in [0, 1]: the dusk. */
export function exitOf(progress: Readonly<SceneProgress>): number {
  return progress.p3;
}

/** Nearer objects move more with the pointer and fly up faster. */
export function depthOf(z: number): number {
  return 1 + (z + 4) * 0.25;
}

/** Where an object is at time `t` (seconds) for this progress and pointer. */
export function poseOf(
  placement: Placement,
  phase: number,
  t: number,
  part: number,
  exit: number,
  pointer: Pointer,
  frame: Frame,
): Pose {
  const depth = depthOf(placement.z);
  const ax = placement.nx * frame.halfW * LAYOUT.spread;
  const ay = placement.ny * frame.halfH * LAYOUT.spread;
  const bx = ax * LAYOUT.partX;
  const by = ay * LAYOUT.partY + frame.halfH * LAYOUT.partLift;
  return {
    position: [
      mix(ax, bx, part) + pointer.x * depth * MOTION.parallaxX,
      mix(ay, by, part) +
        exit * frame.halfH * LAYOUT.exitY * depth +
        Math.sin(t * MOTION.floatSpeed + phase) * MOTION.floatAmount +
        pointer.y * depth * MOTION.parallaxY,
      mix(placement.z, placement.z - LAYOUT.partZ, part),
    ],
    rotation: [
      placement.rx +
        Math.sin(t * MOTION.wobbleX.speed + phase) * MOTION.wobbleX.amount +
        part * LAYOUT.partRotX,
      placement.ry + pointer.x * MOTION.parallaxTurn + part * LAYOUT.partRotY,
      placement.rz + Math.cos(t * MOTION.wobbleZ.speed + phase) * MOTION.wobbleZ.amount,
    ],
  };
}

/** The smoothing factor for one frame lasting `deltaRatio` 60 fps frames (frame-rate independent). */
export function pointerEase(deltaRatio: number): number {
  return 1 - Math.pow(1 - MOTION.pointerLerp, Math.max(0, deltaRatio));
}

/** The resting composition: nothing parted, nothing flown, no pointer, t = 0 (renderStatic). */
export const AT_REST: Readonly<SceneProgress> = { p1: 0, p2: 0, p3: 0 };

// ---------- the scene ----------

export interface SceneOptions {
  canvas: HTMLCanvasElement;
  colors: SceneColors;
  mobile: boolean;
  pixelRatio: number;
  makeCanvas: MakeCanvas;
}

export interface SceneHandle {
  /** Sets the drawing buffer and the camera to a CSS size. */
  size: (width: number, height: number) => void;
  /** Aims the pointer parallax, in [-1, 1] on both axes (y up). */
  aim: (x: number, y: number) => void;
  /** Places every object and draws one frame. `deltaRatio` smooths the pointer. */
  render: (seconds: number, progress: Readonly<SceneProgress>, deltaRatio?: number) => void;
  /** Draws the resting composition (reduced motion, poster capture). */
  renderStatic: () => void;
  /** Frees geometries, materials, textures and the renderer, and releases the context. */
  dispose: () => void;
}

export function createScene({
  canvas,
  colors,
  mobile,
  pixelRatio,
  makeCanvas,
}: SceneOptions): SceneHandle {
  // The prototype ran three r128, which used colours as given (no sRGB to linear conversion of
  // material and light colours) and encoded the output to sRGB. Turning colour management off
  // keeps that look; textures are still decoded from sRGB and the output encoded to sRGB.
  ColorManagement.enabled = false;

  // Throws when WebGL is unavailable or the context cannot be created; the caller shows the poster.
  const renderer = new WebGLRenderer({
    canvas,
    antialias: true,
    alpha: true,
    powerPreference: "high-performance",
  });
  renderer.setPixelRatio(Math.min(pixelRatio, MAX_PIXEL_RATIO));
  renderer.outputColorSpace = SRGBColorSpace;
  renderer.setClearColor(0, 0);

  const scene = new Scene();
  const camera = new PerspectiveCamera(CAMERA.fov, 1, CAMERA.near, CAMERA.far);
  camera.position.set(0, 0, CAMERA.z);
  const lights: Light[] = addLights(scene, colors);

  let items: SceneItem[] = [];
  let owned: ReturnType<typeof buildObjects>["owned"] = {
    geometries: [],
    materials: [],
    textures: [],
  };
  try {
    ({ items, owned } = buildObjects({
      mobile,
      colors,
      makeCanvas,
      anisotropy: renderer.capabilities.getMaxAnisotropy(),
    }));
  } catch (error) {
    renderer.dispose();
    renderer.forceContextLoss();
    throw error;
  }
  for (const item of items) scene.add(item.object);

  let frame = frameFor(1);
  const pointer: Pointer = { x: 0, y: 0 };
  const target: Pointer = { x: 0, y: 0 };
  let disposed = false;

  function place(seconds: number, progress: Readonly<SceneProgress>) {
    const part = partOf(progress);
    const exit = exitOf(progress);
    for (const { object, placement, phase } of items) {
      const { position, rotation } = poseOf(placement, phase, seconds, part, exit, pointer, frame);
      object.position.set(...position);
      object.rotation.set(...rotation);
    }
  }

  return {
    size(width, height) {
      if (disposed || width <= 0 || height <= 0) return;
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      frame = frameFor(camera.aspect);
    },
    aim(x, y) {
      target.x = x;
      target.y = y;
    },
    render(seconds, progress, deltaRatio = 1) {
      if (disposed) return;
      const k = pointerEase(deltaRatio);
      pointer.x += (target.x - pointer.x) * k;
      pointer.y += (target.y - pointer.y) * k;
      place(seconds, progress);
      renderer.render(scene, camera);
    },
    renderStatic() {
      if (disposed) return;
      pointer.x = 0;
      pointer.y = 0;
      place(0, AT_REST);
      renderer.render(scene, camera);
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      for (const g of owned.geometries) g.dispose();
      for (const m of owned.materials) m.dispose();
      for (const t of owned.textures) t.dispose();
      for (const l of lights) l.dispose();
      scene.clear();
      renderer.dispose();
      renderer.forceContextLoss();
    },
  };
}
