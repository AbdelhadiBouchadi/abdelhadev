import { Footer } from "@/components/layout/Footer";
import { resolveLocale } from "@/i18n/locale";

// The shell footer (src/app/[locale]/@footer/page.tsx says why every route has its slot page).
export default async function LegalFooter({ params }: PageProps<"/[locale]/legal">) {
  await resolveLocale(params);
  return <Footer />;
}
