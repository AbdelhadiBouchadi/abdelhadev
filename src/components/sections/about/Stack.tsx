/* What I use (prototype .stack-groups), day: three groups of chips, by how often he reaches for
   each tool (src/lib/content/about.ts; technology names are not translated). The groups fade up
   one ABOUT.stagger.stack apart when they enter (Reveal). */
import { getTranslations } from "next-intl/server";
import { Chips } from "@/components/ui/Chip";
import { STACK } from "@/lib/content/about";
import { ABOUT } from "@/lib/motion";
import { Reveal } from "@/primitives/Reveal";
import { ToneSection } from "@/primitives/ToneSection";

export async function Stack() {
  const t = await getTranslations("about.stack");
  return (
    <ToneSection tone="day" id="stack" className="about-pad pt-0" aria-labelledby="stack-title">
      <div className="wrap">
        <div className="section-head">
          <h2 id="stack-title" className="display h-md">
            {t("title")}
          </h2>
        </div>
        <Reveal as="ul" when="enter" stagger={ABOUT.stagger.stack} className="stack-groups">
          {STACK.map(({ key, items }) => (
            <li key={key} className="stack-group">
              <h3 id={`stack-${key}`}>{t(`groups.${key}`)}</h3>
              <Chips items={items} aria-labelledby={`stack-${key}`} />
            </li>
          ))}
        </Reveal>
      </div>
    </ToneSection>
  );
}
