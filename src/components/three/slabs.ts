/* The floating objects of the home scene (prototype createScene): extruded slabs with round corners carrying
   a screen texture, and two capsules (Majorelle and glow). Six slabs on desktop; four at 60 %
   scale on mobile. Positions are fractions of the visible half-width (nx) and half-height (ny),
   so the composition holds at every aspect ratio. */
import {
  ExtrudeGeometry,
  Group,
  LatheGeometry,
  Mesh,
  MeshBasicMaterial,
  MeshPhysicalMaterial,
  PlaneGeometry,
  Shape,
  Vector2,
  type BufferGeometry,
  type Material,
  type Object3D,
  type Texture,
} from "three";
import type { SceneColors } from "@/components/three/palette";
import { createScreenTexture, type MakeCanvas, type ScreenKind } from "@/components/three/textures";

/** Where an object rests: fractions of the visible half-size, depth, and rotation in radians. */
export interface Placement {
  nx: number;
  ny: number;
  z: number;
  rx: number;
  ry: number;
  rz: number;
}

export interface SlabSpec extends Placement {
  kind: ScreenKind;
  /** Width and height in world units, before the mobile scale. */
  w: number;
  h: number;
}

const DESKTOP: readonly SlabSpec[] = [
  { kind: "agenda", w: 2.7, h: 1.75, nx: -0.78, ny: 0.5, z: -1.0, rx: -0.12, ry: 0.38, rz: -0.05 },
  { kind: "patient", w: 1.7, h: 2.2, nx: 0.8, ny: 0.42, z: -0.4, rx: 0.1, ry: -0.42, rz: 0.05 },
  { kind: "chart", w: 2.2, h: 1.5, nx: -0.6, ny: -0.12, z: -2.2, rx: 0.18, ry: 0.3, rz: 0.04 },
  { kind: "invoice", w: 1.5, h: 1.95, nx: 0.6, ny: -0.1, z: -2.0, rx: -0.1, ry: -0.32, rz: -0.05 },
  { kind: "ai", w: 1.9, h: 1.45, nx: 0.12, ny: 0.86, z: -2.8, rx: 0.25, ry: 0.08, rz: 0.0 },
  { kind: "calendar", w: 1.7, h: 1.5, nx: -0.2, ny: 0.3, z: -4.2, rx: -0.2, ry: -0.15, rz: 0.03 },
];

const MOBILE: readonly SlabSpec[] = [
  { kind: "agenda", w: 2.7, h: 1.75, nx: -0.55, ny: 0.62, z: -1.2, rx: -0.12, ry: 0.38, rz: -0.05 },
  { kind: "patient", w: 1.7, h: 2.2, nx: 0.62, ny: 0.38, z: -0.8, rx: 0.1, ry: -0.42, rz: 0.05 },
  { kind: "ai", w: 1.9, h: 1.45, nx: 0.35, ny: 0.86, z: -2.6, rx: 0.25, ry: 0.08, rz: 0.0 },
  { kind: "chart", w: 2.2, h: 1.5, nx: -0.4, ny: 0.18, z: -3.4, rx: 0.18, ry: 0.3, rz: 0.04 },
];

/** Mobile objects are drawn at 60 % of their size. */
export const MOBILE_UNIT = 0.6;

export function slabSpecs(mobile: boolean): readonly SlabSpec[] {
  return mobile ? MOBILE : DESKTOP;
}

export function unitFor(mobile: boolean): number {
  return mobile ? MOBILE_UNIT : 1;
}

/** The two capsules: the Majorelle one front right, the glow one front left. */
export function capsulePlacements(mobile: boolean): { blue: Placement; warm: Placement } {
  return {
    blue: { nx: mobile ? 0.8 : 0.95, ny: mobile ? 0.05 : -0.42, z: 1.2, rx: 0.4, ry: 0, rz: 0.9 },
    warm: {
      nx: mobile ? -0.82 : -0.96,
      ny: mobile ? 0.9 : 0.12,
      z: 0.9,
      rx: -0.3,
      ry: 0,
      rz: -0.6,
    },
  };
}

