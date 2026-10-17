import { defineConfig, devices } from "@playwright/test";

const PORT = Number(process.env.PORT ?? 3000);

// Responsive and accessibility run at every width; the other suites check behaviour that does not
// depend on the width, so they run once on desktop and once on the middle phone.
const PHONE = { ...devices["Pixel 7"], browserName: "chromium" as const };
const EVERY_WIDTH = /(responsive|a11y)\.spec\.ts/;

export default defineConfig({
  testDir: "tests/e2e",
  outputDir: "test-results/artifacts",
  fullyParallel: true,
  // Every page now runs the GSAP ticker (Lenis) and the loader. At the default 50 % of a 12-thread
  // machine, frame starvation pushed about 1 % of loads past their timeouts; at 33 % the suite is
  // green in the same wall time. CI keeps Playwright's default.
  workers: process.env.CI ? undefined : "33%",
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["github"], ["list"]] : [["list"]],
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: "retain-on-failure",
  },
  projects: [
    {
      name: "360",
      use: { ...PHONE, viewport: { width: 360, height: 780 } },
      testMatch: EVERY_WIDTH,
    },
    { name: "390", use: { ...PHONE, viewport: { width: 390, height: 844 } } },
    {
      name: "430",
      use: { ...PHONE, viewport: { width: 430, height: 932 } },
      testMatch: EVERY_WIDTH,
    },
    {
      name: "1440",
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 1440, height: 900 },
      },
    },
  ],
  webServer: {
    command: `pnpm start --port ${PORT}`,
    url: `http://localhost:${PORT}/fr`,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
