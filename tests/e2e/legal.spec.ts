import { expect, test } from "@playwright/test";
import { LEGAL_NAME, ROUTES } from "./routes";

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
  for (const path of ["/fr/mentions-legales", "/en/legal-notice"]) {
    test(`${path} renders the full notice with nothing it must not publish`, async ({
      request,
    }) => {
      const html = await (await request.get(path)).text();
      const main = /<main[\s\S]*?<\/main>/.exec(html)?.[0] ?? "";
      expect(main).toContain("<h1");
      // Publisher, director, host, IP, data, storage, links.
      expect(main.match(/<h2/g)?.length ?? 0).toBeGreaterThanOrEqual(7);
      expect(main).toContain(LEGAL_NAME);
      expect(main).toContain("Vercel Inc.");
      expect(main).toContain("Resend");
      expect(main).not.toMatch(/\b(ICE|RC|IF|CNIE|IBAN|RIB)\b/);
    });
  }
});
