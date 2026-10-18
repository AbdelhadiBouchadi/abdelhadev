/* The home hero (prototype #hero), 100 svh, day. Server markup; motion is composed from the
   primitives plus one page-specific leaf:
   - intro at the loader's ready signal: the wordmark's width axis 75 → 100 while its letters rise
     through masks (HeroWordmark, built so the reflow is no layout shift); the sun glow rises
     (Sky); the 3D layer fades in (SceneLayer, from 0.3 s); the meta and the actions fade up
     (Reveal, from 0.6 s);
   - scroll: the wordmark settles back (Scrub SETTLE.heroWord), the meta fades out over the first
     45 % (Scrub SETTLE.heroMeta), the 3D layer dims while the manifesto scrolls in (Scrub), the
     sun sinks toward the dusk (Sky), and the hero's progress parts the slabs (SceneProgress p1).

   One h1: the visual wordmark is aria-hidden and a screen-reader-only sentence carries the name.
   The wordmark and the intro paragraph are painted at rest under the loader and never hidden
   (decision T7): the paragraph is the LCP element on phones. Only the meta and the actions start
   hidden (Reveal).
   Without JavaScript, and under reduced motion, everything is visible and still, the sun and the
   3D poster or still frame sit inside the hero. */
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
/** The actions keep their place in the prototype's heroLater stagger: after the meta's two
    paragraphs and the intro paragraph. */
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
          {/* Painted at rest under the loader, never hidden: it is the LCP element (decision T7,
              spike S3). The prototype faded it up with the rest of the foot. */}
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
