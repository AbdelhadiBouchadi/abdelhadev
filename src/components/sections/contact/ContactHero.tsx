/* The contact hero (prototype .contact-hero), day. The title lines rise at the loader's ready
   signal (SplitReveal); the lead fades up CONTACT.lead.delay after it (Reveal). Painted under the
   loader overlay, complete without JavaScript and under reduced motion. */
import { getTranslations } from "next-intl/server";
import { CONTACT } from "@/lib/motion";
import { Reveal } from "@/primitives/Reveal";
import { SplitReveal } from "@/primitives/SplitReveal";
import { ToneSection } from "@/primitives/ToneSection";

export async function ContactHero() {
  const t = await getTranslations("contact");
  return (
    <ToneSection tone="day" className="contact-hero">
      <div className="wrap">
        <SplitReveal
          as="h1"
          type="lines"
          when="ready"
          tabIndex={-1}
          className="contact-title display h-xl"
        >
          {t("title")}
        </SplitReveal>
        <Reveal
          as="p"
          targets="self"
          when="ready"
          y={CONTACT.lead.y}
          delay={CONTACT.lead.delay}
          className="lead mt-6 muted"
        >
          {t("lead")}
        </Reveal>
      </div>
    </ToneSection>
  );
}
