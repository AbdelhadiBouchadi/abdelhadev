/* The WhatsApp card (prototype .card.night.wa-card), night inside the day section: the heading,
   the live preview and the button (WhatsAppLive), the number as text, and what happens next
   (children: NextSteps). The tone is the card's own (data-tone, for its colours and the button);
   it is not a section, so the shell keeps the section's day tone, as in the prototype. */
import { getTranslations } from "next-intl/server";
import type { ReactNode } from "react";
import { WhatsAppLive } from "@/components/sections/contact/WhatsAppLive";
import { CONTACT_FORM_ID, TOPICS } from "@/lib/contact-schema";
import { SITE } from "@/lib/site";

export interface WhatsAppCardProps {
  children?: ReactNode;
}

export async function WhatsAppCard({ children }: WhatsAppCardProps) {
  const t = await getTranslations("contact.whatsapp");
  const form = await getTranslations("contact.form");
  const cursor = await getTranslations("contact.cursor");
  const footer = await getTranslations("footer");

  return (
    <div className="card night wa-card" data-tone="night">
      <h2 className="display h-sm">{t("title")}</h2>
      <p className="m-0 muted">{t("intro")}</p>
      <WhatsAppLive
        formId={CONTACT_FORM_ID}
        copy={{ greeting: t("greeting"), name: t.raw("name"), topic: t.raw("topic") }}
        base={SITE.whatsapp.href}
        topics={Object.fromEntries(TOPICS.map((key) => [key, form(`topics.${key}`)]))}
        action={t("action")}
        previewLabel={t("previewLabel")}
        newTab={footer("newTab")}
        cursor={cursor("whatsapp")}
      />
      <p className="number m-0">
        <span className="sr">{t("numberLabel")} </span>
        {SITE.whatsapp.display}
      </p>
      {children}
    </div>
  );
}
