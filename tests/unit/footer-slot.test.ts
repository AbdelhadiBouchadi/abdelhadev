// The footer comes from the @footer slot of the locale layout (05). On a client-side navigation a
// slot without a page for the new route keeps the previous route's footer, so every route needs
// its own slot page; this fails when a route is added without one.
import { existsSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { routing } from "@/i18n/routing";

const APP = "src/app/[locale]";

describe("the @footer slot", () => {
  for (const pathname of Object.keys(routing.pathnames)) {
    it(`has a page for ${pathname}, next to the route's own page`, () => {
      const dir = pathname === "/" ? "" : pathname;
      expect(existsSync(`${APP}${dir}/page.tsx`), "route page").toBe(true);
      expect(existsSync(`${APP}/@footer${dir}/page.tsx`), "slot page").toBe(true);
    });
  }

  it("has a default for full page loads that match no slot page (not-found pages)", () => {
    expect(existsSync(`${APP}/@footer/default.tsx`)).toBe(true);
  });
});
