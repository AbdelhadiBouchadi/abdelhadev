// Short videos and end-state screenshots in test-results/motion/, to compare with docs/prototype.
import type { Browser, BrowserContextOptions, Page } from "@playwright/test";

export const MOTION_OUT = "test-results/motion";
export const DESKTOP = { width: 1440, height: 900 };
export const PHONE = { width: 390, height: 844 };

/** Saves `<name>.webm` and `<name>.png`. */
export async function record(
  browser: Browser,
  name: string,
  size: { width: number; height: number },
  run: (page: Page) => Promise<void>,
  {
    visitedSession = true,
    phone = false,
    context: extra = {},
    before,
  }: {
    visitedSession?: boolean;
    phone?: boolean;
    context?: BrowserContextOptions;
    before?: (page: Page) => Promise<void>;
  } = {},
): Promise<void> {
  const options: BrowserContextOptions = {
    viewport: size,
    recordVideo: { dir: `${MOTION_OUT}/raw`, size },
    ...(phone ? { isMobile: true, hasTouch: true, deviceScaleFactor: 2 } : {}),
    ...extra,
  };
  const context = await browser.newContext(options);
  const page = await context.newPage();
  if (visitedSession) await page.addInitScript(() => sessionStorage.setItem("abd-visited", "1"));
  await before?.(page);
  await run(page);
  await page.screenshot({ path: `${MOTION_OUT}/${name}.png` });
  await context.close();
  await page.video()?.saveAs(`${MOTION_OUT}/${name}.webm`);
}

/** Wheel scroll through Lenis, in steps, so the video shows the motion. */
export async function wheel(page: Page, dy: number, steps = 12): Promise<void> {
  for (let i = 0; i < steps; i++) {
    await page.mouse.wheel(0, dy / steps);
    await page.waitForTimeout(60);
  }
  await page.waitForTimeout(700);
}
