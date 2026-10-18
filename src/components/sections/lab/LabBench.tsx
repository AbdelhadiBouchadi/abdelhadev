/* The primitives bench (02, trimmed in 03, removed in 05 with the lab): only the primitives no
   real page uses yet (MediaReveal, LineDraw, useScrollSpy), in a day and a night section, rendered
   with the real tokens so each can be scrolled, filmed and tested (tests/e2e/primitives.spec.ts).
   The blocks the home page now exercises (the shell, SplitReveal, WordsLight, Reveal, StickyStage,
   Scrub) moved to tests/e2e/home.spec.ts. Primitive names and their props are identifiers, not
   copy. data-bench attributes name the elements the tests look at; #bench and #lab-night are what
   the hash-link tests use (tests/e2e/transition.spec.ts). */
import { getTranslations } from "next-intl/server";
import type { ReactNode } from "react";
import { Screen, type ScreenLayout } from "@/components/ui/Screen";
import { LabDiagram } from "@/components/sections/lab/diagrams/LabDiagram";
import { LabSpyRail } from "@/components/sections/lab/LabSpyRail";
import { cn } from "@/lib/utils";
import { LineDraw } from "@/primitives/LineDraw";
import { MediaReveal } from "@/primitives/MediaReveal";
import { ToneSection } from "@/primitives/ToneSection";

const LAYOUTS = ["agenda", "record", "plan", "invoice"] as const satisfies readonly ScreenLayout[];
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

function Spec({ children }: { children: ReactNode }) {
  return <code className="text-sm muted">{children}</code>;
}

function Title({ children }: { children: ReactNode }) {
  return <h2 className="display h-sm">{children}</h2>;
}

export async function LabBench() {
  const t = await getTranslations("pages.lab.bench");
  const nodes = DIAGRAM.map((key) => t(`diagram.${key}`));

  return (
    <>
      <ToneSection tone="day" id="bench" className="wrap grid gap-5 pt-12 pb-8">
        <h2 className="display h-md">{t("title")}</h2>
        <p className="lead muted">{t("lead")}</p>
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
      <ToneSection tone="night" id="lab-night" className="py-20">
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
