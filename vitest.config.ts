import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const path = (p: string) => fileURLToPath(new URL(p, import.meta.url));

export default defineConfig({
  resolve: {
    alias: [
      { find: /^@\/(.*)$/, replacement: `${path("./src/")}$1` },
      { find: /^@messages\/(.*)$/, replacement: `${path("./messages/")}$1` },
      { find: /^@scripts\/(.*)$/, replacement: `${path("./scripts/")}$1` },
      // The real package throws outside a React Server Component build; tests import env.ts directly.
      {
        find: /^server-only$/,
        replacement: path("./tests/unit/stubs/server-only.ts"),
      },
    ],
  },
  test: {
    environment: "node",
    include: ["tests/unit/**/*.test.ts"],
    restoreMocks: true,
  },
});
