// Lighthouse CI: measure, don't gate (docs/quality.md, "Budgets"). The owner sets budgets from the
// baseline in docs/baseline.md. Only these assertions hold today:
// - accessibility 100
// - CLS at most 0.02
// - the individual SEO audits except is-crawlable (fails by design outside production, where every page is noindex).
const PORT = 3000;
const ROUTES = ["/fr", "/en", "/fr/projets", "/fr/mentions-legales"];

const SEO_AUDITS = [
  "document-title",
  "meta-description",
  "http-status-code",
  "link-text",
  "crawlable-anchors",
  "robots-txt",
  "image-alt",
  "hreflang",
  "canonical",
];

module.exports = {
  ci: {
    collect: {
      startServerCommand: `pnpm start --port ${PORT}`,
      startServerReadyPattern: "Ready",
      url: ROUTES.map((route) => `http://localhost:${PORT}${route}`),
      numberOfRuns: 3,
      // Default Lighthouse settings: the mobile profile (Moto G Power, simulated slow 4G, 4x CPU).
      settings: { chromeFlags: "--no-sandbox --headless=new" },
    },
    assert: {
      assertions: {
        "categories:accessibility": ["error", { minScore: 1 }],
        "cumulative-layout-shift": ["error", { maxNumericValue: 0.02 }],
        ...Object.fromEntries(SEO_AUDITS.map((id) => [id, ["error", { minScore: 1 }]])),
      },
    },
    upload: {
      // Reports stay on the machine or in the CI artifact; nothing is sent to a public server.
      target: "filesystem",
      outputDir: ".lighthouseci/reports",
    },
  },
};
