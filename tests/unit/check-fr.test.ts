import { describe, expect, it } from "vitest";
import fr from "@messages/fr.json";
import { BANNED_FR, checkFrench } from "@scripts/lib/fr-rules.mjs";

describe("check:fr rules", () => {
  it("passes on the real French messages, without a warning", () => {
    expect(checkFrench(fr)).toEqual({ errors: [], warnings: [] });
  });

  it("fails on a planted phrase, naming the key and the phrase", () => {
    const { errors } = checkFrench({ about: { why: "DentaFlow est né d'une clinique dentaire." } });
    expect(errors).toEqual(['about.why: "clinique dentaire" (never write "clinique dentaire")']);
  });

  it.each([
    "Une Clinique Dentaire à Agadir",
    "Dernière année de licence",
    "Une licence en génie informatique",
    "Un tableau de bord customisé",
    "J'implémente vos idées",
    "Une fonction implémentée",
    "Les certificats délivrés",
    "Une architecture scalable",
    "Le panneau d'administration",
    "Le panneau d’administration",
    "Bookez un créneau",
    "Réservations bookées",
  ])("flags %s", (text) => {
    expect(checkFrench({ a: text }).errors).toHaveLength(1);
  });

  it.each([
    "SOS Dental Clinic, Agadir",
    "Un cabinet dentaire",
    "Un espace d'administration sur mesure",
    "Je développe et je livre",
    "Une application évolutive",
    "Réservez un créneau disponible",
    "Bachelor of Engineering (B.Eng)",
  ])("leaves %s alone", (text) => {
    expect(checkFrench({ a: text }).errors).toEqual([]);
  });

  it("covers every phrase the style guide bans", () => {
    expect(BANNED_FR.map((b) => b.phrase)).toEqual([
      "clinique dentaire",
      "dernière année de licence",
      "licence en génie",
      "customisé",
      "implémenter",
      "délivrer",
      "scalable",
      "panneau d'administration",
      "booker",
    ]);
  });

  it("warns, without failing, on a regular space before high punctuation", () => {
    const result = checkFrench({ a: { b: "Un projet en tête ?", c: "Mon projet : {topic}." } });
    expect(result.errors).toEqual([]);
    expect(result.warnings).toEqual([
      "a.b: regular space before : ; ? or ! (use a no-break space)",
    ]);
  });

  it("does not typeset placeholders, which stay exactly as written", () => {
    expect(checkFrench({ a: "[TODO: ce que j'ai construit : catalogue]" }).warnings).toEqual([]);
  });
});
