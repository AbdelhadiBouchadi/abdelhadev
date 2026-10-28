// The schema and its error keys in both locales, the handler's branches with a fake mailer and
// guard, no personal data in any log line, the WhatsApp composer and the environment rules.
import { describe, expect, it, vi } from "vitest";
import en from "@messages/en.json";
import fr from "@messages/fr.json";
import {
  contactBody,
  contactSubject,
  handleContact,
  subjectName,
  type ContactDeps,
} from "@/lib/contact-handler";
import {
  CONTACT_FIELDS,
  TOPICS,
  validateContact,
  readContactForm,
  type ContactInput,
} from "@/lib/contact-schema";
import { arcjetMode, parseEnv } from "@/lib/env";
import type { Guard, GuardVerdict } from "@/lib/guard";
import type { Mail, Mailer, MailResult } from "@/lib/mailer";
import { composeWhatsApp, whatsAppHref } from "@/lib/whatsapp";

const VALID: ContactInput = {
  name: "Amina Haddad",
  email: "amina@clinique-exemple.ma",
  topic: "clinic",
  message: "Nous gérons nos rendez-vous sur papier et nous perdons du temps chaque jour.",
  extra: "",
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
      { ...VALID, extra: "ACME" },
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
    expect(readContactForm(data)).toMatchObject({ name: "", email: "", extra: "" });
  });
});

const FROM = "Abdelhadev <contact@abdelhadev.me>";

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
    check: vi.fn(async (): Promise<GuardVerdict> => options.verdict ?? { verdict: "allow" }),
  };
  const deps: ContactDeps = {
    dryRun: options.dryRun ?? false,
    mailer,
    guard,
    from: FROM,
    to: "inbox@example.test",
    topicLabel: async ({ topic }) => fr.contact.form.topics[topic],
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

  it("honeypot: refused with its own reason, the words kept, nothing sent", async () => {
    const { deps, guard, mailer, lines } = setup();
    const state = await handleContact(form({ extra: "ACME" }), deps);
    expect(state).toMatchObject({ status: "failed", reason: "refused" });
    expect(state.status === "failed" && state.values.message).toBe(VALID.message);
    expect(guard.check).not.toHaveBeenCalled();
    expect(mailer.send).not.toHaveBeenCalled();
    expect(lines).toEqual(["contact: refused reason=honeypot"]);
    expect(lines.join("\n")).not.toContain("ACME");
    expectNoPersonalData(lines);
  });

  it("honeypot: an empty one is not a refusal", async () => {
    const { deps, lines } = setup();
    expect(await handleContact(form({ extra: "" }), deps)).toEqual({ status: "sent" });
    expect(lines.join("\n")).not.toContain("refused");
  });

  it("rate limited: the translated error key, the words kept, nothing sent", async () => {
    const detail = "arcjet=RATE_LIMIT conclusion=DENY id=lreq_1";
    const { deps, mailer, lines } = setup({ verdict: { verdict: "rateLimit", detail } });
    const state = await handleContact(form(), deps);
    expect(state).toMatchObject({ status: "failed", reason: "rateLimit" });
    expect(state.status === "failed" && state.values.message).toBe(VALID.message);
    expect(mailer.send).not.toHaveBeenCalled();
    expect(lines).toEqual([`contact: refused reason=arcjet_rate ${detail}`]);
    expectNoPersonalData(lines);
  });

  it.each([
    ["bot", "arcjet_bot", "arcjet=BOT conclusion=DENY denied=CURL spoofed=false id=lreq_2"],
    ["other", "arcjet_other", "arcjet=FILTER conclusion=DENY id=lreq_3"],
  ] as const)(
    "arcjet %s: a visible refusal with its own reason code, nothing sent",
    async (verdict, code, detail) => {
      const { deps, mailer, lines } = setup({ verdict: { verdict, detail } });
      const state = await handleContact(form(), deps);
      expect(state).toMatchObject({ status: "failed", reason: "refused" });
      expect(state.status === "failed" && state.values.message).toBe(VALID.message);
      expect(mailer.send).not.toHaveBeenCalled();
      expect(lines).toEqual([`contact: refused reason=${code} ${detail}`]);
      expectNoPersonalData(lines);
    },
  );

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
    expect(lines.join("\n")).toMatch(/RESEND_API_KEY, CONTACT_TO or CONTACT_FROM not set/);
    expectNoPersonalData(lines);
  });

  it("sends one plain-text email from my domain to the inbox, replying to the visitor", async () => {
    const { deps, sent, lines } = setup();
    expect(await handleContact(form(), deps)).toEqual({ status: "sent" });
    expect(sent).toHaveLength(1);
    const [mail] = sent;
    expect(mail).toEqual({
      from: FROM,
      to: "inbox@example.test",
      replyTo: VALID.email,
      subject: `Nouveau message de ${VALID.name}`,
      text: expect.any(String),
    });
    // Only these keys reach Resend: no html and no react part.
    expect(Object.keys(mail ?? {}).sort()).toEqual(["from", "replyTo", "subject", "text", "to"]);
    expect(mail?.text).toContain(VALID.message);
    expect(mail?.text).toContain("Langue de la page : fr");
    expect(mail?.text).not.toMatch(/<[a-z][\s\S]*>/i);
    expect(mail?.text).not.toMatch(/\b\d{1,3}(?:\.\d{1,3}){3}\b/);
    expect(lines).toEqual(["contact: sent"]);
  });

  it("missing sender: nothing sent, a send error", async () => {
    const { deps, mailer } = setup();
    const state = await handleContact(form(), { ...deps, from: null });
    expect(state).toMatchObject({ status: "failed", reason: "send" });
    expect(mailer.send).not.toHaveBeenCalled();
  });
});

