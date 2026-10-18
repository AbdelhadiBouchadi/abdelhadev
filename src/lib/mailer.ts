/* The one place that talks to Resend. The contact handler depends on the `Mailer` interface, so
   its tests pass a fake and never touch the network. Each message goes out as the React template
   (src/emails/contact-form.tsx, which Resend renders with @react-email/render) and its plain-text
   twin. A failure comes back as a value with a provider code only: Resend's message text never
   leaves this module (it is not logged and never reaches the browser). */
import "server-only";
import { createElement } from "react";
import { Resend } from "resend";
import { ContactFormEmail, type ContactEmailProps } from "@/emails/contact-form";

export interface Mail {
  from: string;
  to: string;
  replyTo: string;
  subject: string;
  /** The plain-text version. */
  text: string;
  /** What the HTML template shows. */
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
