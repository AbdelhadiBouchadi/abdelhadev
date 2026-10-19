/* Structured data as a server-rendered <script type="application/ld+json"> (lib/json-ld.ts). */
import { serializeJsonLd, type JsonLdObject } from "@/lib/json-ld";

export interface JsonLdProps {
  data: JsonLdObject;
}

export function JsonLd({ data }: JsonLdProps) {
  // The data is escaped by serializeJsonLd (every `<` becomes its JSON escape), so it cannot close the element.
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: serializeJsonLd(data) }}
    />
  );
}
