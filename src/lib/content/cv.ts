/* The downloadable CV, one PDF per locale in public/cv/. Both files are placeholders until the
   owner supplies the real CV (scripts/make-placeholder-cv.mjs wrote them): a placeholder is listed
   by the build and fails it with REQUIRE_CONTENT=1 (scripts/report-todos.mjs reads the `status`
   lines below), so it cannot ship by accident. Replace the file, then set its status to "final". */
import type { Locale } from "@/i18n/routing";

export type CvStatus = "placeholder" | "final";

export interface CvFile {
  /** Public path of the PDF. */
  href: string;
  status: CvStatus;
}

export const CV: Readonly<Record<Locale, CvFile>> = {
  fr: {
    href: "/cv/abdelhadi-bouchadi-cv-fr.pdf",
    status: "placeholder",
  },
  en: {
    href: "/cv/abdelhadi-bouchadi-cv-en.pdf",
    status: "placeholder",
  },
};

/** Lists every CV that is still a placeholder, as `cv.<locale>: placeholder`. */
export function todoReport(cv: Readonly<Record<string, CvFile>> = CV): string[] {
  return Object.entries(cv)
    .filter(([, file]) => file.status === "placeholder")
    .map(([locale]) => `cv.${locale}: placeholder`);
}
