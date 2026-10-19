// Writes the placeholder CVs in public/cv/ with no dependency. Until each one is replaced and its
// status set to "final" in src/lib/content/cv.ts, REQUIRE_CONTENT=1 fails the build.
import { mkdirSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const LOCALES = ["fr", "en"];
const TEXT = "CV placeholder, to be replaced";

/** One-page A4 PDF 1.4, with a correct cross-reference table. */
export function placeholderPdf(text) {
  const stream = `BT /F1 24 Tf 72 760 Td (${text.replace(/[\\()]/g, "\\$&")}) Tj ET`;
  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>",
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
    `<< /Length ${String(Buffer.byteLength(stream, "latin1"))} >>\nstream\n${stream}\nendstream`,
  ];
  let body = "%PDF-1.4\n";
  const offsets = objects.map((object, i) => {
    const offset = Buffer.byteLength(body, "latin1");
    body += `${String(i + 1)} 0 obj\n${object}\nendobj\n`;
    return offset;
  });
  const xref = Buffer.byteLength(body, "latin1");
  body += `xref\n0 ${String(objects.length + 1)}\n0000000000 65535 f \n`;
  for (const offset of offsets) body += `${String(offset).padStart(10, "0")} 00000 n \n`;
  body += `trailer\n<< /Size ${String(objects.length + 1)} /Root 1 0 R >>\nstartxref\n${String(xref)}\n%%EOF\n`;
  return Buffer.from(body, "latin1");
}

if (process.argv[1] && resolve(process.argv[1]) === resolve(import.meta.filename)) {
  const dir = join(root, "public", "cv");
  mkdirSync(dir, { recursive: true });
  for (const locale of LOCALES) {
    const file = join(dir, `abdelhadi-bouchadi-cv-${locale}.pdf`);
    writeFileSync(file, placeholderPdf(TEXT));
    console.log(`wrote ${file}`);
  }
}
