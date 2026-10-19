// The schema and its error keys in both locales, the handler's branches with a fake mailer and
// guard, no personal data in any log line, the WhatsApp composer and the environment rules.
import { render } from "@react-email/render";
import { createElement } from "react";
import { describe, expect, it, vi } from "vitest";
import en from "@messages/en.json";
import fr from "@messages/fr.json";
import { ContactFormEmail } from "@/emails/contact-form";
import {
  contactBody,
  contactContent,
  contactSubject,
  handleContact,
  type ContactDeps,
} from "@/lib/contact-handler";
import {
  CONTACT_FIELDS,
  TOPICS,
  validateContact,
  readContactForm,
  type ContactInput,
} from "@/lib/contact-schema";
import { DEFAULT_CONTACT_FROM, parseEnv } from "@/lib/env";
import type { Guard, GuardVerdict } from "@/lib/guard";
import type { Mail, Mailer, MailResult } from "@/lib/mailer";
import { composeWhatsApp, whatsAppHref } from "@/lib/whatsapp";

const VALID: ContactInput = {
  name: "Amina Haddad",
  email: "amina@clinique-exemple.ma",
  topic: "clinic",
  message: "Nous gérons nos rendez-vous sur papier et nous perdons du temps chaque jour.",
  company: "",
  locale: "fr",
};

const form = (input: Partial<ContactInput> = {}) => {
  const data = new FormData();
  for (const [key, value] of Object.entries({ ...VALID, ...input })) data.set(key, value);
  return data;
};

describe("contact schema", () => {
  it("accepts a complete message and trims it", () => {
    const result = validateContact({ ...VALID, name: "  Amina  " });
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.data.name).toBe("Amina");
  });

  it.each([
    ["name", "A"],
    ["name", "x".repeat(81)],
    ["email", "amina@"],
    ["email", `${"a".repeat(115)}@ex.ma`],
    ["topic", ""],
    ["topic", "pricing"],
    ["message", "Trop court."],
    ["message", "x".repeat(3001)],
  ] as const)("rejects %s = %j with the %s key", (field, value) => {
    const result = validateContact({ ...VALID, [field]: value });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors).toEqual({ [field]: field });
      expect(result.tampered).toBe(false);
    }
  });

  it("accepts the length limits exactly", () => {
    expect(validateContact({ ...VALID, name: "Al" }).ok).toBe(true);
    expect(validateContact({ ...VALID, name: "x".repeat(80) }).ok).toBe(true);
    expect(validateContact({ ...VALID, message: "x".repeat(20) }).ok).toBe(true);
    expect(validateContact({ ...VALID, message: "x".repeat(3000) }).ok).toBe(true);
  });

  it("reports a filled honeypot or an unknown locale as tampering, not a field error", () => {
    for (const input of [
      { ...VALID, company: "ACME" },
      { ...VALID, locale: "de" },
    ]) {
      const result = validateContact(input);
      expect(result.ok).toBe(false);
      if (!result.ok) expect(result).toMatchObject({ errors: {}, tampered: true });
    }
  });

  it("has an error message, a label and topic labels in both locales", () => {
    for (const messages of [fr, en]) {
      for (const field of CONTACT_FIELDS) {
        expect(messages.contact.form.errors[field]).toBeTruthy();
        expect(messages.contact.form.labels[field]).toBeTruthy();
      }
      for (const topic of TOPICS) expect(messages.contact.form.topics[topic]).toBeTruthy();
    }
    expect(fr.contact.form.errors.email).toBe(
      "Indiquez une adresse e-mail valide, par exemple nom@exemple.ma.",
    );
    expect(en.contact.form.errors.email).toBe("Enter an email address like name@example.com.");
  });

  it("reads a file field or a missing field as empty", () => {
    const data = new FormData();
    data.set("name", new Blob(["x"]));
    expect(readContactForm(data)).toMatchObject({ name: "", email: "", company: "" });
  });
});

function setup(options: { dryRun?: boolean; verdict?: GuardVerdict; result?: MailResult } = {}) {
  const sent: Mail[] = [];
  const lines: string[] = [];
  const mailer: Mailer = {
    send: vi.fn(async (mail: Mail): Promise<MailResult> => {
      sent.push(mail);
      return options.result ?? { ok: true };
    }),
  };
  const guard: Guard = {
    check: vi.fn(async (): Promise<GuardVerdict> => options.verdict ?? "allow"),
  };
  const deps: ContactDeps = {
    dryRun: options.dryRun ?? false,
    mailer,
    guard,
    from: DEFAULT_CONTACT_FROM,
    to: "inbox@example.test",
    topicLabel: async ({ topic }) => fr.contact.form.topics[topic],
    now: () => new Date("2026-10-18T09:30:00Z"),
    log: (line) => lines.push(line),
  };
  return { deps, sent, lines, mailer, guard };
}

