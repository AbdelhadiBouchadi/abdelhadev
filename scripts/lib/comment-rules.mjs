import ts from "typescript";

// Comments only: a word inside a string or a template literal is copy or test data, not a comment.
const SCRIPT = /\.(?:ts|tsx|js|jsx|mjs|cjs)$/;

// Spelled in parts, so a search of the repository for the phrase finds only real uses.
const OWNER = ["the", "owner"].join(" ");

export const FAIL = [
  { rule: "owner", pattern: new RegExp(String.raw`\b${OWNER}(?:'s)?\b`, "i") },
  { rule: "prompt", pattern: /\bprompts?\b/i },
  // A quoted "10-a" is an example in a doc comment, not a branch name.
  { rule: "build number", pattern: /\b0\d[a-z]\d?\b|(?<![\w.\-"'`])\d{2}-(?=[a-z])/ },
  { rule: "decision id", pattern: /\b[PD]\d{1,2}\b/ },
  { rule: "emoji", pattern: /\p{Emoji_Presentation}|\p{Extended_Pictographic}️/u },
];

export const WARN = [
  {
    rule: "style",
    pattern:
      /\b(?:ensures?|ensure that|robust|seamless(?:ly)?|leverag(?:e|es|ed|ing)|utili[sz](?:e|es|ed|ing)|comprehensive|crucial|streamlin(?:e|es|ed|ing)|it is worth noting|in order to|responsible for|handles the logic of)\b/i,
  },
  { rule: "em dash", pattern: /—/ },
  { rule: "banner", pattern: /-{4,}|={4,}|\*{4,}|#{4,}|_{4,}|~{4,}/ },
];

/**
 * Every comment in a source file, with the line it starts on. CSS has block comments only.
 * @param {string} path
 * @param {string} text
 * @returns {{ line: number, text: string }[]}
 */
export function extractComments(path, text) {
  const lineOf = (pos) => text.slice(0, pos).split("\n").length;
  if (path.endsWith(".css")) {
    return [...text.matchAll(/\/\*[\s\S]*?\*\//g)].map((m) => ({
      line: lineOf(m.index),
      text: m[0],
    }));
  }
  if (!SCRIPT.test(path)) return [];
  const kind = /x$/.test(path) ? ts.ScriptKind.TSX : ts.ScriptKind.TS;
  const source = ts.createSourceFile(path, text, ts.ScriptTarget.Latest, true, kind);
  const found = new Map();
  const add = (ranges) => {
    for (const r of ranges ?? []) found.set(r.pos, text.slice(r.pos, r.end));
  };
  // Walking every token, so JSX comments ({/* … */}) and comments before the end of file count too.
  const visit = (node) => {
    add(ts.getLeadingCommentRanges(text, node.getFullStart()));
    add(ts.getTrailingCommentRanges(text, node.getEnd()));
    for (const child of node.getChildren(source)) visit(child);
  };
  visit(source);
  return [...found]
    .sort(([a], [b]) => a - b)
    .map(([pos, comment]) => ({ line: lineOf(pos), text: comment }));
}

/**
 * @param {string} path
 * @param {string} text
 */
export function checkComments(path, text) {
  const errors = [];
  const warnings = [];
  for (const comment of extractComments(path, text)) {
    for (const { rule, pattern } of FAIL) {
      const m = comment.text.match(pattern);
      if (m) errors.push(`${path}:${comment.line}  ${rule}: ${m[0]}`);
    }
    for (const { rule, pattern } of WARN) {
      const m = comment.text.match(pattern);
      if (m) warnings.push(`${path}:${comment.line}  ${rule}: ${m[0]}`);
    }
  }
  return { errors, warnings };
}
