/* Resend's message text never leaves this module: a failure comes back with a provider code only.
   Plain text only: no HTML part means no layout, no images and no tracking pixel. */
import "server-only";
import { Resend } from "resend";

export interface Mail {
  from: string;
  to: string;
  replyTo: string;
  subject: string;
  text: string;
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
