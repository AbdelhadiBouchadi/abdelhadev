/* The primitives bench (02, trimmed in 03 and 04, removed in 05 with the lab): only LineDraw, the
   one primitive no real page uses yet, by day and by night, rendered with the real tokens so it
   can be scrolled, filmed and tested (tests/e2e/primitives.spec.ts). The others are exercised by
   the pages that use them: SplitReveal, WordsLight, Reveal, StickyStage and Scrub on the home page
   (tests/e2e/home.spec.ts), MediaReveal and useScrollSpy on the work page (tests/e2e/work.spec.ts).
   Primitive names and their props are identifiers, not copy. data-bench attributes name the
   elements the tests look at; #bench and #lab-night are what the hash-link tests use
   (tests/e2e/transition.spec.ts). */
import { getTranslations } from "next-intl/server";
import type { ReactNode } from "react";
import { LabDiagram } from "@/components/sections/lab/diagrams/LabDiagram";
import { LineDraw } from "@/primitives/LineDraw";
import { ToneSection } from "@/primitives/ToneSection";

const DIAGRAM = ["browser", "app", "api", "database"] as const;

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
      <ToneSection tone="night" id="lab-night" className="min-h-[110svh] py-20">
        <div className="wrap grid gap-8">
          <LineDraw data-bench="line-night">
            <LabDiagram label={t("diagramLabel")} nodes={nodes} />
          </LineDraw>
        </div>
      </ToneSection>
    </>
  );
}
