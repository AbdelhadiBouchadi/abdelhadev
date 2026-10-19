// Prints the medians of a Lighthouse CI run as a Markdown table, for docs/baseline.md. Not part
// of CI.
import { readdirSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";

const dir = resolve(import.meta.dirname, "../.lighthouseci");
const reports = readdirSync(dir)
  .filter((f) => /^lhr-.*\.json$/.test(f))
  .map((f) => JSON.parse(readFileSync(join(dir, f), "utf8")));

const median = (values) => {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
};

const scriptBytes = (lhr) =>
  (lhr.audits["resource-summary"]?.details?.items ?? []).find((i) => i.resourceType === "script")
    ?.transferSize ?? 0;

const byUrl = Map.groupBy(reports, (lhr) => new URL(lhr.finalDisplayedUrl).pathname);
const rows = [...byUrl].map(([path, runs]) => {
  const audit = (id) => median(runs.map((r) => r.audits[id].numericValue));
  const score = (id) => Math.round(median(runs.map((r) => r.categories[id].score)) * 100);
  return {
    path,
    runs: runs.length,
    lcp: `${(audit("largest-contentful-paint") / 1000).toFixed(2)} s`,
    lcpElement:
      runs[0].audits["largest-contentful-paint-element"]?.details?.items?.[0]?.items?.[0]?.node
        ?.nodeLabel ?? "",
    fcp: `${(audit("first-contentful-paint") / 1000).toFixed(2)} s`,
    tbt: `${Math.round(audit("total-blocking-time"))} ms`,
    cls: audit("cumulative-layout-shift").toFixed(3),
    js: `${(median(runs.map(scriptBytes)) / 1024).toFixed(1)} KiB`,
    perf: score("performance"),
    a11y: score("accessibility"),
    bp: score("best-practices"),
    seo: score("seo"),
  };
});

const header = [
  "Route",
  "Runs",
  "LCP",
  "FCP",
  "TBT",
  "CLS",
  "JS transfer",
  "Perf",
  "A11y",
  "BP",
  "SEO",
  "LCP element",
];
console.log(`| ${header.join(" | ")} |`);
console.log(`| ${header.map(() => "---").join(" | ")} |`);
for (const r of rows.sort((a, b) => a.path.localeCompare(b.path))) {
  console.log(
    `| ${[r.path, r.runs, r.lcp, r.fcp, r.tbt, r.cls, r.js, r.perf, r.a11y, r.bp, r.seo, r.lcpElement].join(" | ")} |`,
  );
}
console.log(
  `\nLighthouse ${reports[0]?.lighthouseVersion}, ${reports[0]?.configSettings?.formFactor}.`,
);
