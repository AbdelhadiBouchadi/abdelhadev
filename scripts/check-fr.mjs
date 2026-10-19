// pnpm check:fr: messages/fr.json never uses the phrases docs/french-style.md bans (fails), and
// warns about a regular space before : ; ? ! (no-break space expected). Rules: scripts/lib/fr-rules.mjs.
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { checkFrench } from "./lib/fr-rules.mjs";

const root = resolve(import.meta.dirname, "..");
const messages = JSON.parse(readFileSync(resolve(root, "messages/fr.json"), "utf8"));
const { errors, warnings } = checkFrench(messages);

for (const w of warnings) console.warn(`warning: ${w}`);
if (errors.length > 0) {
  for (const e of errors) console.error(e);
  console.error(`\ncheck:fr: ${errors.length} problem(s). See docs/french-style.md.`);
  process.exit(1);
}
console.log(`check:fr: ok${warnings.length > 0 ? ` (${warnings.length} warning(s))` : ""}`);
