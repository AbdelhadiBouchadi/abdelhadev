// Runs before `next build`: lists every [TODO: …] placeholder in the content sources and fails
// when REQUIRE_CONTENT=1 (the production deployment from the launch branch).
import { readdirSync, readFileSync } from "node:fs";
import { join, relative, resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const SOURCES = ["src/lib/site.ts", "src/lib/content", "messages"];

function* files(path) {
  const full = join(root, path);
  try {
    for (const entry of readdirSync(full, { withFileTypes: true })) {
      yield* files(join(path, entry.name));
    }
  } catch {
    yield full;
  }
}

const found = [];
for (const source of SOURCES) {
  for (const file of files(source)) {
    readFileSync(file, "utf8")
      .split("\n")
      .forEach((line, i) => {
        for (const m of line.matchAll(/\[TODO[^\]]*\]/g)) {
          found.push(`${relative(root, file).replaceAll("\\", "/")}:${i + 1}  ${m[0]}`);
        }
      });
  }
}

// The legal notice is not a placeholder but must be reviewed before launch (src/lib/site.ts).
const site = readFileSync(join(root, "src/lib/site.ts"), "utf8");
site.split("\n").forEach((line, i) => {
  if (/^\s*legalReview:\s*"pending"/.test(line)) {
    found.push(
      `src/lib/site.ts:${i + 1}  legalReview: "pending" (the owner confirms the legal notice)`,
    );
  }
});

// A CV that is still the placeholder PDF must be replaced before launch (src/lib/content/cv.ts).
let cvLocale = "";
readFileSync(join(root, "src/lib/content/cv.ts"), "utf8")
  .split("\n")
  .forEach((line, i) => {
    cvLocale = /^\s*(\w+): \{/.exec(line)?.[1] ?? cvLocale;
    if (/^\s*status:\s*"placeholder"/.test(line)) {
      found.push(
        `src/lib/content/cv.ts:${i + 1}  cv.${cvLocale}: placeholder (the owner supplies the CV)`,
      );
    }
  });

const strict = process.env.REQUIRE_CONTENT === "1";
if (found.length === 0) {
  console.log("Content placeholders: none");
} else {
  const log = strict ? console.error : console.warn;
  log(`Content placeholders (${found.length}), to be supplied by the owner:`);
  for (const f of found) log(`  ${f}`);
  if (strict) {
    console.error("\nREQUIRE_CONTENT=1: the build fails until every placeholder is replaced.");
    process.exit(1);
  }
}
