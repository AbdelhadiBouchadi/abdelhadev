import { describe, expect, it } from "vitest";
import {
  checkFile,
  colourViolations,
  motionViolations,
  radiusViolations,
} from "@scripts/lib/token-rules.mjs";

const tokens = new Set(["pill", "card", "sheet"]);

describe("colour rule", () => {
  it.each([
    `<div style={{ color: "#fff" }} />`,
    `className="bg-[#3D52D5]"`,
    `fill="#FFB48A80"`,
    `background: rgba(43, 29, 26, .12)`,
    `color: hsl(20 50% 50%)`,
    `color: oklch(0.7 0.1 40)`,
    `new THREE.Color(0xffb48a)`,
  ])("flags %s", (code) => {
    expect(colourViolations(code)).toHaveLength(1);
  });

  it.each([
    `href="#main"`,
    `className="bg-paper text-ink"`,
    `style={{ background: "var(--paper)" }}`,
    `&#123;`,
  ])("allows %s", (code) => {
    expect(colourViolations(code)).toHaveLength(0);
  });
});

describe("motion rule", () => {
  it.each([
    `transition: "all .3s cubic-bezier(.2,0,0,1)"`,
    `gsap.to(el, { ease: "power2.out" })`,
    `gsap.to(el, { duration: 0.8 })`,
    `{ stagger: 0.1 }`,
    `transition: opacity .4s;`,
    `className="duration-300"`,
    `className="ease-in-out"`,
    `className="ease-[cubic-bezier(1,0,0,1)]"`,
    `className="delay-150"`,
  ])("flags %s", (code) => {
    expect(motionViolations(code).length).toBeGreaterThan(0);
  });

  it.each([
    `gsap.to(el, { ease: EASE.warm, duration: DURATION.base })`,
    `className="duration-(--dur-base) ease-warm transition-colors"`,
    `const durationMs = 300;`,
  ])("allows %s", (code) => {
    expect(motionViolations(code)).toHaveLength(0);
  });
});

describe("radius rule", () => {
  it.each([`rounded`, `rounded-lg`, `rounded-[14px]`, `rounded-t-xl`, `before:rounded-full`])(
    "flags %s",
    (cls) => {
      expect(radiusViolations(`className="${cls}"`, tokens)).toHaveLength(1);
    },
  );

  it.each([
    `rounded-pill`,
    `rounded-t-card`,
    `hover:rounded-sheet`,
    `rounded-none`,
    `before:rounded-[inherit]`,
  ])("allows %s", (cls) => {
    expect(radiusViolations(`className="${cls}"`, tokens)).toHaveLength(0);
  });
});

describe("file scope", () => {
  const colourAndEase = `const a = "#fff"; const b = { ease: "power2.out" };`;

  it("lets src/styles hold colours and motion values", () => {
    expect(checkFile("src/styles/tokens.css", colourAndEase, tokens)).toHaveLength(0);
  });

  it("lets src/lib/motion.ts hold motion values but not colours", () => {
    const found = checkFile("src/lib/motion.ts", colourAndEase, tokens);
    expect(found.map((v) => v.rule)).toEqual(["colour literal"]);
  });

  it("checks components for both", () => {
    expect(checkFile("src/components/ui/X.tsx", colourAndEase, tokens)).toHaveLength(2);
  });

  it("reports the line of each violation", () => {
    expect(checkFile("src/a.ts", `\n\nconst c = "#123456";`, tokens)[0]?.line).toBe(3);
  });
});
