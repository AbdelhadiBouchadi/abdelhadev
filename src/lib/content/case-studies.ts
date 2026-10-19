/* Parsed at module load, so an invalid entry fails the build. The copy of each step lives at
   messages.projects.<slug>.case.<group>.<key>. */
import { caseStudies, type CaseStudy } from "@/lib/content/schema";

export const CASE_STUDIES: Readonly<Record<string, CaseStudy>> = caseStudies.parse({
  dentaflow: {
    hero: { tone: "dark", skeleton: "agenda" },
    tour: [
      { key: "agenda", tone: "plain", skeleton: "agenda" },
      { key: "patients", tone: "plain", skeleton: "list" },
      { key: "record", tone: "plain", skeleton: "record" },
      { key: "odontogram", tone: "plain", skeleton: "plan" },
      { key: "acts", tone: "plain", skeleton: "list" },
      { key: "documents", tone: "plain", skeleton: "invoice" },
      { key: "statistics", tone: "plain", skeleton: "chart" },
    ],
    adapt: ["name", "database", "deployment", "fourth"],
    arch: { listKeys: ["database", "types", "access"] },
  },
});

export function getCaseStudy(slug: string): CaseStudy | undefined {
  return CASE_STUDIES[slug];
}
