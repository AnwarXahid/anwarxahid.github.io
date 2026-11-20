import { it, expect } from "vitest";
import { PDFDocument, StandardFonts } from "pdf-lib";
import {
  cleanText,
  formatJson,
  defaultCleanOptions,
} from "../src/components/services/text-tools";
import {
  mergePdfs,
  inspectPdf,
  parsePageRanges,
  splitPdf,
  compressPdf,
} from "../src/components/services/pdf-tools";
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
it("parses page ranges and extracts selected PDF pages in order", async () => {
  expect(parsePageRanges("1, 3-5, 2", 10)).toEqual([0, 2, 3, 4, 1]);
  expect(() => parsePageRanges("0", 5)).toThrow("Invalid");
  expect(() => parsePageRanges("6", 5)).toThrow("exceeds");
  expect(() => parsePageRanges("5-2", 5)).toThrow("Invalid");

  const doc = await PDFDocument.create();
  doc.addPage([100, 100]);
  doc.addPage([200, 200]);
  doc.addPage([300, 300]);
  const bytes = await doc.save();

  const extracted = await splitPdf(bytes, [2, 0]);
  const result = await inspectPdf(extracted);
  expect(result.getPageCount()).toBe(2);
  expect(result.getPages().map((p) => p.getWidth())).toEqual([300, 100]);
});
it("compresses PDF object streams and reports honest metrics", async () => {
  const doc = await PDFDocument.create();
  for (let i = 0; i < 5; i++) {
    const page = doc.addPage([400, 600]);
    doc
      .getForm()
      .createTextField(`field_${i}`)
      .addToPage(page, { x: 10, y: 10, width: 100, height: 20 });
  }
  const uncompressed = await doc.save();
  const outcome = await compressPdf(uncompressed);
  expect(outcome.newSize).toBeGreaterThan(0);
  expect(outcome.originalSize).toBe(uncompressed.byteLength);
  expect(outcome.bytes instanceof Uint8Array).toBe(true);
  const reloaded = await inspectPdf(outcome.bytes);
  expect(reloaded.getPageCount()).toBe(5);
});

it("converts letter cases accurately and counts text metrics", async () => {
  const { convertCase, countTextStats } =
    await import("../src/components/services/text-tools");
  expect(convertCase("hello world", "upper")).toBe("HELLO WORLD");
  expect(convertCase("HELLO WORLD", "lower")).toBe("hello world");
  expect(convertCase("hello world", "title")).toBe("Hello World");
  expect(convertCase("hello world", "camel")).toBe("helloWorld");
  expect(convertCase("hello world", "snake")).toBe("hello_world");
  expect(convertCase("hello world", "kebab")).toBe("hello-world");

  const stats = countTextStats("First sentence.\n\nSecond paragraph words.");
  expect(stats.paragraphs).toBe(2);
  expect(stats.lines).toBe(3);
  expect(stats.words).toBe(5);
  expect(stats.chars).toBe(40);
});

it("formats CSV correctly preserving quotes, delimiters, and embedded newlines", async () => {
  const { formatCsv } = await import("../src/components/services/text-tools");
  const source =
    'id,name,bio\n1,"Zahid, Anwar","Writes code\nand papers"\n2,Alice,Researcher';
  const formatted = formatCsv(source);
  expect(formatted).toContain('"Zahid, Anwar"');
  expect(formatted).toContain('"Writes code\nand papers"');

  const jsonStr = formatCsv(source, "json");
  const data = JSON.parse(jsonStr);
  expect(data).toHaveLength(2);
  expect(data[0].name).toBe("Zahid, Anwar");
  expect(data[0].bio).toContain("Writes code");
});

it("validates and formats XML safely without external entity vulnerability", async () => {
  const { formatXml } = await import("../src/components/services/text-tools");
  const source =
    '<catalog><book id="1"><title>Clean Code</title><author>Martin</author></book></catalog>';
  const formatted = formatXml(source, "2");
  expect(formatted).toContain("<catalog>\n");
  expect(formatted).toContain('  <book id="1">\n');
  expect(formatted).toContain("    <title>Clean Code</title>\n");

  expect(formatXml(source, "minify")).toBe(source);
  expect(() => formatXml("<root><unclosed></root>")).toThrow();
  expect(() =>
    formatXml(
      '<!DOCTYPE test [ <!ENTITY xxe SYSTEM "file:///etc/passwd"> ]><root>&xxe;</root>',
    ),
  ).toThrow("forbidden");
});
