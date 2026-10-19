/* The visual wordmark is aria-hidden; a screen-reader-only sentence carries the name in the h1. */
import { getTranslations } from "next-intl/server";
import { Clock } from "@/components/layout/Clock";
import { NavLink } from "@/components/layout/NavLink";
import { Sky } from "@/components/layout/Sky";
import { SceneLayer } from "@/components/three/SceneLayer";
import { buttonClass, SunDot, textLinkClass } from "@/components/ui/Button";
import { HeroWordmark } from "@/components/sections/home/HeroWordmark";
import { SceneProgress } from "@/components/sections/home/SceneProgress";
import { HOME, SETTLE } from "@/lib/motion";
import { SITE } from "@/lib/site";
import { FitText } from "@/primitives/FitText";
import { Magnetic } from "@/primitives/Magnetic";
import { Reveal } from "@/primitives/Reveal";
import { Scrub } from "@/primitives/Scrub";
import { ToneSection } from "@/primitives/ToneSection";
import { TransitionLink } from "@/primitives/TransitionLink";

const KINDS = ["management", "ai", "platforms"] as const;

const { laterY, laterDelay, laterStagger } = HOME.hero;
/** After the meta's two paragraphs and the intro paragraph in the stagger. */
const ACTIONS_DELAY = laterDelay + 3 * laterStagger;

export async function Hero() {
  const t = await getTranslations("home.hero");
  const nav = await getTranslations("nav");
  const cursor = await getTranslations("cursor");

  return (
    <ToneSection tone="day" id="hero" className="hero">
      <Sky />
      <Scrub
        id="scene-wrap"
        className="scene-wrap"
        to={{ opacity: HOME.scene.dim }}
        trigger="#manifesto"
        start="top bottom"
        end="top top"
      >
        <SceneLayer />
      </Scrub>
      <SceneProgress value="p1" trigger="#hero" start="top top" end="bottom top" />

      <Scrub
        className="wrap"
        to={SETTLE.heroMeta}
        trigger="#hero"
        start="top top"
        end={HOME.hero.metaEnd}
      >
        <Reveal
          when="ready"
          className="hero-meta"
          y={laterY}
          delay={laterDelay}
          stagger={laterStagger}
        >
          <p>
            <strong>{t("role")}</strong>
            <br />
            {t("place")}
            <br />
            {t.rich("localTime", { time: () => <Clock /> })}
          </p>
          <p className="hero-meta-end">
            {KINDS.map((kind, i) => (
              <span key={kind}>
                {i > 0 ? <br /> : null}
                {t(`kinds.${kind}`)}
              </span>
            ))}
          </p>
        </Reveal>
      </Scrub>

      <div className="wrap">
        <Scrub
          className="hero-word-wrap"
          to={SETTLE.heroWord}
          trigger="#hero"
          start="top top"
          end="bottom top"
        >
          {/* tabIndex -1: focus moves to the main heading after a route change. */}
          <h1 tabIndex={-1} className="hero-title" data-hero-word="">
            <FitText className="hero-word">
              <span aria-hidden="true" data-hero-letters="">
                {SITE.brand}
              </span>
            </FitText>
            <span className="sr">{t("name")}</span>
          </h1>
          <HeroWordmark />
        </Scrub>
        <div className="hero-foot">
          {/* Never hidden: it is the LCP element on phones (docs/spikes/loader-lcp.md). */}
          <p className="hero-intro">{t("intro")}</p>
          <Reveal
            when="ready"
            targets="self"
            className="hero-actions"
            y={laterY}
            delay={ACTIONS_DELAY}
          >
            <Magnetic>
              <NavLink href="/contact" className={buttonClass} data-cursor={cursor("write")}>
                <SunDot />
                {nav("contact")}
              </NavLink>
            </Magnetic>
            <TransitionLink href="/work" className={textLinkClass}>
              {t("seeWork")}
            </TransitionLink>
          </Reveal>
        </div>
      </div>
    </ToneSection>
  );
}
