// The app has no test-only switches: specs drive it the way a visitor does, through
// sessionStorage and the html classes.
import type { Page } from "@playwright/test";

/** Every load then plays the short loader. */
export async function visited(page: Page): Promise<void> {
  await page.addInitScript(() => {
    try {
      sessionStorage.setItem("abd-visited", "1");
    } catch {
      // Storage blocked: the full loader plays, which is slower but still correct.
    }
  });
}

export async function shellIdle(page: Page, timeout = 12_000): Promise<void> {
  try {
    await page.waitForFunction(
      () => {
        const html = document.documentElement;
        return (
          html.classList.contains("ready") &&
          html.classList.contains("loader-off") &&
          document.querySelector("[inert]") === null
        );
      },
      null,
      { timeout },
    );
  } catch (error) {
    // Say what the shell was doing, not only that it was not idle.
    const state = await page.evaluate(() => ({
      html: document.documentElement.className,
      inert: [...document.querySelectorAll("[inert]")].map((el) => el.tagName),
      loader: getComputedStyle(document.querySelector("[data-loader]") ?? document.body).display,
      count: document.querySelector("[data-loader-count]")?.textContent,
      t: Math.round(performance.now()),
    }));
    throw new Error(`shell not idle: ${JSON.stringify(state)}`, { cause: error });
  }
}

/** The horizon's transform changes only during the first-visit draw-in. */
export async function recordLoader(page: Page): Promise<void> {
  await page.addInitScript(() => {
    const marks: Record<string, number> = {};
    let horizonMoved = false;
    (window as unknown as { __loader: unknown }).__loader = {
      marks,
      horizonMoved: () => horizonMoved,
    };
    // The init script runs before <html> exists: observe the document node itself.
    new MutationObserver((records) => {
      const html = document.documentElement;
      for (const name of ["ready", "loader-off"]) {
        if (marks[name] === undefined && html.classList.contains(name)) {
          marks[name] = performance.now();
        }
      }
      for (const r of records) {
        if (
          r.attributeName !== "class" &&
          r.target instanceof Element &&
          r.target.matches("[data-horizon]")
        ) {
          horizonMoved = true;
        }
      }
    }).observe(document, {
      attributes: true,
      subtree: true,
      attributeFilter: ["class", "transform", "style"],
    });
  });
}

export interface LoaderRecord {
  ready?: number;
  off?: number;
  horizonMoved: boolean;
}

export async function loaderRecord(page: Page): Promise<LoaderRecord> {
  return page.evaluate(() => {
    const rec = (
      window as unknown as {
        __loader: { marks: Record<string, number>; horizonMoved: () => boolean };
      }
    ).__loader;
    return {
      ready: rec.marks.ready,
      off: rec.marks["loader-off"],
      horizonMoved: rec.horizonMoved(),
    };
  });
}

/** Lenis follows native scroll. */
export async function scrollToY(page: Page, y: number): Promise<void> {
  await page.evaluate((top) => {
    window.scrollTo({ top, behavior: "instant" });
  }, y);
}

/** Tone colours take 0.6 s. Scroll-driven animations (the about deck) run for as long as they
    exist, so only those on the document's clock are waited for. */
export async function transitionsSettled(page: Page): Promise<void> {
  await page.waitForFunction(() =>
    document
      .getAnimations()
      .every((a) => a.playState !== "running" || !(a.timeline instanceof DocumentTimeline)),
  );
}
