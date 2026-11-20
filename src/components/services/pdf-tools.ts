import { PDFDocument } from "pdf-lib";
export async function inspectPdf(bytes: ArrayBuffer | Uint8Array) {
  const pdf = await PDFDocument.load(bytes, { updateMetadata: false });
  if (pdf.getPageCount() === 0) throw new Error("This PDF has no pages.");
  return pdf;
}
export async function mergePdfs(documents: (ArrayBuffer | Uint8Array)[]) {
  if (documents.length < 2) throw new Error("Choose at least two PDF files.");
  const output = await PDFDocument.create();
  let count = 0;
  for (const bytes of documents) {
    const source = await inspectPdf(bytes);
    count += source.getPageCount();
    if (count > 500) throw new Error("Combine no more than 500 pages at once.");
    // Flatten fields before copying pages so values with the same field names remain visible.
    const form = source.getForm();
    if (form.getFields().length) form.flatten();
    const pages = await output.copyPages(source, source.getPageIndices());
    pages.forEach((page) => output.addPage(page));
  }
  return output.save();
}
