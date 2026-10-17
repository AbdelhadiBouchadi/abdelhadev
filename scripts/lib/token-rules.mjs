// Rules behind `pnpm check:tokens` (docs/quality.md). Pure functions so tests/unit can cover them.
//
// 1. No colour literals outside src/styles/ (hex, rgb/hsl/hwb/lab/lch/oklab/oklch/color(), 0xrrggbb).
// 2. No easing or duration literals outside src/lib/motion.ts and src/styles/: cubic-bezier(),
//    string eases, numeric duration/delay/stagger, CSS time values in transitions and animations,
//    Tailwind duration-/delay-/ease- classes that are not token based.
// 3. No rounded-* value outside the token scale declared in src/styles/globals.css
//    (`none` and `[inherit]` are not values, so they pass).

/** @typedef {{ rule: string, line: number, match: string }} Violation */

const COLOUR = [
  // #rgb, #rgba, #rrggbb, #rrggbbaa, not followed by a word character (so "#main" is not a colour
  // but "#abc" in a URL fragment would be: fragments like that are rare and easy to rename).
  /(?<![\w&])#(?:[0-9a-f]{8}|[0-9a-f]{6}|[0-9a-f]{3,4})(?![\w-])/gi,
  /\b(?:rgba?|hsla?|hwb|lab|lch|oklab|oklch|color)\(/gi,
  // Numeric colours, as three.js takes them (0xffb48a).
  /\b0x[0-9a-f]{6}\b/gi,
];

const MOTION = [
  { rule: "cubic-bezier literal", re: /cubic-bezier\(/gi },
  { rule: "string ease literal", re: /\bease\s*:\s*["'`]/g },
  {
    rule: "numeric duration literal",
    re: /\b(?:duration|delay|stagger|repeatDelay)\s*:\s*-?\d/g,
  },
  {
    rule: "CSS time literal",
    re: /\b(?:transition|animation)(?:-duration|-delay)?\s*:[^;{}]*?\b\d*\.?\d+m?s\b/g,
  },
  {
    rule: "Tailwind duration or easing literal",
    re: /(?<![\w-])(?:duration|delay)-(?:\d+|\[[^\]]+\])(?![\w-])|(?<![\w-])ease-(?:linear|in|out|in-out|\[[^\]]+\])(?![\w-])/g,
  },
];

const ROUNDED =
  /(?<![\w-])rounded(?:-(?:t|r|b|l|s|e|x|y|tl|tr|br|bl|ss|se|es|ee))?(?:-([\w[\]().%,/-]+))?(?![\w-])/g;

/** Parses `--radius-<name>:` declarations from globals.css. */
export function radiusTokens(globalsCss) {
  return new Set([...globalsCss.matchAll(/--radius-([\w-]+)\s*:/g)].map((m) => m[1]));
}

function lineOf(text, index) {
  let line = 1;
  for (let i = 0; i < index; i++) if (text.charCodeAt(i) === 10) line++;
  return line;
}

function scan(text, re, rule, out) {
  re.lastIndex = 0;
  for (const m of text.matchAll(re)) out.push({ rule, line: lineOf(text, m.index), match: m[0] });
}

/** Colour literals in a file outside src/styles/. */
export function colourViolations(text) {
  const out = [];
  for (const re of COLOUR) scan(text, re, "colour literal", out);
  return out;
}

/** Easing and duration literals in a file outside src/lib/motion.ts and src/styles/. */
export function motionViolations(text) {
  const out = [];
  for (const { rule, re } of MOTION) scan(text, re, rule, out);
  return out;
}

/** rounded-* classes whose value is not a radius token (`none` is allowed). */
export function radiusViolations(text, tokens) {
  const out = [];
  for (const m of text.matchAll(ROUNDED)) {
    const value = m[1];
    if (value === "none" || value === "[inherit]" || (value !== undefined && tokens.has(value)))
      continue;
    out.push({
      rule: "rounded value outside the token scale",
      line: lineOf(text, m.index),
      match: m[0],
    });
  }
  return out;
}

/** All rules for one file, given its path relative to the repo root (forward slashes). */
export function checkFile(path, text, tokens) {
  const inStyles = path.startsWith("src/styles/");
  const isMotion = path === "src/lib/motion.ts";
  return [
    ...(inStyles ? [] : colourViolations(text)),
    ...(inStyles || isMotion ? [] : motionViolations(text)),
    ...(inStyles ? [] : radiusViolations(text, tokens)),
  ];
}
