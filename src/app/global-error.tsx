"use client";

/* An error in the root layout itself: this page replaces it, so it renders its own <html> and
   has no providers. The language comes from the first segment of the address. Its strings are
   the `errors` group of that locale's catalogue, imported lazily: a static import would put both
   whole catalogues in a chunk every page loads, for a page that almost never shows. `use()`
   resolves the import while the server renders, and in the browser only when this page appears.
   Plain links and buttons, the site's fonts and tokens. */
import type { ErrorInfo } from "next/error";
import { usePathname } from "next/navigation";
import { use } from "react";
import { Button, buttonClass, buttonGhost } from "@/components/ui/Button";
import { PagePlaceholder } from "@/components/ui/PagePlaceholder";
import { routing, type Locale } from "@/i18n/routing";
import { fontVariables } from "@/lib/fonts";
import { cn } from "@/lib/utils";
import type fr from "@messages/fr.json";
import "@/styles/globals.css";

type ErrorMessages = (typeof fr)["errors"];

const LOAD: Record<Locale, () => Promise<{ default: typeof fr }>> = {
  fr: () => import("@messages/fr.json"),
  en: () => import("@messages/en.json"),
};

// One promise per locale, so use() sees the same promise on every render.
const loaded = new Map<Locale, Promise<ErrorMessages>>();

function errorMessages(locale: Locale): Promise<ErrorMessages> {
  let promise = loaded.get(locale);
  if (!promise) {
    promise = LOAD[locale]().then((module) => module.default.errors);
    loaded.set(locale, promise);
  }
  return promise;
}

export default function GlobalError({ retry }: ErrorInfo) {
  const segment = usePathname().split("/")[1];
  const locale = routing.locales.find((l) => l === segment) ?? routing.defaultLocale;
  const t = use(errorMessages(locale));
  return (
    <html lang={locale} className={fontVariables}>
      <body>
        <meta name="robots" content="noindex, nofollow" />
        <main id="main">
          <PagePlaceholder title={t.title} lead={t.lead}>
            <p className="m-0 flex flex-wrap items-center gap-3">
              <Button onClick={retry}>{t.retry}</Button>
              <a href={`/${locale}`} className={cn(buttonClass, buttonGhost)}>
                {t.home}
              </a>
            </p>
          </PagePlaceholder>
        </main>
      </body>
    </html>
  );
}
