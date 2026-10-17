import type { Metadata, Viewport } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getTranslations } from "next-intl/server";
import { Cursor } from "@/components/layout/Cursor";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { Loader } from "@/components/layout/Loader";
import { MobileNav } from "@/components/layout/MobileNav";
import { SkipLink } from "@/components/layout/SkipLink";
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

export default async function LocaleLayout({ children, params }: LayoutProps<"/[locale]">) {
  const locale = await resolveLocale(params);
  return (
    // The boot script adds classes to <html> before hydration, hence suppressHydrationWarning.
    <html lang={locale} className={fontVariables} suppressHydrationWarning>
      <head>
        {/* Blocking on purpose: sets js, motion and arriving before first paint (docs/architecture.md). */}
        <script dangerouslySetInnerHTML={{ __html: BOOT_SCRIPT }} />
      </head>
      <body>
        <NextIntlClientProvider>
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
              <Footer />
            </TransitionProvider>
          </SmoothScroll>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
