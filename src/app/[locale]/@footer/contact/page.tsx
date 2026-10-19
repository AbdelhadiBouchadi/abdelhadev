import { Footer } from "@/components/layout/Footer";
import { resolveLocale } from "@/i18n/locale";

// The footer of this route (@footer/page.tsx says why every route has a slot page).
export default async function ContactFooter({ params }: PageProps<"/[locale]/contact">) {
  await resolveLocale(params);
  return <Footer />;
}
