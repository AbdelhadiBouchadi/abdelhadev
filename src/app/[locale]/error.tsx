"use client";

/* Focus moves to the heading so a screen reader announces what happened. React hoists the robots
   meta into the head. */
import type { ErrorInfo } from "next/error";
import { useTranslations } from "next-intl";
import { useEffect, useRef } from "react";
import { Button, buttonClass, buttonGhost } from "@/components/ui/Button";
import { PagePlaceholder } from "@/components/ui/PagePlaceholder";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

export default function LocaleError({ retry }: ErrorInfo) {
  const t = useTranslations("errors");
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    heading.current?.focus();
  }, []);
  return (
    <>
      <meta name="robots" content="noindex, nofollow" />
      <PagePlaceholder title={t("title")} lead={t("lead")} headingRef={heading}>
        <p className="m-0 flex flex-wrap items-center gap-3">
          <Button onClick={retry}>{t("retry")}</Button>
          <Link href="/" className={cn(buttonClass, buttonGhost)}>
            {t("home")}
          </Link>
        </p>
      </PagePlaceholder>
    </>
  );
}
