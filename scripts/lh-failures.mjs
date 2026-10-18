// Prints every accessibility audit that scored below 1 in the Lighthouse runs left in
// .lighthouseci/ (lhr-*.json), per URL, with the failing elements and what was measured. CI runs it
// after `pnpm lhci` fails, so the log names the audit instead of only "accessibility 0.96".
//
// Usage: node scripts/lh-failures.mjs [dir]   (default .lighthouseci)
import { readdirSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";

const dir = resolve(process.argv[2] ?? ".lighthouseci");

let files = [];
try {
  files = readdirSync(dir).filter((f) => /^lhr-.*\.json$/.test(f));
} catch {
  console.log(`lh-failures: no ${dir} directory`);
  process.exit(0);
}
if (files.length === 0) {
  console.log(`lh-failures: no lhr-*.json in ${dir}`);
  process.exit(0);
}

/** url -> audit id -> { title, weight, scores[], items: Map<selector, { explanation, count }> } */
const byUrl = new Map();
const categoryScores = new Map();

for (const file of files) {
  const lhr = JSON.parse(readFileSync(join(dir, file), "utf8"));
  const url = lhr.finalDisplayedUrl ?? lhr.finalUrl ?? lhr.requestedUrl;
  const category = lhr.categories?.accessibility;
  if (!category) continue;
  if (!categoryScores.has(url)) categoryScores.set(url, []);
  categoryScores.get(url).push(category.score);
  if (!byUrl.has(url)) byUrl.set(url, new Map());
  const audits = byUrl.get(url);
  for (const ref of category.auditRefs) {
    const audit = lhr.audits[ref.id];
    // null: not applicable or manual; only scored audits below 1 fail the category.
    if (!audit || audit.score === null || audit.score >= 1) continue;
    if (!audits.has(ref.id)) {
      audits.set(ref.id, { title: audit.title, weight: ref.weight, scores: [], items: new Map() });
    }
    const entry = audits.get(ref.id);
    entry.scores.push(audit.score);
    for (const item of audit.details?.items ?? []) {
      const node = item.node ?? {};
      const selector = node.selector ?? node.snippet ?? JSON.stringify(item).slice(0, 120);
      const explanation = (node.explanation ?? "").replace(/\s+/g, " ").trim();
      const seen = entry.items.get(selector);
      entry.items.set(selector, {
        explanation: seen?.explanation ?? explanation,
        count: (seen?.count ?? 0) + 1,
      });
    }
  }
}

let failing = 0;
for (const [url, audits] of [...byUrl].sort()) {
  const scores = categoryScores.get(url) ?? [];
  console.log(`\n${url}  accessibility ${scores.join(", ")}`);
  if (audits.size === 0) {
    console.log("  every accessibility audit passed");
    continue;
  }
  for (const [id, { title, weight, scores: s, items }] of audits) {
    failing++;
    console.log(`  ✗ ${id} (weight ${String(weight)}, score ${s.join(", ")}): ${title}`);
    for (const [selector, { explanation, count }] of items) {
      console.log(`      ${selector}${count > 1 ? `  (×${String(count)} nodes)` : ""}`);
      if (explanation) console.log(`        ${explanation.slice(0, 400)}`);
    }
  }
}
console.log(
  `\nlh-failures: ${String(failing)} failing audit(s) across ${String(byUrl.size)} URL(s)`,
);
