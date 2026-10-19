/* An ordered list: the order is my priority. */
import { getTranslations } from "next-intl/server";
import { ArrowLink } from "@/components/ui/ArrowLink";
import { SERVICES } from "@/lib/content/about";
import { ABOUT } from "@/lib/motion";
import { Reveal } from "@/primitives/Reveal";
import { ToneSection } from "@/primitives/ToneSection";
import { TransitionLink } from "@/primitives/TransitionLink";

export async function Services() {
  const t = await getTranslations("about.services");
  const nav = await getTranslations("nav");
  return (
    <ToneSection tone="day" id="services" className="about-pad" aria-labelledby="services-title">
      <div className="wrap">
        <div className="section-head">
          <h2 id="services-title" className="display h-md">
            {t("title")}
          </h2>
        </div>
        <Reveal as="ol" when="enter" stagger={ABOUT.stagger.services} className="services">
          {SERVICES.map((key) => (
            <li key={key} data-service={key}>
              <h3>{t(`items.${key}.title`)}</h3>
              <p>{t(`items.${key}.text`)}</p>
            </li>
          ))}
        </Reveal>
        <div className="services-foot">
          <ArrowLink as={TransitionLink} href="/contact">
            {nav("contact")}
          </ArrowLink>
        </div>
      </div>
    </ToneSection>
  );
}
