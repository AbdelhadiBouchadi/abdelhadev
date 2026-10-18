import { defineConfig, devices, type PlaywrightTestConfig } from "@playwright/test";

const PORT = Number(process.env.PORT ?? 3000);

const PHONE = { ...devices["Pixel 7"], browserName: "chromium" as const };
/** The per-route width suites: every route at every width (docs/quality.md). */
const EVERY_WIDTH = /(responsive|a11y)\.spec\.ts/;
/** Motion evidence (videos and end-state screenshots in test-results/motion/), not assertions:
    motion.spec, home-motion.spec and primitives-motion.spec; not reduced-motion.spec (behaviour). */
const MOTION = /(?:^|[\\/])(?:home-|primitives-)?motion\.spec\.ts$/;

/** Which suite a config runs (docs/quality.md, "Playwright suites"):
    - `ci` (`pnpm test:e2e`, CI): every behaviour spec at 390 and 1440; no motion evidence.
    - `full` (`pnpm test:e2e:full`, local): the same, plus responsive and a11y at 360 and 430.
    - `motion` (`pnpm test:motion`, local): the motion evidence only, at 1440 (each clip opens its
      own context at the size it films). */
export type Suite = "ci" | "full" | "motion";

const desktop = {
  name: "1440",
  use: { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 900 } },
};

function projects(suite: Suite): PlaywrightTestConfig["projects"] {
  if (suite === "motion") return [{ ...desktop, testMatch: MOTION }];
  const phone390 = { name: "390", use: { ...PHONE, viewport: { width: 390, height: 844 } } };
  const core = [
    { ...phone390, testIgnore: MOTION },
    { ...desktop, testIgnore: MOTION },
  ];
  if (suite === "ci") return core;
  return [
    {
      name: "360",
      use: { ...PHONE, viewport: { width: 360, height: 780 } },
      testMatch: EVERY_WIDTH,
    },
    ...core,
    {
      name: "430",
      use: { ...PHONE, viewport: { width: 430, height: 932 } },
      testMatch: EVERY_WIDTH,
    },
  ];
}

export function e2eConfig(suite: Suite): PlaywrightTestConfig {
  return defineConfig({
    testDir: "tests/e2e",
    outputDir: "test-results/artifacts",
    fullyParallel: true,
    // Every page now runs the GSAP ticker (Lenis) and the loader. At the default 50 % of a
    // 12-thread machine, frame starvation pushed about 1 % of loads past their timeouts; at 33 %
    // the suite is green in the same wall time. CI keeps Playwright's default. The motion
    // evidence records videos with software WebGL, which only holds up one at a time.
    workers: suite === "motion" ? 1 : process.env.CI ? undefined : "33%",
    forbidOnly: Boolean(process.env.CI),
    retries: process.env.CI ? 1 : 0,
    reporter: process.env.CI ? [["github"], ["list"]] : [["list"]],
    use: {
      baseURL: `http://localhost:${String(PORT)}`,
      trace: "retain-on-failure",
    },
    projects: projects(suite),
    webServer: {
      command: `pnpm start --port ${String(PORT)}`,
      url: `http://localhost:${String(PORT)}/fr`,
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
    },
  });
}

export default e2eConfig("ci");
