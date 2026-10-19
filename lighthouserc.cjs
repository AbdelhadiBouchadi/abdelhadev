// Measure, don't gate (docs/quality.md). Budgets come from the baseline in docs/baseline.md; only
// these assertions hold today: accessibility 100, CLS at most 0.02, and the SEO audits except
// is-crawlable, which fails by design outside production (every page is noindex there).
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
      // The default mobile profile: Moto G Power, simulated slow 4G, 4x CPU.
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
      // Reports stay on the machine or in the CI artifact; nothing goes to a public server.
      target: "filesystem",
      outputDir: ".lighthouseci/reports",
    },
  },
};
