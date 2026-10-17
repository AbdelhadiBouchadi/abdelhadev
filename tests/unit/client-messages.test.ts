// The browser receives only CLIENT_NAMESPACES (src/i18n/client-messages.ts). Every namespace a
// Client Component translates with must be in that list, or its strings are missing at runtime.
import { readdirSync, readFileSync } from "node:fs";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import fr from "@messages/fr.json";
import { CLIENT_NAMESPACES, pickClientMessages } from "@/i18n/client-messages";

const SRC = fileURLToPath(new URL("../../src/", import.meta.url));

function sourceFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) return sourceFiles(path);
    return /\.tsx?$/.test(entry.name) ? [path] : [];
  });
}

const clientFiles = sourceFiles(SRC).filter((file) =>
  /^\s*["']use client["']/.test(readFileSync(file, "utf8")),
);

describe("client messages", () => {
  it("covers every namespace a Client Component translates with", () => {
    const used = new Map<string, string>();
    for (const file of clientFiles) {
      for (const [, ns] of readFileSync(file, "utf8").matchAll(
        /useTranslations\(\s*["']([^"'.]+)/g,
      )) {
        if (ns) used.set(ns, relative(SRC, file));
      }
    }
    expect(used.size, "the scan finds the shell's client translations").toBeGreaterThan(0);
    for (const [ns, file] of used) {
      expect(CLIENT_NAMESPACES as readonly string[], `${file} uses "${ns}"`).toContain(ns);
    }
  });

  it("passes only those namespaces, with their messages", () => {
    const picked = pickClientMessages(fr);
    expect(Object.keys(picked).sort()).toEqual([...CLIENT_NAMESPACES].sort());
    expect(picked.loader).toEqual(fr.loader);
  });
});
