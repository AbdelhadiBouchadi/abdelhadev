/* The home featured work (prototype #build): DentaFlow, night, a 300 vh sticky stage on desktop
   and normal flow on mobile. The copy fades up, then four framed screens open one after another
   (FeaturedMotion). The screens are the placeholders from 02 until 08 brings real screenshots.
   The feature list comes from lib/content/projects.ts (unconfirmed by the owner: its placeholder
   is listed by the build). The button opens the case study through the route curtain. */
import { getTranslations } from "next-intl/server";
import { buttonClass, SunDot } from "@/components/ui/Button";
import { Screen, type ScreenLayout } from "@/components/ui/Screen";
import { FeaturedMotion } from "@/components/sections/home/FeaturedMotion";
import { getProject } from "@/lib/content/projects";
import { StickyStage } from "@/primitives/StickyStage";
import { TransitionLink } from "@/primitives/TransitionLink";

const SLUG = "dentaflow";
const SCREENS = [
  { layout: "agenda", caption: "agenda" },
  { layout: "record", caption: "record" },
  { layout: "plan", caption: "plan" },
  { layout: "invoice", caption: "invoice" },
] as const satisfies readonly { layout: ScreenLayout; caption: string }[];

const FEATURE_KEYS = ["agenda", "records", "plans", "invoices"] as const;
type FeatureKey = (typeof FEATURE_KEYS)[number];

function isFeatureKey(value: string): value is FeatureKey {
  return (FEATURE_KEYS as readonly string[]).includes(value);
}

export async function Featured() {
  const t = await getTranslations("home.featured");
  const features = (getProject(SLUG)?.features?.items ?? []).filter(isFeatureKey);

  return (
    <StickyStage
      tone="night"
      id="featured"
      height="300vh"
      mobileHeight="auto"
      aria-labelledby="featured-title"
      stageClassName="wrap featured-stage"
    >
      <div className="featured-grid">
        <div className="featured-copy" data-featured-copy="">
          <p className="featured-product">{t("product")}</p>
          <h2 id="featured-title" className="display h-md">
            {t("title")}
          </h2>
          <p className="featured-body">{t("body")}</p>
          <ul className="features">
            {features.map((key) => (
              <li key={key}>{t(`features.${key}`)}</li>
            ))}
          </ul>
          <p className="featured-adapt">
            {t.rich("adapt", { strong: (chunks) => <strong>{chunks}</strong> })}
          </p>
          <div className="featured-actions">
            <TransitionLink
              href={{ pathname: "/work/[slug]", params: { slug: SLUG } }}
              className={buttonClass}
              data-cursor={t("cta")}
            >
              <SunDot />
              {t("cta")}
            </TransitionLink>
          </div>
        </div>
        <div className="tiles" role="group" aria-label={t("screens")}>
          {SCREENS.map(({ layout, caption }) => (
            <div key={layout} className="tile" data-tile="" data-cursor={t("placeholder")}>
              <Screen
                layout={layout}
                label={t("placeholder")}
                caption={
                  <>
                    <span>{t(`captions.${caption}`)}</span>
                    <span>{t("placeholder")}</span>
                  </>
                }
              />
            </div>
          ))}
        </div>
      </div>
      <FeaturedMotion />
    </StickyStage>
  );
}
