/* Minimal footer, replaced by the real one in 01. The legal name is plain server-rendered text on
   every page (AGENTS.md, "Content, identity and legal"). */
import { getTranslations } from "next-intl/server";
import { LocaleSwitch } from "@/components/layout/LocaleSwitch";
import { Link } from "@/i18n/navigation";
import { SITE } from "@/lib/site";

const linkClass =
  "inline-flex min-h-11 items-center underline decoration-1 underline-offset-4 transition-colors hover:text-moon";

export async function Footer() {
  const t = await getTranslations("common.footer");
  const year = new Date().getFullYear();
  return (
    <footer data-tone="night">
      <div className="wrap flex flex-wrap items-center justify-between gap-x-8 gap-y-2 border-t border-line-night py-6 text-sm text-moon-soft">
        <p className="m-0 text-moon">{t("copyright", { year, name: SITE.legalName })}</p>
        <nav aria-label={t("nav")} className="flex flex-wrap items-center gap-x-6">
          <Link href="/legal" className={linkClass}>
            {t("legal")}
          </Link>
          <LocaleSwitch className={linkClass} />
        </nav>
      </div>
    </footer>
  );
}