/** A rectangle with round corners, centred on the origin (prototype roundedShape). */
export function roundedShape(w: number, h: number, r: number): Shape {
  const s = new Shape();
  const x = -w / 2;
  const y = -h / 2;
  s.moveTo(x + r, y);
  s.lineTo(x + w - r, y);
  s.quadraticCurveTo(x + w, y, x + w, y + r);
  s.lineTo(x + w, y + h - r);
  s.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  s.lineTo(x + r, y + h);
  s.quadraticCurveTo(x, y + h, x, y + h - r);
  s.lineTo(x, y + r);
  s.quadraticCurveTo(x, y, x + r, y);
  return s;
}

/** The profile of a capsule of radius `r` and straight length `len`, for a LatheGeometry. */
export function capsuleProfile(r: number, len: number, segments = 14): Vector2[] {
  const points: Vector2[] = [];
  for (let i = 0; i <= segments; i++) {
    const a = -Math.PI / 2 + (i / segments) * (Math.PI / 2);
    points.push(new Vector2(Math.cos(a) * r, Math.sin(a) * r - len / 2));
  }
  for (let i = 0; i <= segments; i++) {
    const a = (i / segments) * (Math.PI / 2);
    points.push(new Vector2(Math.cos(a) * r, Math.sin(a) * r + len / 2));
  }
  return points;
}

/** One object of the scene and the phase of its idle float. */
export interface SceneItem {
  object: Object3D;
  placement: Placement;
  phase: number;
}

/** Everything the slabs created that holds GPU memory, for disposal. */
export interface Owned {
  geometries: BufferGeometry[];
  materials: Material[];
  textures: Texture[];
}

export interface BuildOptions {
  mobile: boolean;
  colors: SceneColors;
  makeCanvas: MakeCanvas;
  anisotropy: number;
}

/** Builds the slabs and capsules. Returns the items to place each frame and what to dispose. */
export function buildObjects({ mobile, colors, makeCanvas, anisotropy }: BuildOptions): {
  items: SceneItem[];
  owned: Owned;
} {
  const unit = unitFor(mobile);
  const owned: Owned = { geometries: [], materials: [], textures: [] };
  const items: SceneItem[] = [];

  const slabMaterial = new MeshPhysicalMaterial({
    color: colors["scene-slab"],
    roughness: 0.36,
    metalness: 0,
    clearcoat: 1,
    clearcoatRoughness: 0.16,
  });
  owned.materials.push(slabMaterial);

  slabSpecs(mobile).forEach((spec, i) => {
    const w = spec.w * unit;
    const h = spec.h * unit;
    const group = new Group();
    const body = new ExtrudeGeometry(roundedShape(w, h, 0.2 * unit), {
      depth: 0.1 * unit,
      bevelEnabled: true,
      bevelThickness: 0.06 * unit,
      bevelSize: 0.06 * unit,
      bevelSegments: 6,
      curveSegments: 10,
    });
    body.translate(0, 0, -0.05 * unit);
    group.add(new Mesh(body, slabMaterial));

    const texture = createScreenTexture(spec.kind, w, h, colors, makeCanvas, anisotropy);
    const face = new PlaneGeometry(w - 0.16 * unit, h - 0.16 * unit);
    const faceMaterial = new MeshBasicMaterial({ map: texture, transparent: true });
    const screen = new Mesh(face, faceMaterial);
    screen.position.z = 0.112 * unit;
    group.add(screen);

    owned.geometries.push(body, face);
    owned.materials.push(faceMaterial);
    owned.textures.push(texture);
    items.push({ object: group, placement: spec, phase: i * 1.7 });
  });

  const { blue, warm } = capsulePlacements(mobile);
  const capsules = [
    {
      placement: blue,
      phase: 3.1,
      geometry: new LatheGeometry(capsuleProfile(0.17 * unit, 0.42 * unit), 36),
      material: new MeshPhysicalMaterial({
        color: colors.majorelle,
        roughness: 0.28,
        clearcoat: 1,
        clearcoatRoughness: 0.12,
      }),
    },
    {
      placement: warm,
      phase: 5.3,
      geometry: new LatheGeometry(capsuleProfile(0.15 * unit, 0.34 * unit), 36),
      material: new MeshPhysicalMaterial({
        color: colors.glow,
        roughness: 0.3,
        clearcoat: 1,
        clearcoatRoughness: 0.14,
      }),
    },
  ];
  for (const { placement, phase, geometry, material } of capsules) {
    owned.geometries.push(geometry);
    owned.materials.push(material);
    items.push({ object: new Mesh(geometry, material), placement, phase });
  }

  return { items, owned };
}
