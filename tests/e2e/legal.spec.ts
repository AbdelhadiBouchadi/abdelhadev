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
