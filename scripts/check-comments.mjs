// Fails on a comment in src, tests or scripts that talks about the repository's history (build
// numbers, decision ids, who asked for what) or holds an emoji. Filler words and banners only warn.
// The rules and their reasons: scripts/lib/comment-rules.mjs.
import { readdirSync, readFileSync } from "node:fs";
import { join, relative, resolve } from "node:path";
import { checkComments } from "./lib/comment-rules.mjs";

const root = resolve(import.meta.dirname, "..");
const EXTENSIONS = /\.(?:ts|tsx|js|jsx|mjs|cjs|css)$/;

function* walk(dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) yield* walk(full);
    else if (EXTENSIONS.test(entry.name)) yield full;
  }
}

const errors = [];
const warnings = [];
let files = 0;
for (const dir of ["src", "tests", "scripts"]) {
  for (const file of walk(join(root, dir))) {
    const path = relative(root, file).replaceAll("\\", "/");
    const result = checkComments(path, readFileSync(file, "utf8"));
    errors.push(...result.errors);
    warnings.push(...result.warnings);
    files++;
  }
}

for (const w of warnings) console.warn(`warning: ${w}`);
if (errors.length > 0) {
  for (const e of errors) console.error(e);
  console.error(`\ncheck:comments: ${errors.length} problem(s). Rewrite the comment.`);
  process.exit(1);
}
console.log(
  `check:comments: ok, ${files} files${warnings.length > 0 ? ` (${warnings.length} warning(s))` : ""}`,
);