const expectNoPersonalData = (lines: string[]) => {
  const all = lines.join("\n");
  for (const secret of [VALID.name, VALID.email, "Amina", "clinique-exemple", "rendez-vous"]) {
    expect(all).not.toContain(secret);
  }
};

describe("contact handler", () => {
  it("dry run: validates and reports success without Arcjet or Resend", async () => {
    const { deps, guard, mailer, lines } = setup({ dryRun: true });
    expect(await handleContact(form(), deps)).toEqual({ status: "sent" });
    expect(guard.check).not.toHaveBeenCalled();
    expect(mailer.send).not.toHaveBeenCalled();
    expectNoPersonalData(lines);
  });

  it("dry run: still returns field errors and keeps the visitor's words", async () => {
    const { deps, mailer } = setup({ dryRun: true });
    const state = await handleContact(form({ email: "nope", message: "Court." }), deps);
    expect(state).toEqual({
      status: "invalid",
      errors: { email: "email", message: "message" },
      values: { name: VALID.name, email: "nope", topic: VALID.topic, message: "Court." },
    });
    expect(mailer.send).not.toHaveBeenCalled();
  });

  it("honeypot: reports success and sends nothing", async () => {
    const { deps, guard, mailer, lines } = setup();
    expect(await handleContact(form({ company: "ACME" }), deps)).toEqual({ status: "sent" });
    expect(guard.check).not.toHaveBeenCalled();
    expect(mailer.send).not.toHaveBeenCalled();
    expectNoPersonalData(lines);
  });

  it("rate limited: the translated error key, the words kept, nothing sent", async () => {
    const { deps, mailer, lines } = setup({ verdict: "rateLimit" });
    const state = await handleContact(form(), deps);
    expect(state).toMatchObject({ status: "failed", reason: "rateLimit" });
    expect(state.status === "failed" && state.values.message).toBe(VALID.message);
    expect(mailer.send).not.toHaveBeenCalled();
    expectNoPersonalData(lines);
  });

  it("bot: a silent success, nothing sent", async () => {
    const { deps, mailer } = setup({ verdict: "bot" });
    expect(await handleContact(form(), deps)).toEqual({ status: "sent" });
    expect(mailer.send).not.toHaveBeenCalled();
  });

  it("mailer failure: the send error, never the provider's text", async () => {
    const { deps, lines } = setup({ result: { ok: false, code: "validation_error 422" } });
    const state = await handleContact(form(), deps);
    expect(state).toMatchObject({ status: "failed", reason: "send" });
    expect(JSON.stringify(state)).not.toContain("validation_error");
    expect(lines).toContain("contact: resend failed (validation_error 422)");
    expectNoPersonalData(lines);
  });

  it("missing keys outside production: says so in the log, reports a send error", async () => {
    const { deps, lines } = setup();
    const state = await handleContact(form(), { ...deps, mailer: null, guard: null });
    expect(state).toMatchObject({ status: "failed", reason: "send" });
    expect(lines.join("\n")).toMatch(/ARCJET_KEY not set/);
    expect(lines.join("\n")).toMatch(/RESEND_API_KEY or CONTACT_TO not set/);
    expectNoPersonalData(lines);
  });

  it("sends one email (template and text) to the inbox, replying to the visitor", async () => {
    const { deps, sent, lines } = setup();
    expect(await handleContact(form(), deps)).toEqual({ status: "sent" });
    expect(sent).toHaveLength(1);
    const [mail] = sent;
    const topic = fr.contact.form.topics.clinic;
    expect(mail).toMatchObject({
      from: DEFAULT_CONTACT_FROM,
      to: "inbox@example.test",
      replyTo: VALID.email,
      subject: `[Abdelhadev] ${topic} - ${VALID.name}`,
      content: { name: VALID.name, email: VALID.email, topic, message: VALID.message },
    });
    expect(mail?.text).toContain(VALID.message);
    expect(mail?.text).toContain("Langue de la page : fr");
    expect(mail?.content.sentAt).toContain("18 octobre 2026");
    expect(mail?.text).not.toMatch(/\b\d{1,3}(?:\.\d{1,3}){3}\b/);
    expect(lines).toEqual(["contact: sent"]);
  });

  it("builds the subject from the topic and the name", () => {
    expect(contactSubject("Autre chose", "Sami")).toBe("[Abdelhadev] Autre chose - Sami");
  });
});

