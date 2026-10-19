import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { ArrowLink } from "@/components/ui/ArrowLink";
import { buttonClass, SunDot } from "@/components/ui/Button";
import { PagePlaceholder } from "@/components/ui/PagePlaceholder";
import { Link } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { notFoundMetadata } from "@/lib/seo";

// Plain links, so they work without JavaScript.
export async function generateMetadata(): Promise<Metadata> {
  const requested = await getLocale();
  const locale = routing.locales.find((l) => l === requested) ?? routing.defaultLocale;
  return notFoundMetadata(locale);
}

export default async function NotFound() {
  const t = await getTranslations("pages.notFound");
  return (
    <PagePlaceholder title={t("title")} lead={t("lead")}>
      <p className="m-0 flex flex-wrap items-center gap-x-6 gap-y-3">
        <Link href="/" className={buttonClass}>
          <SunDot />
          {t("back")}
        </Link>
        <ArrowLink as={Link} href="/work">
          {t("work")}
        </ArrowLink>
      </p>
    </PagePlaceholder>
  );
}
