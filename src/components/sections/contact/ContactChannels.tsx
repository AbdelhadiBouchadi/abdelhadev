/* The two ways to write (prototype .contact-layout), day: the form card and the night WhatsApp
   card, side by side from 901 px (7 to 5), stacked below. The cards fade up one after the other
   after the hero lead (Reveal, CONTACT.cards). */
import { getTranslations } from "next-intl/server";
import type { ReactNode } from "react";
import { CONTACT } from "@/lib/motion";
import { Reveal } from "@/primitives/Reveal";
import { ToneSection } from "@/primitives/ToneSection";

export interface ContactChannelsProps {
  children: ReactNode;
}

export async function ContactChannels({ children }: ContactChannelsProps) {
  const t = await getTranslations("contact");
  return (
    <ToneSection tone="day" aria-label={t("channels")}>
      <Reveal
        when="ready"
        y={CONTACT.cards.y}
        delay={CONTACT.cards.delay}
        duration={CONTACT.cards.duration}
        stagger={CONTACT.cards.stagger}
        className="contact-layout wrap"
      >
        {children}
      </Reveal>
    </ToneSection>
  );
}
