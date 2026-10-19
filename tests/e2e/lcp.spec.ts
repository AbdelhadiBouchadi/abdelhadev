// Records every largest-contentful-paint entry on the mobile profile (390 px, 150 ms RTT,
// 1.6 Mbps, CPU 4x) to test-results/shell/lcp.json. It only asserts that a value exists and stays
// under the loader ceiling plus 1 s: the budgets live in docs/baseline.md. The overlay's end is
// recorded, not gated: on a 4x-throttled CPU it follows hydration, which follows the host machine.
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
          tag: `${e.element?.tagName ?? ""}${e.element?.className ? `.${String(e.element.className).split(" ")[0]}` : ""}`,
          text: (e.element?.textContent ?? "").trim().slice(0, 60),
        });
      }
    }).observe({ type: "largest-contentful-paint", buffered: true });
  });
}

const lcp = (page: Page) => page.evaluate(() => (window as unknown as { __lcp: Entry[] }).__lcp);

test("LCP on a first visit and on a visited load, mobile profile", async ({ browser }, info) => {
  test.skip(info.project.name !== "390", "measured once, on the mobile profile");
  test.setTimeout(180_000);
  const finals: { name: string; final: Entry | undefined }[] = [];
  const results: Record<string, unknown> = {
    measured: new Date().toISOString(),
    profile: "390x844, 150 ms RTT, 1.6 Mbps down, CPU 4x (CDP), production build on localhost",
  };

  for (const [locale, variant] of [
    ["fr", "firstVisit"],
    ["fr", "visitedLoad"],
    ["en", "firstVisit"],
    ["en", "visitedLoad"],
  ] as const) {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
    const page = await context.newPage();
    if (variant === "visitedLoad") {
      await page.addInitScript(() => sessionStorage.setItem("abd-visited", "1"));
    }
    await observeLcp(page);
    await recordLoader(page);
    await throttle(context, page);
    await page.goto(`/${locale}`);
    await shellIdle(page, 20_000);
    const entries = await lcp(page);
    const loader = await loaderRecord(page);
    const final = entries.at(-1);
    results[`${locale}.${variant}`] = {
      final,
      entries,
      loaderReadyMs: loader.ready,
      loaderOffMs: loader.off,
    };
    finals.push({ name: `${locale} ${variant}`, final });

    if (locale === "fr" && variant === "visitedLoad") {
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

  // Written before the assertions, so a failing run still leaves its measurements.
  mkdirSync("test-results/shell", { recursive: true });
  writeFileSync("test-results/shell/lcp.json", `${JSON.stringify(results, null, 2)}\n`);
  for (const { name, final } of finals) {
    expect(final, `${name}: an LCP entry exists`).toBeDefined();
    expect(final?.t ?? Infinity, name).toBeLessThan(LIMIT_MS);
  }
});
