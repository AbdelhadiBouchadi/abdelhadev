// Motion evidence for the contact page (prompts/07-contact.md, "Evidence"), in test-results/motion/,
// to compare with docs/prototype/contact.html: two clips at 1440 (the intro after the loader, then
// validation errors followed by a sent message) and full-page stills at 1440 and 390.
import { mkdirSync, rmSync } from "node:fs";
import { test } from "@playwright/test";
import { DESKTOP, MOTION_OUT, PHONE, record } from "./motion-helpers";
import { shellIdle, visited } from "./shell-helpers";

const CONTACT = "/fr/contact";

test.describe.configure({ mode: "serial" });
test.beforeEach(() => {
  test.skip(test.info().project.name !== "1440", "recorded once");
  test.setTimeout(90_000);
  mkdirSync(MOTION_OUT, { recursive: true });
});

test("contact intro after the loader", async ({ browser }) => {
  await record(browser, "contact-intro-1440", DESKTOP, async (page) => {
    await page.goto(CONTACT);
    await shellIdle(page);
    await page.waitForTimeout(2600);
  });
  // The full-page stills below make the evidence; the intro's end frame repeats the 1440 one.
  rmSync(`${MOTION_OUT}/contact-intro-1440.png`, { force: true });
});

test("contact validation then success", async ({ browser }) => {
  await record(browser, "contact-form-1440", DESKTOP, async (page) => {
    await page.goto(CONTACT);
    await shellIdle(page);
    await page.waitForTimeout(1800);
    await page.locator("#contact-form button[type=submit]").click();
    await page.waitForTimeout(1200);
    await page.locator("#f-name").pressSequentially("Amina", { delay: 40 });
    await page.locator("#f-email").pressSequentially("amina@exemple.ma", { delay: 25 });
    await page.locator("#f-topic").selectOption("clinic");
    await page
      .locator("#f-message")
      .pressSequentially("Nous gérons les rendez-vous sur papier, chaque jour.", { delay: 15 });
    await page.waitForTimeout(600);
    await page.locator("#contact-form button[type=submit]").click();
    await page.waitForTimeout(1800);
  });
});

test("contact full page at 1440 and 390", async ({ browser }) => {
  for (const [name, size, phone] of [
    ["contact-1440", DESKTOP, false],
    ["contact-390", PHONE, true],
  ] as const) {
    const context = await browser.newContext({
      viewport: size,
      ...(phone ? { isMobile: true, hasTouch: true, deviceScaleFactor: 2 } : {}),
      reducedMotion: "reduce",
    });
    const page = await context.newPage();
    await visited(page);
    await page.goto(CONTACT);
    await shellIdle(page);
    await page.evaluate(() => document.fonts.ready);
    await page.screenshot({ path: `${MOTION_OUT}/${name}.png`, fullPage: true });
    await context.close();
  }
});
