import { it, expect } from "vitest";
import { PDFDocument, StandardFonts } from "pdf-lib";
import {
  cleanText,
  formatJson,
  defaultCleanOptions,
} from "../src/components/services/text-tools";
import { mergePdfs, inspectPdf } from "../src/components/services/pdf-tools";
it("cleans selected whitespace while preserving paragraphs, Unicode and words", () => {
  expect(cleanText("  hello   world\r\n\r\n  বাংলা\t text  ")).toBe(
    "hello world\n\nবাংলা text",
  );
  expect(
    cleanText("a\n\nb", { ...defaultCleanOptions, removeEmptyLines: true }),
  ).toBe("a\nb");
  expect(
    cleanText("a\nb\n\nc\nd", {
      ...defaultCleanOptions,
      joinWrappedLines: true,
    }),
  ).toBe("a b\n\nc d");
  expect(
    cleanText("  a\t  b  ", {
      trimLines: false,
      collapseSpaces: false,
      removeEmptyLines: false,
      joinWrappedLines: false,
    }),
  ).toBe("  a\t  b  ");
});
it("formats JSON losslessly including large numbers, exponents and duplicate keys", () => {
  const source =
    '{"n":90071992547409931234,"e":1.00e+400,"s":"a \\"quote\\" \\n","a":[],"o":{},"x":1,"x":2}';
  const output = formatJson(source);
  expect(output).toContain("90071992547409931234");
  expect(output).toContain("1.00e+400");
  expect(output).toContain('"x": 1,');
  expect(output).toContain('"x": 2');
  expect(formatJson(output, "minify")).toBe(source);
  expect(formatJson('{"a":[1,2]}', "tab")).toContain('\n\t"a": [\n\t\t1');
  expect(formatJson("true")).toBe("true");
  expect(formatJson('" x "')).toBe('" x "');
});
it("rejects invalid JSON, excessive depth and input size", () => {
  expect(() => formatJson('{"a":}')).toThrow();
  expect(() => formatJson("[".repeat(101) + "0" + "]".repeat(101))).toThrow(
    "nesting",
  );
  expect(() => formatJson(" ".repeat(1000001))).toThrow("smaller");
});
it("merges PDF pages in the requested order and flattens forms", async () => {
  const a = await PDFDocument.create();
  const page = a.addPage([300, 400]);
  const field = a.getForm().createTextField("name");
  field.setText("Test name");
  field.addToPage(page, { x: 20, y: 40, width: 200, height: 30 });
  a.getForm().updateFieldAppearances(
    await a.embedFont(StandardFonts.Helvetica),
  );
  const b = await PDFDocument.create();
  b.addPage([500, 600]);
  b.addPage([700, 800]);
  const bytes = await mergePdfs([await b.save(), await a.save()]);
  const merged = await inspectPdf(bytes);
  expect(merged.getPages().map((page) => page.getWidth())).toEqual([
    500, 700, 300,
  ]);
  expect(merged.getForm().getFields()).toHaveLength(0);
});
it("rejects invalid, missing and excessive PDF pages", async () => {
  await expect(mergePdfs([])).rejects.toThrow("at least two");
  await expect(inspectPdf(new Uint8Array([1, 2, 3]))).rejects.toThrow();
  const a = await PDFDocument.create();
  for (let i = 0; i < 501; i++) a.addPage();
  const b = await PDFDocument.create();
  b.addPage();
  await expect(mergePdfs([await a.save(), await b.save()])).rejects.toThrow(
    "500",
  );
});
