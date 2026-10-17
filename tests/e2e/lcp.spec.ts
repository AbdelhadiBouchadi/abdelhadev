// LCP probe (spike S3 method, decision T7): a PerformanceObserver records every
// largest-contentful-paint entry on the mobile profile (390 px, 150 ms RTT, 1.6 Mbps, CPU 4x).
// It writes the numbers to test-results/shell/lcp.json and asserts only that a value exists and
// stays under the loader ceiling plus 1 s: budgets are the owner's (docs/baseline.md). It records
// when the overlay is gone on this profile (loaderOffMs); it does not gate on it, because on a
// 4x-throttled CPU that time follows the end of hydration, which follows the host machine
// (docs/spikes/tbt.md). The 5 s rule is asserted unthrottled in loader.spec.ts.
import { mkdirSync, writeFileSync } from "node:fs";
import { expect, test, type BrowserContext, type Page } from "@playwright/test";
import { LOADER } from "@/lib/motion";
import { loaderRecord, recordLoader, shellIdle } from "./shell-helpers";

const LIMIT_MS = LOADER.ceilingMs + 1000;

interface Entry {
  t: number;
  tag: string;
  text: string;
}

async function throttle(context: BrowserContext, page: Page) {
  const cdp = await context.newCDPSession(page);
  await cdp.send("Network.enable");
  await cdp.send("Network.emulateNetworkConditions", {
    offline: false,
    latency: 150,
    downloadThroughput: (1.6 * 1024 * 1024) / 8,
    uploadThroughput: (750 * 1024) / 8,
  });
  await cdp.send("Emulation.setCPUThrottlingRate", { rate: 4 });
}

async function observeLcp(page: Page) {
  await page.addInitScript(() => {
    const entries: { t: number; tag: string; text: string }[] = [];
    (window as unknown as { __lcp: typeof entries }).__lcp = entries;
    new PerformanceObserver((list) => {
      for (const e of list.getEntries() as (PerformanceEntry & { element?: Element | null })[]) {
        entries.push({
          t: Math.round(e.startTime),
          tag: e.element?.tagName ?? "",
          text: (e.element?.textContent ?? "").trim().slice(0, 60),
        });
      }
    }).observe({ type: "largest-contentful-paint", buffered: true });
  });
}

const lcp = (page: Page) => page.evaluate(() => (window as unknown as { __lcp: Entry[] }).__lcp);

test("LCP on a first visit and on a visited load, mobile profile", async ({ browser }, info) => {
  test.skip(info.project.name !== "390", "measured once, on the mobile profile");
  test.setTimeout(90_000);
  const results: Record<string, unknown> = {
    measured: new Date().toISOString(),
    profile: "390x844, 150 ms RTT, 1.6 Mbps down, CPU 4x (CDP), production build on localhost",
  };

  for (const variant of ["firstVisit", "visitedLoad"] as const) {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
    const page = await context.newPage();
    if (variant === "visitedLoad") {
      await page.addInitScript(() => sessionStorage.setItem("abd-visited", "1"));
    }
    await observeLcp(page);
    await recordLoader(page);
    await throttle(context, page);
    await page.goto("/fr");
    await shellIdle(page, 20_000);
    const entries = await lcp(page);
    const loader = await loaderRecord(page);
    const final = entries.at(-1);
    results[variant] = { final, entries, loaderReadyMs: loader.ready, loaderOffMs: loader.off };

    expect(final, `${variant}: an LCP entry exists`).toBeDefined();
    expect(final?.t ?? Infinity).toBeLessThan(LIMIT_MS);

    if (variant === "visitedLoad") {
      // A client-side route change: Chrome reports no LCP for soft navigations, so this records
      // only whether any new entry appears.
      const before = entries.length;
      await page.locator("nav.pill").getByRole("link", { name: "Projets" }).click();
      // The curtain runs on a 4x slower CPU here.
      await expect(page).toHaveURL(/\/fr\/projets$/, { timeout: 20_000 });
      await shellIdle(page, 20_000);
      results.routeChange = {
        newEntries: (await lcp(page)).slice(before),
        note: "LCP is not reported for client-side (soft) navigations; the arriving page is painted under the curtain like the first load.",
      };
    }
    await context.close();
  }

  mkdirSync("test-results/shell", { recursive: true });
  writeFileSync("test-results/shell/lcp.json", `${JSON.stringify(results, null, 2)}\n`);
});
