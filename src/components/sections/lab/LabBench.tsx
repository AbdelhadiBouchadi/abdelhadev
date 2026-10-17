/* The primitives bench (02, removed in 03 with the lab): one titled block per primitive, in a day
   and a night section, rendered with the real tokens so each primitive can be scrolled, filmed and
   tested (tests/e2e/primitives.spec.ts). Primitive names and their props are identifiers, not copy.
   data-bench attributes name the elements the tests look at. */
import { getTranslations } from "next-intl/server";
import type { ReactNode } from "react";
import { ArrowLink } from "@/components/ui/ArrowLink";
import { Chips } from "@/components/ui/Chip";
import { Screen, type ScreenLayout } from "@/components/ui/Screen";
import { LabDiagram } from "@/components/sections/lab/diagrams/LabDiagram";
import { LabSpyRail } from "@/components/sections/lab/LabSpyRail";
import { LabStageDemo } from "@/components/sections/lab/LabStageDemo";
import { SETTLE, STAGE } from "@/lib/motion";
import { SITE } from "@/lib/site";
import { cn } from "@/lib/utils";
import { LineDraw } from "@/primitives/LineDraw";
import { MediaReveal } from "@/primitives/MediaReveal";
import { Reveal } from "@/primitives/Reveal";
import { Scrub } from "@/primitives/Scrub";
import { SplitReveal } from "@/primitives/SplitReveal";
import { StickyStage } from "@/primitives/StickyStage";
import { ToneSection } from "@/primitives/ToneSection";
import { TransitionLink } from "@/primitives/TransitionLink";
import { WordsLight } from "@/primitives/WordsLight";

const LAYOUTS = ["agenda", "record", "plan", "invoice"] as const satisfies readonly ScreenLayout[];
const STEPS = ["scoping", "modelling", "delivery"] as const;
const DIAGRAM = ["browser", "app", "api", "database"] as const;
const SPY = ["morning", "noon", "evening", "night"] as const;

/** Prototype .media figure: a sand frame (warm or blue tint) around the screen, 12-column spans. */
const frame = "m-0 rounded-media p-[clamp(10px,1.6vw,22px)]";
const FRAMES = [
  "bg-[color-mix(in_srgb,var(--glow)_55%,var(--sand))] split:col-span-7",
  "bg-sand split:col-span-5",
  "bg-sand split:col-span-4",
  "bg-[color-mix(in_srgb,var(--majorelle-soft)_55%,var(--sand))] split:col-span-8",
] as const;

const caseWord =
  "m-0 font-display text-[clamp(64px,15vw,260px)] leading-[0.86] font-bold tracking-[-0.05em] whitespace-nowrap text-moon [font-variation-settings:'wdth'_92,'opsz'_96]";

function Spec({ children }: { children: ReactNode }) {
  return <code className="text-sm muted">{children}</code>;
}

function Title({ children }: { children: ReactNode }) {
  return <h2 className="display h-sm">{children}</h2>;
}

