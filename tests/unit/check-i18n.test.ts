import { describe, expect, it } from "vitest";
import en from "@messages/en.json";
import fr from "@messages/fr.json";
import { checkMessages, flatten } from "@scripts/lib/i18n-rules.mjs";

describe("check:i18n rules", () => {
  it("passes on the real messages", () => {
    expect(checkMessages({ fr, en })).toEqual([]);
  });

  it("flattens nested keys", () => {
    expect(flatten({ a: { b: "x", c: { d: "y" } } })).toEqual([
      ["a.b", "x"],
      ["a.c.d", "y"],
    ]);
  });

  it("reports keys missing from one locale", () => {
    expect(checkMessages({ fr: { a: "x", b: "y" }, en: { a: "x" } })).toEqual([
      "en: missing key b",
    ]);
  });

  it("reports empty values", () => {
    expect(checkMessages({ fr: { a: " " }, en: { a: "x" } })).toEqual(["fr: a is empty"]);
  });

  it.each([
    "Le prix commence à 500",
    "Pricing on request",
    "From 300 €",
    "1000 MAD",
    "$40 an hour",
    "Tarifs",
  ])("reports a price: %s", (text) => {
    const problems = checkMessages({ fr: { a: text }, en: { a: "x" } });
    expect(problems.some((p) => p.includes("mentions a price"))).toBe(true);
  });

  it("does not mistake ordinary words for prices", () => {
    expect(
      checkMessages({
        fr: { a: "Je réponds avec des questions." },
        en: { a: "Accurate, separate" },
      }),
    ).toEqual([]);
  });

  it("allows placeholders in development and rejects them when content is required", () => {
    const messages = { fr: { a: "[TODO: wording]" }, en: { a: "x" } };
    expect(checkMessages(messages)).toEqual([]);
    expect(checkMessages(messages, { requireContent: true })).toEqual(["fr: a is a placeholder"]);
  });
});
