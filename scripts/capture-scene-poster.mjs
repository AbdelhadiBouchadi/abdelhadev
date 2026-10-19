// Renders the home scene's resting composition as WebP posters (desktop and mobile), shown without
// WebGL, when the scene fails and without JavaScript. A dev tool, not part of CI.
//
// Usage: pnpm build && pnpm start, then node scripts/capture-scene-poster.mjs [baseURL]
import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { chromium } from "@playwright/test";

const BASE = process.argv[2] ?? "http://localhost:3000";
const OUT = resolve(import.meta.dirname, "../public/media");
/** The poster sits behind the page, so a soft image is fine and keeps it small. */
const QUALITY = 0.72;

const SHOTS = [
  { name: "scene-poster-desktop", viewport: { width: 1440, height: 900 }, scale: 1 },
  { name: "scene-poster-mobile", viewport: { width: 390, height: 844 }, scale: 2 },
];

mkdirSync(OUT, { recursive: true });
const browser = await chromium.launch();
try {
  for (const shot of SHOTS) {
    const context = await browser.newContext({
      viewport: shot.viewport,
      deviceScaleFactor: shot.scale,
      reducedMotion: "reduce",
    });
    const page = await context.newPage();
    await page.goto(`${BASE}/fr`);
    await page.waitForSelector('[data-scene="still"]', { timeout: 30_000 });
    // Only the canvas stays visible, on a transparent page.
    await page.addStyleTag({
      content: `html, body, main, section, [data-tone] { background: transparent !important; }
        body * { visibility: hidden !important; }
        .scene-canvas { visibility: visible !important; }`,
    });
    await page.waitForTimeout(300);
    const png = await page.screenshot({ omitBackground: true, type: "png" });
    const webp = await page.evaluate(
      async ({ data, quality }) => {
        const image = new Image();
        image.src = `data:image/png;base64,${data}`;
        await image.decode();
        const canvas = document.createElement("canvas");
        canvas.width = image.naturalWidth;
        canvas.height = image.naturalHeight;
        canvas.getContext("2d")?.drawImage(image, 0, 0);
        return canvas.toDataURL("image/webp", quality).split(",")[1] ?? "";
      },
      { data: png.toString("base64"), quality: QUALITY },
    );
    const bytes = Buffer.from(webp, "base64");
    writeFileSync(resolve(OUT, `${shot.name}.webp`), bytes);
    console.log(
      `${shot.name}.webp  ${String(shot.viewport.width * shot.scale)}x${String(shot.viewport.height * shot.scale)}  ${(bytes.length / 1024).toFixed(1)} KiB`,
    );
    await context.close();
  }
} finally {
  await browser.close();
}
