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

/**
 * Parse page range string (e.g., "1, 3-5, 8") into a list of 0-based page indices.
 * Preserves specified order.
 */
export function parsePageRanges(
  rangeStr: string,
  totalPages: number,
): number[] {
  const trimmed = rangeStr.trim();
  if (!trimmed)
    throw new Error("Enter page numbers or ranges to extract (e.g. 1, 3-5).");
  const parts = trimmed.split(/[\s,]+/);
  const result: number[] = [];
  const seen = new Set<number>();

  for (const part of parts) {
    if (!part) continue;
    if (part.includes("-")) {
      const [startStr, endStr] = part.split("-");
      const start = parseInt(startStr, 10);
      const end = parseInt(endStr, 10);
      if (isNaN(start) || isNaN(end) || start < 1 || end < start) {
        throw new Error(
          `Invalid range "${part}". Must be formatted like "2-5" with valid page numbers.`,
        );
      }
      if (start > totalPages || end > totalPages) {
        throw new Error(`Range "${part}" exceeds total pages (${totalPages}).`);
      }
      for (let p = start; p <= end; p++) {
        const idx = p - 1;
        result.push(idx);
        seen.add(idx);
      }
    } else {
      const p = parseInt(part, 10);
      if (isNaN(p) || p < 1) {
        throw new Error(`Invalid page number "${part}".`);
      }
      if (p > totalPages) {
        throw new Error(`Page ${p} exceeds total pages (${totalPages}).`);
      }
      const idx = p - 1;
      result.push(idx);
      seen.add(idx);
    }
  }

  if (result.length === 0) {
    throw new Error("No valid pages specified.");
  }
  return result;
}

/**
 * Extract specified 0-based page indices from a PDF into a new PDF document.
 */
export async function splitPdf(
  bytes: ArrayBuffer | Uint8Array,
  pageIndices: number[],
): Promise<Uint8Array> {
  const source = await inspectPdf(bytes);
  const total = source.getPageCount();
  for (const idx of pageIndices) {
    if (idx < 0 || idx >= total) {
      throw new Error(`Page index ${idx + 1} is out of bounds (1-${total}).`);
    }
  }
  const output = await PDFDocument.create();
  const form = source.getForm();
  if (form.getFields().length) form.flatten();
  const pages = await output.copyPages(source, pageIndices);
  pages.forEach((page) => output.addPage(page));
  return output.save();
}

/**
 * Compress a PDF using Flate object streams and stream pruning.
 * Returns the output bytes and honest size difference.
 */
export async function compressPdf(
  bytes: ArrayBuffer | Uint8Array,
): Promise<{
  bytes: Uint8Array;
  originalSize: number;
  newSize: number;
  savedBytes: number;
}> {
  const originalSize = bytes.byteLength;
  const pdf = await inspectPdf(bytes);
  const form = pdf.getForm();
  if (form.getFields().length) form.flatten();
  const compressedBytes = await pdf.save({ useObjectStreams: true });
  const newSize = compressedBytes.byteLength;
  const savedBytes = originalSize - newSize;
  return {
    bytes: compressedBytes,
    originalSize,
    newSize,
    savedBytes,
  };
}
