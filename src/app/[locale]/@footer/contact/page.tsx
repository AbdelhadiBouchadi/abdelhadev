import { Footer } from "@/components/layout/Footer";
import { resolveLocale } from "@/i18n/locale";

// The shell footer (src/app/[locale]/@footer/page.tsx says why every route has its slot page).
export default async function ContactFooter({ params }: PageProps<"/[locale]/contact">) {
  await resolveLocale(params);
  return <Footer />;
}
