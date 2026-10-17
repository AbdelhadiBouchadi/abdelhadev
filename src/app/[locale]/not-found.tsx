import { getTranslations } from "next-intl/server";
import { buttonClass, SunDot } from "@/components/ui/Button";
import { PagePlaceholder } from "@/components/ui/PagePlaceholder";
import { Link } from "@/i18n/navigation";

export default async function NotFound() {
  const t = await getTranslations("pages.notFound");
  return (
    <PagePlaceholder title={t("title")} lead={t("lead")}>
      <p className="m-0">
        <Link href="/" className={buttonClass}>
          <SunDot />
          {t("back")}
        </Link>
      </p>
    </PagePlaceholder>
  );
}