export async function LabBench() {
  const t = await getTranslations("pages.lab.bench");
  const projects = await getTranslations("projects");
  const chips = [
    t("stack.next"),
    t("stack.postgres"),
    { label: t("warm"), variant: "warm" as const },
    { label: t("toConfirm"), variant: "todo" as const },
  ];
  const nodes = DIAGRAM.map((key) => t(`diagram.${key}`));
  const links = (
    <div className="flex flex-wrap items-center gap-x-8 gap-y-2">
      <ArrowLink as={TransitionLink} href="/work" variant="back">
        {t("back")}
      </ArrowLink>
      <ArrowLink as={TransitionLink} href="/work">
        {t("forward")}
      </ArrowLink>
    </div>
  );

  return (
    <>
      <ToneSection tone="day" id="bench" className="wrap grid gap-5 pt-24 pb-8">
        <h2 className="display h-md">{t("title")}</h2>
        <p className="lead muted">{t("lead")}</p>
      </ToneSection>

      {/* ---------- SplitReveal ---------- */}
      <ToneSection tone="day" id="bench-split" className="py-20">
        <div className="wrap grid gap-6">
          <Title>SplitReveal</Title>
          <Spec>type=&quot;lines&quot; when=&quot;ready&quot;</Spec>
          <SplitReveal
            as="h3"
            type="lines"
            when="ready"
            className="display max-w-[16em] h-md"
            data-bench="split-lines-ready"
          >
            {t("lines")}
          </SplitReveal>
          <Spec>type=&quot;chars&quot; when=&quot;ready&quot; pace=&quot;hero&quot;</Spec>
          <SplitReveal
            as="h3"
            type="chars"
            when="ready"
            className="display h-lg"
            data-bench="split-chars-ready"
          >
            {SITE.brand}
          </SplitReveal>
          <Spec>type=&quot;lines&quot; when=&quot;enter&quot;</Spec>
          <SplitReveal
            as="h3"
            type="lines"
            when="enter"
            className="display max-w-[16em] h-md"
            data-bench="split-lines-enter"
          >
            {t("lines")}
          </SplitReveal>
          <div className="grid min-h-[110svh] content-center gap-6">
            <Spec>
              type=&quot;lines&quot; when=&quot;scrub&quot; start=&quot;top 90%&quot; end=&quot;top
              40%&quot;
            </Spec>
            <SplitReveal
              as="h3"
              type="lines"
              when="scrub"
              start="top 90%"
              end="top 40%"
              className="display max-w-[16em] h-md"
              data-bench="split-lines-scrub"
            >
              {t("scrubLines")}
            </SplitReveal>
          </div>
        </div>
      </ToneSection>
      <ToneSection tone="night" id="bench-split-night" className="overflow-hidden py-20">
        <div className="wrap grid gap-6">
          <Spec>type=&quot;chars&quot; when=&quot;ready&quot; pace=&quot;case&quot;</Spec>
          <SplitReveal as="h3" type="chars" when="ready" pace="case" className={caseWord}>
            {projects("dentaflow.name")}
          </SplitReveal>
          <Spec>type=&quot;lines&quot; when=&quot;enter&quot;</Spec>
          <SplitReveal
            as="h3"
            type="lines"
            when="enter"
            className="display max-w-[16em] h-md"
            data-bench="split-lines-night"
          >
            {t("linesNight")}
          </SplitReveal>
        </div>
      </ToneSection>

      {/* ---------- WordsLight in a StickyStage ---------- */}
      <StickyStage
        tone="day"
        id="bench-words"
        height="240vh"
        stageClassName="wrap flex items-center py-[18vh]"
      >
        <div className="grid gap-6">
          <Title>WordsLight + StickyStage</Title>
          <Spec>
            height=&quot;240vh&quot; trigger=&quot;[data-stage]&quot; start=&quot;top top&quot;
            end=&quot;bottom bottom&quot;
          </Spec>
          <WordsLight
            trigger="[data-stage]"
            start={STAGE.start}
            end={STAGE.end}
            className="statement"
            data-bench="words-stage"
          >
            {t("words")}
          </WordsLight>
        </div>
      </StickyStage>
      <ToneSection tone="night" id="bench-words-night" className="py-32">
        <div className="wrap grid gap-6">
          <Spec>start=&quot;top 70%&quot; end=&quot;bottom 55%&quot;</Spec>
          <WordsLight
            start="top 70%"
            end="bottom 55%"
            className="statement"
            data-bench="words-night"
          >
            {t("wordsNight")}
          </WordsLight>
        </div>
      </ToneSection>

      {/* ---------- Reveal, Chip, ArrowLink ---------- */}
      <ToneSection tone="day" id="bench-reveal" className="py-20">
        <div className="wrap grid gap-8">
          <Title>Reveal + Chip + ArrowLink</Title>
          <Spec>when=&quot;enter&quot;</Spec>
          <Reveal
            as="ul"
            when="enter"
            className="m-0 grid list-none gap-4 p-0 split:grid-cols-3"
            data-bench="reveal-day"
          >
            {STEPS.map((step) => (
              <li key={step} className="grid gap-3 rounded-card bg-sheet p-6">
                <h3 className="display h-sm">{t(`steps.${step}`)}</h3>
                <p className="m-0 muted">{t("stepsLead")}</p>
              </li>
            ))}
          </Reveal>
          <Reveal when="enter" targets="self">
            <Chips items={chips} />
          </Reveal>
          {links}
        </div>
      </ToneSection>
      <ToneSection tone="night" id="bench-reveal-night" className="py-20">
        <div className="wrap grid gap-8">
          <Spec>when=&quot;enter&quot;</Spec>
          <Reveal
            as="ul"
            when="enter"
            className="m-0 grid list-none gap-4 p-0 split:grid-cols-3"
            data-bench="reveal-night"
          >
            {STEPS.map((step) => (
              <li key={step} className="grid gap-3 rounded-card bg-night-2 p-6">
                <h3 className="display h-sm">{t(`steps.${step}`)}</h3>
                <p className="m-0 muted">{t("stepsLead")}</p>
              </li>
            ))}
          </Reveal>
          <Chips items={chips} />
          {links}
        </div>
      </ToneSection>

      {/* ---------- MediaReveal and Screen ---------- */}
      <ToneSection tone="day" id="bench-media" className="py-20">
        <div className="wrap grid gap-8">
          <Title>MediaReveal + Screen</Title>
          <Spec>variant=&quot;scrub&quot;</Spec>
          <div className="grid grid-cols-1 gap-[clamp(10px,1.2vw,16px)] split:grid-cols-12">
            {LAYOUTS.map((layout, i) => (
              <MediaReveal
                key={layout}
                variant="scrub"
                className={cn(frame, FRAMES[i])}
                data-bench={i === 0 ? "media-scrub" : undefined}
              >
                <Screen
                  layout={layout}
                  label={t("screenLabel")}
                  caption={t(`screens.${layout}`)}
                  captionHidden
                  aspect={i === 2 ? "tall" : "default"}
                  className="h-full"
                />
              </MediaReveal>
            ))}
          </div>
        </div>
      </ToneSection>
      <ToneSection tone="night" id="bench-media-night" className="py-20">
        <div className="wrap grid gap-8">
          <Spec>variant=&quot;intro&quot;</Spec>
          <MediaReveal
            variant="intro"
            className="rounded-shot bg-night-2 p-[clamp(10px,1.6vw,22px)]"
            data-bench="media-intro"
          >
            <Screen layout="agenda" label={t("screenLabel")} className="aspect-[16/8.5]" />
          </MediaReveal>
          <Spec>variant=&quot;scrub&quot; src=&quot;/brand/icon-512.png&quot;</Spec>
          <MediaReveal
            variant="scrub"
            className={cn(frame, "max-w-[520px] bg-night-2")}
            data-bench="media-image"
          >
            <Screen
              src="/brand/icon-512.png"
              alt={t("imageAlt")}
              width={512}
              height={512}
              sizes="(min-width: 600px) 520px, 100vw"
              aspect="tall"
            />
          </MediaReveal>
        </div>
      </ToneSection>

      {/* ---------- StickyStage with a stage timeline ---------- */}
      <StickyStage
        tone="night"
        id="bench-stage"
        height="300vh"
        mobileHeight="auto"
        stageClassName="wrap flex items-center py-[12vh] nav:py-0"
      >
        <LabStageDemo>
          <div data-stage-copy="" className="grid gap-4">
            <Title>StickyStage + useStageTimeline</Title>
            <Spec>height=&quot;300vh&quot; mobileHeight=&quot;auto&quot;</Spec>
            <p className="lead muted">{t("stageLead")}</p>
          </div>
          <span
            aria-hidden="true"
            data-stage-bar=""
            className="block h-0.5 origin-left rounded-pill bg-glow"
          />
          <ul className="m-0 grid list-none grid-cols-2 gap-[clamp(12px,1.6vw,22px)] p-0 nav:grid-cols-4">
            {LAYOUTS.map((layout) => (
              <li key={layout} data-tile="" className="rounded-frame bg-night-2 p-2.5">
                <Screen layout={layout} label={t("screenLabel")} caption={t(`screens.${layout}`)} />
              </li>
            ))}
          </ul>
        </LabStageDemo>
      </StickyStage>

      {/* ---------- Scrub ---------- */}
      <ToneSection tone="day" id="bench-scrub" className="min-h-[140svh] overflow-hidden py-20">
        <div className="wrap grid gap-8">
          <Title>Scrub</Title>
          <Spec>to=SETTLE.heroWord trigger=&quot;section&quot; start=&quot;top 60%&quot;</Spec>
          <Scrub
            to={SETTLE.heroWord}
            trigger="section"
            start="top 60%"
            end="bottom top"
            data-bench="scrub-word"
          >
            <p className="display m-0 h-xl">{SITE.brand}</p>
          </Scrub>
          <Spec>to=SETTLE.heroMeta</Spec>
          <Scrub to={SETTLE.heroMeta} trigger="section" start="top 30%" end="center top">
            <p className="lead muted">{t("fade")}</p>
          </Scrub>
        </div>
      </ToneSection>
      <ToneSection
        tone="night"
        id="bench-scrub-night"
        className="min-h-[120svh] overflow-hidden py-20"
      >
        <div className="wrap grid justify-items-center gap-8">
          <Spec>to=SETTLE.arcs</Spec>
          <Scrub
            to={SETTLE.arcs}
            trigger="section"
            start="top 70%"
            end="bottom top"
            className="aspect-square w-[min(70vw,420px)]"
            data-bench="scrub-arcs"
          >
            <span
              aria-hidden="true"
              className="block size-full rounded-pill border-2 border-glow"
            />
          </Scrub>
        </div>
      </ToneSection>

      {/* ---------- LineDraw ---------- */}
      <ToneSection tone="day" id="bench-line" className="py-20">
        <div className="wrap grid gap-8">
          <Title>LineDraw</Title>
          <Spec>start=&quot;top 70%&quot; end=&quot;bottom 60%&quot;</Spec>
          <LineDraw data-bench="line-day">
            <LabDiagram label={t("diagramLabel")} nodes={nodes} />
          </LineDraw>
        </div>
      </ToneSection>
      <ToneSection tone="night" id="bench-line-night" className="py-20">
        <div className="wrap grid gap-8">
          <LineDraw data-bench="line-night">
            <LabDiagram label={t("diagramLabel")} nodes={nodes} />
          </LineDraw>
        </div>
      </ToneSection>

      {/* ---------- useScrollSpy ---------- */}
      <ToneSection tone="day" id="bench-spy" className="py-20">
        <div className="wrap grid gap-8">
          <Title>useScrollSpy</Title>
          <p className="lead muted">{t("spyLead")}</p>
          <div className="grid gap-6 split:grid-cols-[220px_minmax(0,1fr)]">
            <LabSpyRail
              label={t("spyNav")}
              items={SPY.map((key) => ({ id: `spy-${key}`, label: t(`spy.${key}`) }))}
            />
            <div className="grid gap-6">
              {SPY.map((key, i) => (
                <article
                  key={key}
                  id={`spy-${key}`}
                  data-tone={i < 2 ? undefined : "night"}
                  className={cn(
                    "grid min-h-[70svh] content-center rounded-sheet p-8",
                    i < 2 && "bg-sheet",
                  )}
                >
                  <h3 className="display h-md">{t(`spy.${key}`)}</h3>
                </article>
              ))}
            </div>
          </div>
        </div>
      </ToneSection>
    </>
  );
}
