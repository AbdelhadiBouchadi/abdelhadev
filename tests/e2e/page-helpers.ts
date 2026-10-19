import type { Locator, Page } from "@playwright/test";
import { scrollToY } from "./shell-helpers";

/** Counted through the DevTools protocol (Runtime.queryObjects): GSAP keeps its globals private,
    so live ScrollTriggers are found by their shape. A killed trigger is disabled. */
export async function liveScrollTriggers(page: Page): Promise<number> {
  const cdp = await page.context().newCDPSession(page);
  try {
    const { result: proto } = await cdp.send("Runtime.evaluate", {
      expression: "Object.prototype",
    });
    if (!proto.objectId) throw new Error("no Object.prototype handle");
    const { objects } = await cdp.send("Runtime.queryObjects", {
      prototypeObjectId: proto.objectId,
    });
    if (!objects.objectId) throw new Error("queryObjects returned no array");
    const { result } = await cdp.send("Runtime.callFunctionOn", {
      objectId: objects.objectId,
      returnByValue: true,
      functionDeclaration: `function () {
        return this.filter((o) => {
          try {
            return o && typeof o.getVelocity === "function" && typeof o.kill === "function" &&
              typeof o.refresh === "function" && o.enabled === true;
          } catch { return false; }
        }).length;
      }`,
    });
    return Number(result.value);
  } finally {
    await cdp.detach();
  }
}

export function collectErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on("console", (m) => {
    if (m.type() === "error") errors.push(m.text());
  });
  page.on("pageerror", (e) => errors.push(e.message));
  return errors;
}

export const docTop = (locator: Locator) =>
  locator.evaluate((el) => el.getBoundingClientRect().top + window.scrollY);

/** `at` is a fraction of the viewport height from the top. */
export async function bring(page: Page, locator: Locator, at = 0.5): Promise<void> {
  const top = await docTop(locator);
  const vh = await page.evaluate(() => window.innerHeight);
  await scrollToY(page, Math.max(0, top - vh * at));
}

/** Every range on it has ended. */
export async function beyond(page: Page, locator: Locator): Promise<void> {
  const { top, height } = await locator.evaluate((el) => ({
    top: el.getBoundingClientRect().top + window.scrollY,
    height: el.getBoundingClientRect().height,
  }));
  await scrollToY(page, top + height + 10);
}

/** Its own opacity times its ancestors', so a word faded by its own tween or by a parent is
    caught alike. */
export function wordsLightOpacities(page: Page): Promise<number[]> {
  return page.evaluate(() => {
    const effective = (el: Element) => {
      let opacity = 1;
      for (let node: Element | null = el; node; node = node.parentElement) {
        opacity *= Number(getComputedStyle(node).opacity);
      }
      return opacity;
    };
    return [...document.querySelectorAll("[data-words-light]")].flatMap((statement) =>
      [statement, ...statement.querySelectorAll("*")].map(effective),
    );
  });
}
