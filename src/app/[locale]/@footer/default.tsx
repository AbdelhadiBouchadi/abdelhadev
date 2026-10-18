import { Footer } from "@/components/layout/Footer";
import { resolveLocale } from "@/i18n/locale";

// The @footer slot (src/app/[locale]/layout.tsx): the shell footer wherever no slot page matches
// on a full page load (not-found pages).
export default async function FooterDefault({ params }: { params: Promise<{ locale: string }> }) {
  await resolveLocale(params);
  return <Footer />;
}
