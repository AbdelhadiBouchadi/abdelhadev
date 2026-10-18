import type { Metadata, Viewport } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, getTranslations } from "next-intl/server";
import { Cursor } from "@/components/layout/Cursor";
import { Header } from "@/components/layout/Header";
import { Loader } from "@/components/layout/Loader";
import { MobileNav } from "@/components/layout/MobileNav";
import { SkipLink } from "@/components/layout/SkipLink";
import { pickClientMessages } from "@/i18n/client-messages";
import { resolveLocale } from "@/i18n/locale";
import { routing } from "@/i18n/routing";
import { BOOT_SCRIPT } from "@/lib/boot";
import { fontVariables } from "@/lib/fonts";
import { baseMetadata } from "@/lib/seo";
import { SHELL_CONTENT_ATTR } from "@/lib/shell";
import { cssToken } from "@/lib/tokens";
import { SmoothScroll } from "@/primitives/SmoothScroll";
import { TransitionProvider } from "@/primitives/TransitionProvider";
import "@/styles/globals.css";

const shellContent = { [SHELL_CONTENT_ATTR]: "" };

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: LayoutProps<"/[locale]">): Promise<Metadata> {
  const locale = await resolveLocale(params);
  const t = await getTranslations({ locale, namespace: "meta" });
  return baseMetadata(locale, t("description"));
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: cssToken("paper"),
};

// The footer comes from the @footer slot: the shell footer on every route, with the case study's
// own call to action on its pages (src/app/[locale]/@footer/work/[slug]/page.tsx).
export default async function LocaleLayout({ children, footer, params }: LayoutProps<"/[locale]">) {
  const locale = await resolveLocale(params);
  const clientMessages = pickClientMessages(await getMessages());
  return (
    // The boot script adds classes to <html> before hydration, hence suppressHydrationWarning.
    <html lang={locale} className={fontVariables} suppressHydrationWarning>
      <head>
        {/* Blocking on purpose: sets js, motion and arriving before first paint (docs/architecture.md). */}
        <script dangerouslySetInnerHTML={{ __html: BOOT_SCRIPT }} />
      </head>
      <body>
        <NextIntlClientProvider messages={clientMessages}>
          {/* Client providers wrap server-rendered children; the layout stays a Server Component. */}
          <SmoothScroll>
            <TransitionProvider>
              <Loader />
              <SkipLink />
              <Header />
              <MobileNav />
              <Cursor />
              <main id="main" {...shellContent}>
                {children}
              </main>
              {footer}
            </TransitionProvider>
          </SmoothScroll>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
