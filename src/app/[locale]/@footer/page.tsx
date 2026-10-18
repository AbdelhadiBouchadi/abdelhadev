import { Footer } from "@/components/layout/Footer";
import { resolveLocale } from "@/i18n/locale";

// The @footer slot renders the footer of every route: the shell footer, or the case study's with
// its own call to action (work/[slug]/page.tsx). Every route has its own slot page, because on a
// client-side navigation a slot without a matching page keeps the previous route's footer;
// tests/unit/footer-slot.test.ts fails when a route has no slot page. Each slot page sets the
// request locale itself (resolveLocale), as the route pages do: the slot renders alongside the
// page, and reading the locale without it made every route dynamic.
export default async function HomeFooter({ params }: PageProps<"/[locale]">) {
  await resolveLocale(params);
  return <Footer />;
}
