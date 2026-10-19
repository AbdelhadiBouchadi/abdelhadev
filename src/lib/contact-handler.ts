/* The outside world (mailer, guard, clock, log) comes in as arguments, so every branch is
   unit-tested without the network. Logs hold fixed phrases and provider codes, never what the
   visitor typed. */
import "server-only";
import {
  readContactForm,
  validateContact,
  valuesOf,
  type ContactData,
  type ContactState,
  type Topic,
} from "@/lib/contact-schema";
import type { ContactEmailProps } from "@/emails/contact-form";
import type { Guard } from "@/lib/guard";
import type { Mailer } from "@/lib/mailer";
import { SITE } from "@/lib/site";

export interface ContactDeps {
  dryRun: boolean;
  /** null outside production when the key is missing (src/lib/env.ts). */
  mailer: Mailer | null;
  guard: Guard | null;
  from: string;
  to: string | null;
  /** In French whatever the page language: the email is only for me. */
  topicLabel: (data: ContactData) => Promise<string>;
  now: () => Date;
  log: (line: string) => void;
}

/** "[Abdelhadev] Une boutique en ligne - Amina" */
export const contactSubject = (topic: string, name: string) => `[Abdelhadev] ${topic} - ${name}`;

/** French, Agadir time. */
export const sentAt = (at: Date) =>
  new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "long",
    timeStyle: "short",
    timeZone: SITE.timeZone,
  }).format(at);

export function contactContent(data: ContactData, topic: string, at: Date): ContactEmailProps {
  return {
    name: data.name,
    email: data.email,
    topic,
    message: data.message,
    locale: data.locale,
    sentAt: sentAt(at),
  };
}

export function contactBody(data: ContactData, topic: string, at: Date): string {
  return [
    "Nouveau message depuis abdelhadev.me",
    "",
    `Nom : ${data.name}`,
    `E-mail : ${data.email}`,
    `Projet : ${topic} (${data.topic satisfies Topic})`,
    "",
    "Message :",
    data.message,
    "",
    "---",
    `Langue de la page : ${data.locale}`,
    `Envoyé le ${sentAt(at)}`,
  ].join("\n");
}

export async function handleContact(data: FormData, deps: ContactDeps): Promise<ContactState> {
  const input = readContactForm(data);

  if (input.company !== "") {
    deps.log("contact: honeypot filled, nothing sent");
    return { status: "sent" };
  }

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
    const verdict = await deps.guard.check();
    if (verdict === "rateLimit") {
      deps.log("contact: rate limited");
      return { status: "failed", reason: "rateLimit", values: valuesOf(input) };
    }
    if (verdict === "bot") {
      deps.log("contact: bot refused, nothing sent");
      return { status: "sent" };
    }
  } else {
    deps.log("contact: ARCJET_KEY not set, no rate limit (allowed outside production)");
  }

  if (!deps.mailer || !deps.to) {
    deps.log("contact: RESEND_API_KEY or CONTACT_TO not set, nothing sent (outside production)");
    return { status: "failed", reason: "send", values: valuesOf(input) };
  }

  const topic = await deps.topicLabel(checked.data);
  const at = deps.now();
  const result = await deps.mailer.send({
    from: deps.from,
    to: deps.to,
    replyTo: checked.data.email,
    subject: contactSubject(topic, checked.data.name),
    text: contactBody(checked.data, topic, at),
    content: contactContent(checked.data, topic, at),
  });
  if (!result.ok) {
    deps.log(`contact: resend failed (${result.code})`);
    return { status: "failed", reason: "send", values: valuesOf(input) };
  }
  deps.log("contact: sent");
  return { status: "sent" };
}
