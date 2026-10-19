import { serializeJsonLd, type JsonLdObject } from "@/lib/json-ld";

export interface JsonLdProps {
  data: JsonLdObject;
}

export function JsonLd({ data }: JsonLdProps) {
  // serializeJsonLd escapes every `<`, so the data cannot close the element.
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: serializeJsonLd(data) }}
    />
  );
}
