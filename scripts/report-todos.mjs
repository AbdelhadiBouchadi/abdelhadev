// Runs before next build: lists every [TODO: …] placeholder in the content sources and fails when
// REQUIRE_CONTENT=1.
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

// An unconfirmed testimonial is never rendered, so its placeholders never ship and are not
// listed. Its entries are written `entry("<id>", <confirmed>)`, one per line.
const hidden = new Set(
  [
    ...readFileSync(join(root, "src/lib/content/testimonials.ts"), "utf8").matchAll(
      /^\s*entry\("([a-z0-9-]+)",\s*false\)/gm,
    ),
  ].map((m) => m[1]),
);

/** One key or bracket per line, as pretty-printed JSON has it. */
function keyPaths(lines) {
  const stack = [];
  return lines.map((line) => {
    const open = /^\s*(?:"([^"]+)":\s*)?[{[]\s*$/.exec(line);
    if (open) {
      stack.push(open[1] ?? "");
      return [...stack];
    }
    if (/^\s*[}\]],?\s*$/.test(line)) {
      const path = [...stack];
      stack.pop();
      return path;
    }
    const leaf = /^\s*"([^"]+)":/.exec(line);
    return leaf ? [...stack, leaf[1]] : [...stack];
  });
}

const found = [];
for (const source of SOURCES) {
  for (const file of files(source)) {
    const lines = readFileSync(file, "utf8").split("\n");
    const paths = file.endsWith(".json") ? keyPaths(lines) : [];
    lines.forEach((line, i) => {
      // path[0] is the file's root object.
      const path = paths[i] ?? [];
      if (path[1] === "testimonials" && hidden.has(path[2])) return;
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
      `src/lib/site.ts:${i + 1}  legalReview: "pending" (the legal notice is not confirmed yet)`,
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
        `src/lib/content/cv.ts:${i + 1}  cv.${cvLocale}: placeholder (the real CV is still to come)`,
      );
    }
  });

if (found.some((line) => line.includes("cv.") && line.includes("placeholder"))) {
  // Same wording as CV_ACTION in src/lib/content/cv.ts.
  found.push("cv: place the two CV PDFs in public/cv/ and set their status to final");
}

const strict = process.env.REQUIRE_CONTENT === "1";
if (found.length === 0) {
  console.log("Content placeholders: none");
} else {
  const log = strict ? console.error : console.warn;
  log(`Content placeholders (${found.length}), still to supply:`);
  for (const f of found) log(`  ${f}`);
  if (strict) {
    console.error("\nREQUIRE_CONTENT=1: the build fails until every placeholder is replaced.");
    process.exit(1);
  }
}
