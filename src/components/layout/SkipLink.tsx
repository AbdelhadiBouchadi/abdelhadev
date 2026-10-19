import { getTranslations } from "next-intl/server";
import { SHELL_CONTENT_ATTR } from "@/lib/shell";

const content = { [SHELL_CONTENT_ATTR]: "" };

export async function SkipLink() {
  const t = await getTranslations("common");
  return (
    <a
      {...content}
      href="#main"
      className="fixed start-[max(16px,env(safe-area-inset-left,0px))] top-[calc(10px+env(safe-area-inset-top,0px))] z-120 -translate-y-[160%] rounded-pill bg-ink px-4 py-2.5 text-paper transition-transform duration-(--dur-quick) ease-warm focus:translate-y-0"
    >
      {t("skipLink")}
    </a>
  );
}
