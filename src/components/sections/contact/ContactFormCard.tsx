/* The form gets its copy translated here, so the contact messages never ship in the shared
   client catalogue. */
import { getTranslations } from "next-intl/server";
import { ContactForm, type ContactFormCopy } from "@/components/sections/contact/ContactForm";
import { getPathname } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { CONTACT_FORM_ID, mapFields, TOPICS } from "@/lib/contact-schema";
import { SITE } from "@/lib/site";

export interface ContactFormCardProps {
  locale: Locale;
}

export async function ContactFormCard({ locale }: ContactFormCardProps) {
  const t = await getTranslations("contact.form");
  const cursor = await getTranslations("contact.cursor");

  const copy: ContactFormCopy = {
    labels: mapFields((f) => t(`labels.${f}`)),
    errors: mapFields((f) => t(`errors.${f}`)),
    topics: TOPICS.map((key) => ({ key, label: t(`topics.${key}`) })),
    topicPlaceholder: t("topicPlaceholder"),
    hint: t("hint"),
    honeypot: t("honeypot"),
    privacy: t("privacy"),
    submit: t("submit"),
    sending: t("sending"),
    success: { title: t("success.title"), text: t("success.text"), again: t("success.again") },
    failed: {
      send: t("failed.send"),
      rateLimit: t("failed.rateLimit"),
      refused: t("failed.refused"),
      direct: t.rich("failed.direct", {
        email: SITE.email,
        mail: (chunks) => <a href={`mailto:${SITE.email}`}>{chunks}</a>,
        linkedin: (chunks) => (
          <a href={SITE.linkedin} target="_blank" rel="noopener noreferrer">
            {chunks}
          </a>
        ),
      }),
    },
    toast: {
      region: t("toast.region"),
      close: t("toast.close"),
      sent: t("toast.sent"),
      failed: t("toast.failed"),
      rateLimit: t("toast.rateLimit"),
    },
    cursor: cursor("send"),
  };

  return (
    <div className="card">
      <h2 className="display h-sm">{t("title")}</h2>
      <p className="m-0 muted">{t("intro")}</p>
      <ContactForm
        id={CONTACT_FORM_ID}
        copy={copy}
        locale={locale}
        againHref={getPathname({ href: "/contact", locale })}
      />
    </div>
  );
}
