import { Footer } from "@/components/layout/Footer";
import { resolveLocale } from "@/i18n/locale";

// The footer of this route (@footer/page.tsx says why every route has a slot page).
export default async function LegalFooter({ params }: PageProps<"/[locale]/legal">) {
  await resolveLocale(params);
  return <Footer />;
}
