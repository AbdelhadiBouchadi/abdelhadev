/* The outside world (mailer, guard, log) comes in as arguments, so every branch is unit-tested
   without the network. Logs hold fixed phrases, reason codes and provider codes, never what the
   visitor typed. */
import "server-only";
import {
  readContactForm,
  validateContact,
  valuesOf,
  type ContactData,
  type ContactInput,
  type ContactState,
  type Topic,
} from "@/lib/contact-schema";
import type { Guard } from "@/lib/guard";
import type { Mailer } from "@/lib/mailer";
import type { Locale } from "@/i18n/routing";

export interface ContactDeps {
  dryRun: boolean;
  /** null outside production when the key is missing (src/lib/env.ts). */
  mailer: Mailer | null;
  guard: Guard | null;
  from: string | null;
  to: string | null;
  /** In French whatever the page language: the email is only for me. */
  topicLabel: (data: ContactData) => Promise<string>;
  log: (line: string) => void;
}

/** One per check that can turn a visitor away, so the log tells them apart. */
export type RefusalReason = "honeypot" | "arcjet_rate" | "arcjet_bot" | "arcjet_other";

const SUBJECT_NAME_MAX = 60;

const SUBJECTS: Record<Locale, (name: string) => string> = {
  fr: (name) => `Nouveau message de ${name}`,
  en: (name) => `New message from ${name}`,
};

/** Control and format characters (line breaks included) would let a name write mail headers. */
export function subjectName(name: string): string {
  const flat = name
    .replace(/[\p{Cc}\p{Cf}\p{Zl}\p{Zp}]+/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
  const chars = Array.from(flat);
  if (chars.length <= SUBJECT_NAME_MAX) return flat;
  return `${chars
    .slice(0, SUBJECT_NAME_MAX - 1)
    .join("")
    .trimEnd()}…`;
}

/** In the language the visitor wrote in. */
export const contactSubject = (name: string, locale: Locale) => SUBJECTS[locale](subjectName(name));

export function contactBody(data: ContactData, topic: string): string {
  return [
    `Nom : ${data.name}`,
    `E-mail : ${data.email}`,
    `Projet : ${topic} (${data.topic satisfies Topic})`,
    `Langue de la page : ${data.locale}`,
    "",
    data.message,
  ].join("\n");
}

function refuse(
  deps: ContactDeps,
  input: ContactInput,
  reason: RefusalReason,
  detail?: string,
): ContactState {
  deps.log(`contact: refused reason=${reason}${detail ? ` ${detail}` : ""}`);
  return {
    status: "failed",
    reason: reason === "arcjet_rate" ? "rateLimit" : "refused",
    values: valuesOf(input),
  };
}

export async function handleContact(data: FormData, deps: ContactDeps): Promise<ContactState> {
  const input = readContactForm(data);

  if (input.extra !== "") return refuse(deps, input, "honeypot");

  const checked = validateContact(input);
  if (!checked.ok) {
    if (checked.tampered) deps.log("contact: unexpected form fields");
    return { status: "invalid", errors: checked.errors, values: valuesOf(input) };
  }

  if (deps.dryRun) {
    deps.log("contact: dry run, nothing sent");
    return { status: "sent" };
  }

  if (deps.guard) {
    const result = await deps.guard.check();
    if (result.verdict === "rateLimit") return refuse(deps, input, "arcjet_rate", result.detail);
    if (result.verdict === "bot") return refuse(deps, input, "arcjet_bot", result.detail);
    if (result.verdict === "other") return refuse(deps, input, "arcjet_other", result.detail);
  } else {
    deps.log("contact: ARCJET_KEY not set, no rate limit (allowed outside production)");
  }

  if (!deps.mailer || !deps.to || !deps.from) {
    deps.log(
      "contact: RESEND_API_KEY, CONTACT_TO or CONTACT_FROM not set, nothing sent (outside production)",
    );
    return { status: "failed", reason: "send", values: valuesOf(input) };
  }

  const result = await deps.mailer.send({
    from: deps.from,
    to: deps.to,
    replyTo: checked.data.email,
    subject: contactSubject(checked.data.name, checked.data.locale),
    text: contactBody(checked.data, await deps.topicLabel(checked.data)),
  });
  if (!result.ok) {
    deps.log(`contact: resend failed (${result.code})`);
    return { status: "failed", reason: "send", values: valuesOf(input) };
  }
  deps.log("contact: sent");
  return { status: "sent" };
}