describe("contact email", () => {
  const data = (() => {
    const result = validateContact({ ...VALID, topic: "other" });
    if (!result.ok) throw new Error("fixture is valid");
    return result.data;
  })();
  const topic = fr.contact.form.topics.other;

  it("writes the subject in the visitor's language", () => {
    expect(contactSubject("Sami", "fr")).toBe("Nouveau message de Sami");
    expect(contactSubject("Sami", "en")).toBe("New message from Sami");
  });

  it("keeps line breaks and control characters out of the subject", () => {
    const subject = contactSubject("Sami\r\nBcc: victim@example.test\u0000\u2028x", "en");
    expect(subject).not.toMatch(/[\r\n\u0000\u2028]/);
    expect(subject).toBe("New message from Sami Bcc: victim@example.test x");
  });

  it("trims a long name to a safe length", () => {
    const name = subjectName("x".repeat(80));
    expect(Array.from(name)).toHaveLength(60);
    expect(name.endsWith("…")).toBe(true);
    expect(subjectName("  Amina   Haddad ")).toBe("Amina Haddad");
  });

  it("writes the name, email, topic, message and page language as plain text", () => {
    const text = contactBody(data, topic);
    for (const value of [VALID.name, VALID.email, topic, VALID.message, "Langue de la page : fr"]) {
      expect(text).toContain(value);
    }
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
    CONTACT_FROM: FROM,
    ARCJET_KEY: "ajkey_test",
  };

  it("accepts a complete production configuration", () => {
    expect(parseEnv(production)).toMatchObject({ CONTACT_FROM: FROM, CONTACT_DRY_RUN: "0" });
    expect(parseEnv({ ...production, CONTACT_FROM: "contact@abdelhadev.me" }).CONTACT_FROM).toBe(
      "contact@abdelhadev.me",
    );
  });

  it("refuses a sender off my domain in production, and any sender over two lines", () => {
    expect(() =>
      parseEnv({ ...production, CONTACT_FROM: "Abdelhadev <onboarding@resend.dev>" }),
    ).toThrow(/CONTACT_FROM must be an address on abdelhadev\.me/);
    expect(() => parseEnv({ CONTACT_FROM: "A <a@abdelhadev.me>\nBcc: x@y.z" })).toThrow(
      /CONTACT_FROM/,
    );
  });

  it("refuses a dry run in production, with a clear message", () => {
    expect(() => parseEnv({ ...production, CONTACT_DRY_RUN: "1" })).toThrow(
      /CONTACT_DRY_RUN=1 is not allowed in production/,
    );
  });

  it("requires the key, the inbox, the sender and Arcjet in production, naming each", () => {
    expect(() => parseEnv({ VERCEL_ENV: "production" })).toThrow(
      /RESEND_API_KEY[\s\S]*CONTACT_TO[\s\S]*CONTACT_FROM[\s\S]*ARCJET_KEY/,
    );
  });

  it("allows missing keys and a dry run outside production", () => {
    expect(parseEnv({ VERCEL_ENV: "preview", CONTACT_DRY_RUN: "1" }).CONTACT_DRY_RUN).toBe("1");
    expect(parseEnv({}).RESEND_API_KEY).toBeUndefined();
  });

  it("runs Arcjet bot detection live in production only", () => {
    expect(arcjetMode(parseEnv(production).VERCEL_ENV)).toBe("LIVE");
    expect(arcjetMode(parseEnv({ VERCEL_ENV: "preview" }).VERCEL_ENV)).toBe("DRY_RUN");
    expect(arcjetMode(parseEnv({ VERCEL_ENV: "development" }).VERCEL_ENV)).toBe("DRY_RUN");
    expect(arcjetMode(parseEnv({}).VERCEL_ENV)).toBe("DRY_RUN");
  });

  it("never echoes a value in its error", () => {
    expect(() => parseEnv({ CONTACT_TO: "secret-inbox-value" })).toThrow(
      expect.objectContaining({ message: expect.not.stringContaining("secret-inbox-value") }),
    );
  });
});
