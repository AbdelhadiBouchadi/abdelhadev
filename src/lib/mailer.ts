/* Resend's message text never leaves this module: a failure comes back with a provider code only. */
import "server-only";
import { createElement } from "react";
import { Resend } from "resend";
import { ContactFormEmail, type ContactEmailProps } from "@/emails/contact-form";

export interface Mail {
  from: string;
  to: string;
  replyTo: string;
  subject: string;
  text: string;
  content: ContactEmailProps;
}

export type MailResult = { ok: true } | { ok: false; code: string };

export interface Mailer {
  send(mail: Mail): Promise<MailResult>;
}

export function createResendMailer(apiKey: string): Mailer {
  const resend = new Resend(apiKey);
  return {
    async send(mail) {
      try {
        const { error } = await resend.emails.send({
          from: mail.from,
          to: [mail.to],
          replyTo: mail.replyTo,
          subject: mail.subject,
          react: createElement(ContactFormEmail, mail.content),
          text: mail.text,
        });
        if (error)
          return { ok: false, code: `${error.name} ${String(error.statusCode ?? "network")}` };
        return { ok: true };
      } catch {
        return { ok: false, code: "exception" };
      }
    },
  };
}
