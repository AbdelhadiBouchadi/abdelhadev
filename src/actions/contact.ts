"use server";

/* The logic and its tests live in src/lib/contact-handler.ts; this wires in the environment. */
import { getTranslations } from "next-intl/server";
import { handleContact } from "@/lib/contact-handler";
import type { ContactState } from "@/lib/contact-schema";
import { arcjetMode, env } from "@/lib/env";
import { createArcjetGuard } from "@/lib/guard";
import { createResendMailer } from "@/lib/mailer";

const log = (line: string) => {
  console.info(line);
};

// One client each per server instance, created on first use.
const mailer = env.RESEND_API_KEY ? createResendMailer(env.RESEND_API_KEY) : null;
const guard = env.ARCJET_KEY
  ? createArcjetGuard(env.ARCJET_KEY, arcjetMode(env.VERCEL_ENV), log)
  : null;

export async function sendContact(_previous: ContactState, data: FormData): Promise<ContactState> {
  return handleContact(data, {
    dryRun: env.CONTACT_DRY_RUN === "1",
    mailer,
    guard,
    from: env.CONTACT_FROM ?? null,
    to: env.CONTACT_TO ?? null,
    // The email is only for me, so its topic label is always French (docs/decisions.md).
    topicLabel: async ({ topic }) => {
      const t = await getTranslations({ locale: "fr", namespace: "contact.form.topics" });
      return t(topic);
    },
    log,
  });
}
