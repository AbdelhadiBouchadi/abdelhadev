import { Footer } from "@/components/layout/Footer";
import { resolveLocale } from "@/i18n/locale";

// Every route has its own slot page: on a client-side navigation, a slot without a matching page
// keeps the previous route's footer (tests/unit/footer-slot.test.ts). Each one sets the request
// locale itself, or reading it would make every route dynamic.
export default async function HomeFooter({ params }: PageProps<"/[locale]">) {
  await resolveLocale(params);
  return <Footer />;
}
