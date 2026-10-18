/* The screens on the slabs: small product UIs drawn on a 2D canvas and uploaded as textures
   (prototype screenTexture). Six kinds: agenda, patient record, chart, invoice, AI chat, calendar.
   Geometry is the prototype's, in canvas pixels; colours come from the tokens (palette.ts). */
import { CanvasTexture, SRGBColorSpace } from "three";
import type { SceneColors } from "@/components/three/palette";

export type ScreenKind = "agenda" | "patient" | "chart" | "invoice" | "ai" | "calendar";

/** Canvas width of every screen; the height follows the slab's aspect ratio. */
const WIDTH = 640;
const RADIUS = 34;
const BAR_HEIGHT = 58;
const TOP = 84;
const PAD = 30;

/** The 2D context calls drawScreen makes (a subset of CanvasRenderingContext2D, so tests can
    record them). */
export type Pen = Pick<
  CanvasRenderingContext2D,
  | "beginPath"
  | "moveTo"
  | "arcTo"
  | "arc"
  | "closePath"
  | "fill"
  | "fillRect"
  | "save"
  | "restore"
  | "clip"
> & { fillStyle: CanvasRenderingContext2D["fillStyle"] };

export function textureSize(w: number, h: number): { width: number; height: number } {
  return { width: WIDTH, height: Math.round((WIDTH * h) / w) };
}

function outline(x: Pen, left: number, top: number, w: number, h: number, r: number) {
  x.beginPath();
  x.moveTo(left + r, top);
  x.arcTo(left + w, top, left + w, top + h, r);
  x.arcTo(left + w, top + h, left, top + h, r);
  x.arcTo(left, top + h, left, top, r);
  x.arcTo(left, top, left + w, top, r);
  x.closePath();
}

/** A filled rectangle with round corners (prototype rr). */
function rr(x: Pen, left: number, top: number, w: number, h: number, r: number, fill: string) {
  outline(x, left, top, w, h, r);
  x.fillStyle = fill;
  x.fill();
}

function dot(x: Pen, cx: number, cy: number, r: number, fill: string) {
  x.fillStyle = fill;
  x.beginPath();
  x.arc(cx, cy, r, 0, Math.PI * 2);
  x.fill();
}

/** Draws one screen on a canvas of `cw` × `ch` pixels. */
export function drawScreen(x: Pen, kind: ScreenKind, cw: number, ch: number, c: SceneColors) {
  rr(x, 0, 0, cw, ch, RADIUS, c["scene-screen"]);
  x.save();
  outline(x, 0, 0, cw, ch, RADIUS);
  x.clip();
  x.fillStyle = c["scene-bar"];
  x.fillRect(0, 0, cw, BAR_HEIGHT);
  rr(x, 28, 21, 46, 16, 8, c.glow);
  rr(x, 88, 21, 90, 16, 8, c["scene-pill"]);
  rr(x, 190, 21, 70, 16, 8, c["scene-pill-soft"]);

  const iw = cw - PAD * 2;
  const ih = ch - TOP - PAD;
  const warm = [c.glow, c["majorelle-soft"], c["scene-cell-warm"], c["scene-cell"]] as const;

  switch (kind) {
    case "agenda": {
      for (let i = 0; i < 6; i++) rr(x, PAD, TOP + i * (ih / 6) + 6, 40, 10, 5, c["scene-label"]);
      const cols = 4;
      const gw = (iw - 60) / cols;
      for (let col = 0; col < cols; col++) {
        for (let row = 0; row < 6; row++) {
          const pick = (col * 7 + row * 3) % 9;
          const fill = pick < 2 ? warm[0] : pick < 3 ? warm[1] : pick < 4 ? warm[2] : warm[3];
          rr(x, PAD + 60 + col * gw, TOP + row * (ih / 6), gw - 10, ih / 6 - 10, 10, fill);
        }
      }
      break;
    }
    case "patient": {
      dot(x, PAD + 60, TOP + 60, 56, c["scene-line"]);
      rr(x, PAD + 140, TOP + 20, iw * 0.5, 16, 8, c["scene-line-dark"]);
      rr(x, PAD + 140, TOP + 52, iw * 0.34, 12, 6, c["scene-line"]);
      rr(x, PAD + 140, TOP + 78, iw * 0.42, 12, 6, c["scene-line"]);
      const tw = (iw - 7 * 10) / 8;
      for (let t = 0; t < 8; t++) {
        const fill = t === 2 || t === 5 ? c.glow : t === 6 ? c["majorelle-soft"] : c["scene-tile"];
        rr(x, PAD + t * (tw + 10), TOP + 150, tw, tw * 1.2, 10, fill);
      }
      break;
    }
    case "chart": {
      const bars = [0.35, 0.5, 0.42, 0.66, 0.58, 0.82, 0.74];
      const bw = iw / bars.length;
      bars.forEach((v, b) => {
        const bh = ih * v;
        rr(x, PAD + b * bw + 6, TOP + ih - bh, bw - 12, bh, 10, b === 5 ? c.majorelle : c.glow);
      });
      break;
    }
    case "invoice": {
      for (let l = 0; l < 4; l++) {
        rr(x, PAD, TOP + l * 44, iw * (0.4 + (l % 2) * 0.16), 13, 6, c["scene-line"]);
        rr(x, PAD + iw * 0.8, TOP + l * 44, iw * 0.2, 13, 6, c["scene-label"]);
      }
      rr(x, PAD + iw * 0.52, TOP + ih - 26, iw * 0.48, 22, 11, c.ink);
      break;
    }
    case "ai": {
      rr(x, PAD, TOP, iw * 0.62, 50, 22, c["scene-tile"]);
      rr(x, PAD + iw * 0.3, TOP + 70, iw * 0.7, 50, 22, c["majorelle-soft"]);
      rr(x, PAD, TOP + 140, iw * 0.5, 50, 22, c["scene-tile"]);
      for (let d = 0; d < 3; d++) dot(x, PAD + 26 + d * 22, TOP + 165, 7, c.glow);
      break;
    }
    case "calendar": {
      const cell = iw / 7;
      const rh = ih / 5;
      for (let row = 0; row < 5; row++) {
        for (let day = 0; day < 7; day++) {
          const n = row * 7 + day;
          const fill =
            n === 11 || n === 19 ? c.glow : n === 23 ? c["majorelle-soft"] : c["scene-cell"];
          rr(x, PAD + day * cell + 4, TOP + row * rh + 4, cell - 8, rh - 8, 8, fill);
        }
      }
      break;
    }
  }
  x.restore();
}

/** A 2D canvas to draw on (document.createElement("canvas") in the browser, a stub in tests). */
export type MakeCanvas = (width: number, height: number) => HTMLCanvasElement;

/** The screen of a `w` × `h` slab as a texture. Throws when no 2D context is available. */
export function createScreenTexture(
  kind: ScreenKind,
  w: number,
  h: number,
  colors: SceneColors,
  makeCanvas: MakeCanvas,
  anisotropy: number,
): CanvasTexture {
  const { width, height } = textureSize(w, h);
  const canvas = makeCanvas(width, height);
  const pen = canvas.getContext("2d");
  if (!pen) throw new Error("No 2D context for the scene textures");
  drawScreen(pen, kind, width, height, colors);
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  texture.anisotropy = anisotropy;
  return texture;
}
