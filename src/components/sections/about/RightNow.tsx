/* The exploring card has no link: the automation app is never presented as a product. */
import { getTranslations } from "next-intl/server";
import { Mark } from "@/components/brand/Mark";
import { ArrowLink } from "@/components/ui/ArrowLink";
import { NOW } from "@/lib/content/about";
import { ABOUT } from "@/lib/motion";
import { Reveal } from "@/primitives/Reveal";
import { ToneSection } from "@/primitives/ToneSection";
import { TransitionLink } from "@/primitives/TransitionLink";

const CASE = { pathname: "/work/[slug]", params: { slug: "dentaflow" } } as const;

export async function RightNow() {
  const t = await getTranslations("about.now");
  return (
    <ToneSection tone="night" id="now" className="now about-pad" aria-labelledby="now-title">
      <div className="wrap">
        <div className="section-head">
          <h2 id="now-title" className="display h-md">
            {t("title")}
          </h2>
        </div>
        <Reveal as="ul" when="enter" stagger={ABOUT.stagger.now} className="now-list">
          {NOW.map(({ key, link }) => (
            <li key={key} className="now-card">
              <span className="glyph">
                <Mark tone="night" />
              </span>
              <h3>{t(`cards.${key}.title`)}</h3>
              <p>{t(`cards.${key}.text`)}</p>
              {link === "case" ? (
                <ArrowLink as={TransitionLink} href={CASE} className="justify-self-start">
                  {t("cards.dentaflow.link")}
                </ArrowLink>
              ) : null}
              {link === "contact" ? (
                <ArrowLink as={TransitionLink} href="/contact" className="justify-self-start">
                  {t("cards.open.link")}
                </ArrowLink>
              ) : null}
            </li>
          ))}
        </Reveal>
      </div>
    </ToneSection>
  );
}
