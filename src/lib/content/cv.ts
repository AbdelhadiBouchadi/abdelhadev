/* Both PDFs are placeholders for now. scripts/report-todos.mjs reads the `status` lines below,
   so a placeholder fails the build with REQUIRE_CONTENT=1. Replace the file, then set its status
   to "final". */
import type { Locale } from "@/i18n/routing";

export type CvStatus = "placeholder" | "final";

export interface CvFile {
  href: string;
  filename: string;
  status: CvStatus;
}

export const CV: Readonly<Record<Locale, CvFile>> = {
  fr: {
    href: "/cv/abdelhadi-bouchadi-cv-fr.pdf",
    filename: "Abdelhadi-Bouchadi-CV-FR.pdf",
    status: "placeholder",
  },
  en: {
    href: "/cv/abdelhadi-bouchadi-cv-en.pdf",
    filename: "Abdelhadi-Bouchadi-CV-EN.pdf",
    status: "placeholder",
  },
};

/** Also printed by scripts/report-todos.mjs. */
export const CV_ACTION = "cv: place the two CV PDFs in public/cv/ and set their status to final";

export function todoReport(cv: Readonly<Record<string, CvFile>> = CV): string[] {
  const placeholders = Object.entries(cv)
    .filter(([, file]) => file.status === "placeholder")
    .map(([locale]) => `cv.${locale}: placeholder`);
  return placeholders.length ? [...placeholders, CV_ACTION] : [];
}
