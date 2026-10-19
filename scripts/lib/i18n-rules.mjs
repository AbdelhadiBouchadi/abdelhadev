/** { a: { b: "x" } } -> [["a.b", "x"]] */
export function flatten(messages, prefix = "") {
  return Object.entries(messages).flatMap(([key, value]) => {
    const path = prefix ? `${prefix}.${key}` : key;
    return value !== null && typeof value === "object" && !Array.isArray(value)
      ? flatten(value, path)
      : [[path, value]];
  });
}

// No prices anywhere: price words in both languages and currency symbols or codes.
const PRICE =
  /(?:\b(?:prix|tarifs?|tarification|devis chiffré|price[sd]?|pricing|costs?|fees?|rates?|dirhams?|euros?|dollars?|MAD|DH|EUR|USD)\b|[€$£¥])/i;

/**
 * `[TODO` placeholders count only when `requireContent` is true.
 * @param {Record<string, Record<string, unknown>>} byLocale
 */
export function checkMessages(byLocale, { requireContent = false } = {}) {
  const problems = [];
  const flat = Object.fromEntries(
    Object.entries(byLocale).map(([locale, messages]) => [locale, new Map(flatten(messages))]),
  );
  const allKeys = new Set(Object.values(flat).flatMap((map) => [...map.keys()]));

  for (const [locale, map] of Object.entries(flat)) {
    for (const key of allKeys) {
      if (!map.has(key)) problems.push(`${locale}: missing key ${key}`);
    }
    for (const [key, value] of map) {
      if (typeof value !== "string") {
        problems.push(`${locale}: ${key} is not a string`);
        continue;
      }
      if (value.trim() === "") problems.push(`${locale}: ${key} is empty`);
      const price = PRICE.exec(value);
      if (price) problems.push(`${locale}: ${key} mentions a price ("${price[0]}")`);
      if (requireContent && value.includes("[TODO"))
        problems.push(`${locale}: ${key} is a placeholder`);
    }
  }
  return problems;
}
