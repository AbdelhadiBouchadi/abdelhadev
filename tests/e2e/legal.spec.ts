import { readFileSync } from "node:fs";
import { expect, test } from "@playwright/test";
import { SITE } from "@/lib/site";
import { LEGAL_NAME, ROUTES } from "./routes";

interface LegalMessages {
  pages: {
    legal: {
      data: { retentionValue: string };
      credits: { title: string; body: string; dicebear: string; licence: string };
    };
  };
}
const MESSAGES: Record<"fr" | "en", LegalMessages> = {
  fr: JSON.parse(readFileSync("messages/fr.json", "utf8")),
  en: JSON.parse(readFileSync("messages/en.json", "utf8")),
};
const LEGAL = { fr: "/fr/mentions-legales", en: "/en/legal-notice" } as const;

// The legal name is plain, server-rendered text in the footer of every page (AGENTS.md).
for (const route of ROUTES) {
  test(`raw HTML of ${route.path} has the legal name in the footer`, async ({ request }) => {
    const response = await request.get(route.path);
    expect(response.status()).toBe(200);
    const html = await response.text();
    const footer = /<footer[\s\S]*?<\/footer>/.exec(html)?.[0] ?? "";
    expect(footer).toContain(LEGAL_NAME);
  });
}

test.describe("legal notice", () => {
  for (const path of Object.values(LEGAL)) {
    test(`${path} renders the full notice with nothing it must not publish`, async ({
      request,
    }) => {
      const html = await (await request.get(path)).text();
      const main = /<main[\s\S]*?<\/main>/.exec(html)?.[0] ?? "";
      expect(main).toContain("<h1");
      // Publisher, director, host, IP, data, storage, links, credits.
      expect(main.match(/<h2/g)?.length ?? 0).toBeGreaterThanOrEqual(8);
      expect(main).toContain(LEGAL_NAME);
      expect(main).toContain("Vercel Inc.");
      expect(main).toContain("Resend");
      expect(main).not.toMatch(/\b(ICE|RC|IF|CNIE|IBAN|RIB)\b/);
      expect(main).not.toContain("[TODO");
    });
  }

  for (const locale of ["fr", "en"] as const) {
    test(`${locale}: the retention period and the credits, with their links in a new tab`, async ({
      page,
    }) => {
      const m = MESSAGES[locale].pages.legal;
      await page.goto(LEGAL[locale]);
      const main = page.locator("main");
      await expect(main).toContainText(m.data.retentionValue);
      const credits = page.locator('section[aria-labelledby="legal-credits"]');
      await expect(credits.getByRole("heading", { level: 2 })).toHaveText(m.credits.title);
      await expect(credits).toContainText(m.credits.body);
      for (const key of ["dicebear", "licence"] as const) {
        const link = credits.locator(`a[data-credit="${key}"]`);
        await expect(link).toHaveAttribute("href", SITE.credits[key]);
        await expect(link).toHaveAttribute("target", "_blank");
        await expect(link).toHaveAttribute("rel", "noopener noreferrer");
        await expect(link).toContainText(m.credits[key]);
        const box = await link.boundingBox();
        expect(box?.height ?? 0, key).toBeGreaterThanOrEqual(44);
      }
      // The credits close the notice.
      await expect(main.locator("section").last()).toHaveAttribute(
        "aria-labelledby",
        "legal-credits",
      );
    });
  }
});
