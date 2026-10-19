import type { CSSProperties } from "react";
import { clsx, type ClassValue } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

// Teach tailwind-merge the custom utilities so `h-xl` is not mistaken for a height.
const twMerge = extendTailwindMerge<"type-scale">({
  extend: {
    classGroups: {
      "type-scale": ["h-xl", "h-lg", "h-md", "h-sm", "statement", "lead"],
    },
  },
});

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

export function isKeyOf<T extends object>(object: T, key: PropertyKey): key is keyof T {
  return Object.hasOwn(object, key);
}

export type CSSVars = CSSProperties & Partial<Record<`--${string}`, string>>;
