// pnpm check:i18n: fr.json and en.json have identical keys, no empty values, no prices, and no
// [TODO placeholders when REQUIRE_CONTENT=1. Rules: scripts/lib/i18n-rules.mjs.
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { checkMessages } from "./lib/i18n-rules.mjs";

const root = resolve(import.meta.dirname, "..");
const LOCALES = ["fr", "en"];

const byLocale = Object.fromEntries(
  LOCALES.map((locale) => [
    locale,
    JSON.parse(readFileSync(resolve(root, `messages/${locale}.json`), "utf8")),
  ]),
);
const problems = checkMessages(byLocale, {
  requireContent: process.env.REQUIRE_CONTENT === "1",
});

if (problems.length > 0) {
  for (const p of problems) console.error(p);
  console.error(`\ncheck:i18n: ${problems.length} problem(s).`);
  process.exit(1);
}
console.log(`check:i18n: ok (${LOCALES.join(", ")})`);
