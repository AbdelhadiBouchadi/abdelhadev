// pnpm check:tokens: colours, easings, durations and radii come from tokens only.
// Rules: scripts/lib/token-rules.mjs. Scans every source file under src/.
import { readdirSync, readFileSync } from "node:fs";
import { join, relative, resolve } from "node:path";
import { checkFile, radiusTokens } from "./lib/token-rules.mjs";

const root = resolve(import.meta.dirname, "..");
const EXTENSIONS = /\.(?:ts|tsx|js|jsx|mjs|css)$/;
// Generated path data has no colours or motion, and its numbers would only be noise.
// The contact email template: email clients ignore CSS variables and stylesheets, so its values
// are copied from tokens.css by hand and inlined (each one names its token there).
const SKIP = new Set(["src/components/brand/wordmark-paths.ts", "src/emails/contact-form.tsx"]);

function* walk(dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) yield* walk(full);
    else if (EXTENSIONS.test(entry.name)) yield full;
  }
}

const tokens = radiusTokens(readFileSync(join(root, "src/styles/globals.css"), "utf8"));
let count = 0;
for (const file of walk(join(root, "src"))) {
  const path = relative(root, file).replaceAll("\\", "/");
  if (SKIP.has(path)) continue;
  for (const v of checkFile(path, readFileSync(file, "utf8"), tokens)) {
    console.error(`${path}:${v.line}  ${v.rule}: ${v.match}`);
    count++;
  }
}

if (count > 0) {
  console.error(
    `\ncheck:tokens: ${count} violation(s). Use the tokens in src/styles/tokens.css and src/lib/motion.ts.`,
  );
  process.exit(1);
}
console.log(`check:tokens: ok (radius tokens: ${[...tokens].join(", ")})`);
