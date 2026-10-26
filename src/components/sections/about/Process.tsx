/* No payment percentages (docs/decisions.md). The stacking is CSS only (about.css, deck). */
import { getTranslations } from "next-intl/server";
import { PROCESS } from "@/lib/content/about";
import type { CSSVars } from "@/lib/utils";
import { ToneSection } from "@/primitives/ToneSection";

/** `--i` offsets each card's sticky top, so the earlier cards show an edge above it. */
const cardStyle = (i: number): CSSVars => ({ "--i": String(i) });

export async function Process() {
  const t = await getTranslations("about.process");
  return (
    <ToneSection tone="day" id="process" className="about-pad pt-0" aria-labelledby="process-title">
      <div className="wrap">
        <div className="section-head">
          <h2 id="process-title" className="display h-md">
            {t("title")}
          </h2>
          <p className="lead muted">{t("lead")}</p>
        </div>
        <ol className="deck">
          {PROCESS.map((key, i) => (
            <li key={key} className="card" data-step={key} style={cardStyle(i)}>
              <span className="card-no" aria-hidden="true">
                {i + 1}
              </span>
              <div className="card-copy">
                <h3>{t(`steps.${key}.title`)}</h3>
                <p>{t(`steps.${key}.text`)}</p>
              </div>
              <span className="card-time">{t(`steps.${key}.time`)}</span>
            </li>
          ))}
        </ol>
      </div>
    </ToneSection>
  );
}
