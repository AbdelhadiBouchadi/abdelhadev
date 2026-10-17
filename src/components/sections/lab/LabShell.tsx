/* Shell test bench for 01 (removed in 03 with the lab): three tall sections, day, night and sheet,
   so tone switching, hide-on-scroll, the cursor label and the magnetic button can be tested and
   filmed. */
import { getTranslations } from "next-intl/server";
import { buttonClass, SunDot } from "@/components/ui/Button";
import type { SectionTone } from "@/lib/tone";
import { Magnetic } from "@/primitives/Magnetic";
import { ToneSection } from "@/primitives/ToneSection";
import { TransitionLink } from "@/primitives/TransitionLink";

const TONES = [
  { tone: "day", key: "toneDay" },
  { tone: "night", key: "toneNight" },
  { tone: "sheet", key: "toneSheet" },
] as const satisfies readonly { tone: SectionTone; key: string }[];

export async function LabShell() {
  const t = await getTranslations("pages.lab");
  return (
    <>
      {TONES.map(({ tone, key }) => (
        <ToneSection key={tone} tone={tone} id={`lab-${tone}`} className="min-h-[140svh] py-24">
          <div className="wrap grid gap-8">
            <h2 className="display h-md">{t(key)}</h2>
            <p className="lead muted">{t("shellLead")}</p>
            <div className="flex flex-wrap items-center gap-6">
              <Magnetic>
                <TransitionLink
                  href="/contact"
                  className={buttonClass}
                  data-cursor={t("cursorLabel")}
                >
                  <SunDot />
                  {t("button")}
                </TransitionLink>
              </Magnetic>
              <p
                data-cursor={t("cursorLabel")}
                data-lab-cursor={tone}
                className="m-0 grid min-h-32 min-w-64 place-items-center rounded-card border border-dashed border-current px-6"
              >
                {t("cursorTarget")}
              </p>
            </div>
          </div>
        </ToneSection>
      ))}
    </>
  );
}
