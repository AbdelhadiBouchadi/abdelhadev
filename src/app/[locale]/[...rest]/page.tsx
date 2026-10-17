import { notFound } from "next/navigation";

// Unknown paths inside a locale render [locale]/not-found.tsx within the localised layout.
export default function CatchAll() {
  notFound();
}
