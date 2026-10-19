import { describe, expect, it } from "vitest";
import { checkComments, extractComments } from "@scripts/lib/comment-rules.mjs";

// Spelled in parts, as in the rules, so a search of the repository for the phrase stays clean.
const OWNER = ["the", "owner"].join(" ");

describe("check:comments rules", () => {
  it("fails on a planted comment, naming the file, the line and the rule", () => {
    const source = ["const a = 1;", `// Added for ${OWNER} in 08b (decision P7).`, "a;"].join("\n");
    expect(checkComments("src/lib/a.ts", source).errors).toEqual([
      `src/lib/a.ts:2  owner: ${OWNER}`,
      "src/lib/a.ts:2  build number: 08b",
      "src/lib/a.ts:2  decision id: P7",
    ]);
  });

  it.each([
    ["// See the prompt for details.", "prompt"],
    ["/* Lands in 10-launch. */", "build number"],
    ["// D10 says so.", "decision id"],
    ["// Done \u{1F680}", "emoji"],
  ])("flags %s", (comment, rule) => {
    const [error] = checkComments("src/a.ts", `${comment}\nexport {};`).errors;
    expect(error).toContain(`${rule}:`);
  });

  it("passes a plain comment", () => {
    const source = "// Lenis owns the scroll, so ScrollTrigger reads from it.\nexport {};";
    expect(checkComments("src/a.ts", source)).toEqual({ errors: [], warnings: [] });
  });

  it("ignores the words inside strings and template literals", () => {
    const source = [
      `const a = "${OWNER} wrote the prompt in 08b (P7)";`,
      "const b = `" + OWNER + "'s ${a}`;",
      `it("keeps ${OWNER}'s wording", () => {});`,
    ].join("\n");
    expect(checkComments("tests/a.test.ts", source)).toEqual({ errors: [], warnings: [] });
  });

  it("reads JSX and CSS comments", () => {
    const tsx = `export const A = () => (\n  <div>\n    {/* ${OWNER} */}\n  </div>\n);`;
    expect(checkComments("src/A.tsx", tsx).errors).toEqual([`src/A.tsx:3  owner: ${OWNER}`]);
    const css = ".a {\n  color: red;\n}\n/* prompt 09 */";
    expect(checkComments("src/a.css", css).errors).toEqual(["src/a.css:4  prompt: prompt"]);
  });

  it("only warns on filler words and banners", () => {
    const source = "// ---------- setup ----------\n// This ensures a robust result.\nexport {};";
    const { errors, warnings } = checkComments("src/a.ts", source);
    expect(errors).toEqual([]);
    expect(warnings).toEqual(["src/a.ts:1  banner: ----------", "src/a.ts:2  style: ensures"]);
  });

  it("leaves a quoted example and a date alone", () => {
    const source = '/** "2-a" before "10-a". Read 2026-10-17. */\nexport {};';
    expect(checkComments("scripts/a.mjs", source).errors).toEqual([]);
  });

  it("finds every comment once, in order", () => {
    const source = "// one\nconst a = 1; // two\n/* three */\nexport { a };";
    expect(extractComments("src/a.ts", source)).toEqual([
      { line: 1, text: "// one" },
      { line: 2, text: "// two" },
      { line: 3, text: "/* three */" },
    ]);
  });
});
