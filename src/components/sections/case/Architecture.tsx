/* How it's built (prototype .arch), night: the title, lead and a short list fading up when it
   enters (Reveal, STAGGER.archList), beside the architecture diagram. While the section scrolls
   from "top 70%" to "bottom 60%", the diagram's nodes arrive in order and its wires draw, on one
   timeline scrubbed at SCRUB (LineDraw, triggered by the .arch grid as in the prototype). Below
   520 px the diagram keeps its width and scrolls inside its box, which is focusable so the scroll
   works from the keyboard too. Fully drawn without JavaScript and under reduced motion. */
import { getTranslations } from "next-intl/server";
import { pick, type CaseStudyCopy } from "@/components/sections/case/case-copy";
import {
  ArchDiagram,
  type ArchNode,
  type ArchNodeKey,
} from "@/components/sections/case/diagrams/ArchDiagram";
import type { CaseStudy } from "@/lib/content/schema";
import { STAGGER } from "@/lib/motion";
import { LineDraw } from "@/primitives/LineDraw";
import { Reveal } from "@/primitives/Reveal";
import { ToneSection } from "@/primitives/ToneSection";

export interface ArchitectureProps {
  study: CaseStudy;
  copy: CaseStudyCopy;
}

export async function Architecture({ study, copy }: ArchitectureProps) {
  const t = await getTranslations("case.arch");
  const d = copy.case.diagram;
  const nodes: Record<ArchNodeKey, ArchNode> = {
    browser: { name: d.browser, sub: d.browserSub },
    app: { name: "Next.js", sub: d.appSub },
    api: { name: "tRPC", sub: d.apiSub },
    orm: { name: "Drizzle ORM", sub: d.ormSub },
    database: { name: "PostgreSQL", sub: d.databaseSub },
    auth: { name: "Better Auth", sub: d.authSub },
  };

  return (
    <ToneSection tone="night" id="architecture" className="case-pad" aria-labelledby="arch-title">
      <div className="arch wrap">
        <div>
          <div className="section-head">
            <h2 id="arch-title" className="display h-md">
              {t("title")}
            </h2>
            <p className="lead muted">{t("lead")}</p>
          </div>
          <Reveal as="ul" when="enter" stagger={STAGGER.archList} className="arch-list">
            {study.arch.listKeys.map((key) => {
              const item = pick(copy.case.arch, key, "arch");
              return (
                <li key={key}>
                  <strong>{item.title}</strong>
                  <span>{item.text}</span>
                </li>
              );
            })}
          </Reveal>
        </div>
        {/* A scrollable region must be reachable from the keyboard (axe scrollable-region-focusable). */}
        {/* eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex */}
        <div className="diagram-box" role="region" aria-label={t("diagramBox")} tabIndex={0}>
          <LineDraw trigger=".arch">
            <ArchDiagram label={d.label} nodes={nodes} />
          </LineDraw>
        </div>
      </div>
    </ToneSection>
  );
}
