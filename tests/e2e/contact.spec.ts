// The contact page at 1440 and 390, in both locales, against the dry run (CONTACT_DRY_RUN=1:
// nothing is sent): errors and focus, the WhatsApp preview, success, the native post without
// JavaScript, reduced motion and axe.
import AxeBuilder from "@axe-core/playwright";
import { readFileSync } from "node:fs";
import { expect, test, type Page } from "@playwright/test";
import { CONTACT_FIELDS } from "@/lib/contact-schema";
import { SITE } from "@/lib/site";
import { shellIdle, visited } from "./shell-helpers";

interface ContactMessages {
  contact: {
    title: string;
    form: {
      labels: Record<string, string>;
      topics: Record<string, string>;
      errors: Record<string, string>;
      submit: string;
      success: { title: string; again: string };
      toast: { sent: string };
    };
    whatsapp: { greeting: string; name: string; topic: string; action: string };
  };
}
const MESSAGES: Record<"fr" | "en", ContactMessages> = {
  fr: JSON.parse(readFileSync("messages/fr.json", "utf8")),
  en: JSON.parse(readFileSync("messages/en.json", "utf8")),
};
const LOCALES = ["fr", "en"] as const;

const VISITOR = {
  name: "Amina",
  email: "amina@exemple.ma",
  topic: "clinic",
  message: "Nous gérons les rendez-vous sur papier et nous perdons du temps chaque jour.",
};

const field = (page: Page, name: string) => page.locator(`#contact-form [name="${name}"]`);

async function fill(page: Page) {
  await field(page, "name").fill(VISITOR.name);
  await field(page, "email").fill(VISITOR.email);
  await field(page, "topic").selectOption(VISITOR.topic);
  await field(page, "message").fill(VISITOR.message);
}

for (const locale of LOCALES) {
  const t = MESSAGES[locale].contact;
  const path = `/${locale}/contact`;

  test.describe(`contact ${path}`, () => {
    test.beforeEach(async ({ page }) => {
      await visited(page);
    });

    test("an invalid submit shows the errors, marks the fields and focuses the first", async ({
      page,
    }) => {
      await page.goto(path);
      await shellIdle(page);
      await field(page, "email").fill("amina@");
      await page.getByRole("button", { name: t.form.submit }).click();

      for (const name of CONTACT_FIELDS) {
        await expect(field(page, name)).toHaveAttribute("aria-invalid", "true");
        await expect(page.locator(`#e-${name}`)).toHaveText(t.form.errors[name] ?? "");
        await expect(field(page, name)).toHaveAttribute(
          "aria-describedby",
          new RegExp(`e-${name}`),
        );
      }
      await expect(field(page, "name")).toBeFocused();
      await expect(field(page, "message")).toHaveAttribute(
        "aria-describedby",
        "h-message e-message",
      );

      // axe once, with the errors on screen: no serious or critical issue.
      const results = await new AxeBuilder({ page }).include("main").analyze();
      const blocking = results.violations.filter((v) =>
        ["serious", "critical"].includes(v.impact ?? ""),
      );
      expect(blocking.map((v) => `${v.id}: ${v.nodes.map((n) => n.target).join(", ")}`)).toEqual(
        [],
      );
    });

    test("typing updates the WhatsApp preview and link in the page language", async ({ page }) => {
      await page.goto(path);
      await shellIdle(page);
      const preview = page.locator(".wa-preview");
      const link = page.locator(".wa-card a[href^='https://wa.me/']");
      await expect(preview).toHaveText(t.whatsapp.greeting);

      await fill(page);
      const expected = [
        t.whatsapp.greeting,
        t.whatsapp.name.replace("{name}", VISITOR.name),
        t.whatsapp.topic.replace("{topic}", t.form.topics[VISITOR.topic] ?? ""),
        "",
        VISITOR.message,
      ].join("\n");
      await expect(preview).toHaveText(expected);
      await expect(preview).toHaveAttribute("aria-live", "polite");
      await expect(link).toHaveAttribute(
        "href",
        `${SITE.whatsapp.href}?text=${encodeURIComponent(expected)}`,
      );
      await expect(page.locator(".wa-card .number")).toContainText(SITE.whatsapp.display);
    });

    test("a valid submit shows the confirmation; Write another message resets", async ({
      page,
    }) => {
      await page.goto(path);
      await shellIdle(page);
      await fill(page);
      await page.getByRole("button", { name: t.form.submit }).click();

      const done = page.getByRole("heading", { name: t.form.success.title });
      await expect(done).toBeVisible();
      await expect(done).toBeFocused();
      await expect(page.locator("#contact-form")).toBeHidden();
      // The toast repeats it, politely, without taking focus; the inline confirmation stays.
      const toast = page.locator("[data-sonner-toast]");
      await expect(toast).toBeVisible();
      await expect(toast).toContainText(t.form.toast.sent);
      await expect(page.locator("[data-sonner-toaster]").locator("xpath=..")).toHaveAttribute(
        "aria-live",
        "polite",
      );
      await expect(done).toBeFocused();

      await page.getByRole("link", { name: t.form.success.again }).click();
      await expect(page.locator("#contact-form")).toBeVisible();
      await expect(done).toBeHidden();
      for (const name of CONTACT_FIELDS) await expect(field(page, name)).toHaveValue("");
      await expect(field(page, "name")).toBeFocused();
      await expect(page.locator(".wa-preview")).toHaveText(t.whatsapp.greeting);
      expect(page.url()).toContain(path);
    });

    test("complete and still under reduced motion, with no horizontal overflow", async ({
      browser,
    }, info) => {
      const context = await browser.newContext({
        ...info.project.use,
        reducedMotion: "reduce",
      });
      const page = await context.newPage();
      await page.goto(path);
      await shellIdle(page);
      const hidden = await page.locator("main *").evaluateAll(
        (els) =>
          els.filter((el) => {
            if (el.closest("[hidden]")) return false;
            const s = getComputedStyle(el);
            return s.visibility === "hidden" || Number(s.opacity) === 0;
          }).length,
      );
      expect(hidden).toBe(0);
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      );
      expect(overflow).toBeLessThanOrEqual(0);
      await context.close();
    });

    test.describe("without JavaScript", () => {
      test.use({ javaScriptEnabled: false });

      test("the raw HTML has the form, and a native post returns errors then success", async ({
        page,
        request,
      }) => {
        const html = await (await request.get(path)).text();
        expect(html).toContain('id="contact-form"');
        for (const name of [...CONTACT_FIELDS, "company", "locale"]) {
          expect(html).toContain(`name="${name}"`);
        }
        expect(html).toContain(`href="${SITE.whatsapp.href}"`);

        await page.goto(path);
        await page.getByRole("button", { name: t.form.submit }).click();
        await expect(page.locator("#e-name")).toHaveText(t.form.errors.name ?? "");
        await expect(field(page, "name")).toHaveAttribute("aria-invalid", "true");

        await fill(page);
        await page.getByRole("button", { name: t.form.submit }).click();
        await expect(page.getByRole("heading", { name: t.form.success.title })).toBeVisible();
        await expect(page.locator("#contact-form")).toBeHidden();
        await expect(page.getByRole("link", { name: t.form.success.again })).toHaveAttribute(
          "href",
          path,
        );
        // No toast and no error without JavaScript: the inline confirmation is the feedback.
        await expect(page.locator("[data-sonner-toast]")).toHaveCount(0);
        await expect(page.locator(".error, .form-failed")).toHaveCount(0);
      });
    });
  });
}