describe("contact email", () => {
  const data = (() => {
    const result = validateContact({ ...VALID, topic: "other" });
    if (!result.ok) throw new Error("fixture is valid");
    return result.data;
  })();
  const topic = fr.contact.form.topics.other;
  const at = new Date("2026-10-18T09:30:00Z");

  it("renders the name, the email as a mailto link, the topic and the message", async () => {
    const html = await render(createElement(ContactFormEmail, contactContent(data, topic, at)));
    expect(html).toContain("Nouveau message depuis abdelhadev.me");
    expect(html).toContain(VALID.name);
    expect(html).toContain(`href="mailto:${VALID.email}"`);
    expect(html).toContain(topic);
    expect(html).toContain(VALID.message);
    expect(html).toContain("Répondre");
    expect(html).toContain("white-space:pre-wrap");
  });

  it("escapes HTML in the visitor's words", async () => {
    const hostile = {
      ...contactContent(data, topic, at),
      name: '<img src=x onerror="alert(1)">',
      message: '<script>alert("x")</script>\n<b>bold</b>',
    };
    const html = await render(createElement(ContactFormEmail, hostile));
    expect(html).not.toContain("<script>");
    expect(html).not.toContain("<b>bold</b>");
    expect(html).not.toContain("<img src=x");
    expect(html).toContain("&lt;script&gt;");
  });

  it("writes the same data in the text version", () => {
    const text = contactBody(data, topic, at);
    for (const value of [VALID.name, VALID.email, topic, VALID.message]) {
      expect(text).toContain(value);
    }
    expect(text).toContain(contactContent(data, topic, at).sentAt);
  });
});

const copyOf = (messages: typeof fr) => ({
  greeting: messages.contact.whatsapp.greeting,
  name: messages.contact.whatsapp.name,
  topic: messages.contact.whatsapp.topic,
});

describe("WhatsApp composer", () => {
  it("greets in the page language", () => {
    expect(composeWhatsApp(copyOf(fr), {})).toBe("Bonjour Abdelhadi,");
    expect(composeWhatsApp(copyOf(en), {})).toBe("Hello Abdelhadi,");
  });

  it("adds the name, the topic label and the message when present", () => {
    expect(
      composeWhatsApp(copyOf(en), {
        name: " Sami ",
        topic: en.contact.form.topics.shop,
        message: "I sell ceramics.",
      }),
    ).toBe("Hello Abdelhadi,\nMy name is Sami.\nMy project: An online shop.\n\nI sell ceramics.");
    expect(composeWhatsApp(copyOf(fr), { name: "Amina", topic: "", message: "  " })).toBe(
      "Bonjour Abdelhadi,\nJe m'appelle Amina.",
    );
  });

  it("encodes the text onto the wa.me link, or leaves the link bare", () => {
    const base = "https://wa.me/212637025032";
    expect(whatsAppHref(base)).toBe(base);
    expect(whatsAppHref(base, "Bonjour Abdelhadi,\nJe m'appelle Zoé & co ?")).toBe(
      `${base}?text=Bonjour%20Abdelhadi%2C%0AJe%20m'appelle%20Zo%C3%A9%20%26%20co%20%3F`,
    );
  });
});

describe("contact environment", () => {
  const production = {
    VERCEL_ENV: "production",
    RESEND_API_KEY: "re_test",
    CONTACT_TO: "inbox@example.test",
    ARCJET_KEY: "ajkey_test",
  };

  it("accepts a complete production configuration with the default sender", () => {
    expect(parseEnv(production)).toMatchObject({
      CONTACT_FROM: DEFAULT_CONTACT_FROM,
      CONTACT_DRY_RUN: "0",
    });
  });

  it("refuses a dry run in production, with a clear message", () => {
    expect(() => parseEnv({ ...production, CONTACT_DRY_RUN: "1" })).toThrow(
      /CONTACT_DRY_RUN=1 is not allowed in production/,
    );
  });

  it("requires the key, the inbox and Arcjet in production, naming each", () => {
    expect(() => parseEnv({ VERCEL_ENV: "production" })).toThrow(
      /RESEND_API_KEY[\s\S]*CONTACT_TO[\s\S]*ARCJET_KEY/,
    );
  });

  it("allows missing keys and a dry run outside production", () => {
    expect(parseEnv({ VERCEL_ENV: "preview", CONTACT_DRY_RUN: "1" }).CONTACT_DRY_RUN).toBe("1");
    expect(parseEnv({}).RESEND_API_KEY).toBeUndefined();
  });

  it("never echoes a value in its error", () => {
    expect(() => parseEnv({ CONTACT_TO: "secret-inbox-value" })).toThrow(
      expect.objectContaining({ message: expect.not.stringContaining("secret-inbox-value") }),
    );
  });
});
