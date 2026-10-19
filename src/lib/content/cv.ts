/* The downloadable CV, one PDF per locale in public/cv/. Both files are placeholders until the
   owner supplies the real CV (scripts/make-placeholder-cv.mjs wrote them): a placeholder is listed
   by the build and fails it with REQUIRE_CONTENT=1 (scripts/report-todos.mjs reads the `status`
   lines below), so it cannot ship by accident. Replace the file, then set its status to "final". */
import type { Locale } from "@/i18n/routing";

export type CvStatus = "placeholder" | "final";

export interface CvFile {
  /** Public path of the PDF. */
  href: string;
  /** The name the browser saves it under (the link's `download` attribute). */
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

/** The owner's action while any CV is a placeholder (also printed by scripts/report-todos.mjs). */
export const CV_ACTION = "cv: place the two CV PDFs in public/cv/ and set their status to final";

/** Lists every CV that is still a placeholder, as `cv.<locale>: placeholder`, then the owner's
    action. */
export function todoReport(cv: Readonly<Record<string, CvFile>> = CV): string[] {
  const placeholders = Object.entries(cv)
    .filter(([, file]) => file.status === "placeholder")
    .map(([locale]) => `cv.${locale}: placeholder`);
  return placeholders.length ? [...placeholders, CV_ACTION] : [];
}
