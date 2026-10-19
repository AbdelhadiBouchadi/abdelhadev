import { flatten } from "./i18n-rules.mjs";

// Letters on either side mean the phrase is part of a longer word.
const word = (body) => new RegExp(`(?<!\\p{L})(?:${body})(?!\\p{L})`, "iu");

/**
 * Accent-sensitive: "Clinic" in an English proper noun such as "SOS Dental Clinic" is not
 * "clinique dentaire".
 */
export const BANNED_FR = [
  { phrase: "clinique dentaire", pattern: word("cliniques? dentaires?") },
  { phrase: "dernière année de licence", pattern: word("dernière année de licence") },
  { phrase: "licence en génie", pattern: word("licence en génie") },
  { phrase: "customisé", pattern: word("customis(?:é|ée|és|ées|er|ation)") },
  { phrase: "implémenter", pattern: word("implément(?:er|é|ée|és|ées|e|ent|ons|ez|ation)") },
  { phrase: "délivrer", pattern: word("délivr(?:er|é|ée|és|ées|e|es|ent|ons|ez)") },
  { phrase: "scalable", pattern: word("scalables?") },
  { phrase: "panneau d'administration", pattern: word("panneaux? d['’]administration") },
  { phrase: "booker", pattern: word("book(?:er|é|ée|és|ées|e|es|ent|ez)") },
];

// A regular space where French typography wants a no-break one (U+00A0 or U+202F).
const LOOSE_SPACE = / [:;?!]/;

/**
 * Warnings name the keys with a regular space before `:` `;` `?` or `!`, placeholders aside.
 * @param {Record<string, unknown>} messages
 */
export function checkFrench(messages) {
  const errors = [];
  const warnings = [];
  for (const [key, value] of flatten(messages)) {
    if (typeof value !== "string") continue;
    for (const { phrase, pattern } of BANNED_FR) {
      const match = value.match(pattern);
      if (match) errors.push(`${key}: "${match[0]}" (never write "${phrase}")`);
    }
    // Placeholders are kept exactly as written and never ship, so they are not typeset.
    if (LOOSE_SPACE.test(value) && !value.includes("[TODO")) {
      warnings.push(`${key}: regular space before : ; ? or ! (use a no-break space)`);
    }
  }
  return { errors, warnings };
}
