import { test, expect, type Download } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { createRequire } from "node:module";
const { PDFDocument } = createRequire(import.meta.url)(
  "pdf-lib",
) as typeof import("pdf-lib");
async function contents(download: Download) {
  const stream = await download.createReadStream();
  const chunks: Buffer[] = [];
  for await (const chunk of stream!) chunks.push(Buffer.from(chunk));
  return Buffer.concat(chunks);
}

test("Text Clean applies options, exports actual text and resets stale results", async ({
  page,
  context,
}) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.goto("/services/text-clean/");
  await page
    .getByLabel("Original text", { exact: true })
    .fill("  First   line.  \n\n  Second\t line.  ");
  await page.getByRole("button", { name: "Clean text", exact: true }).click();
  await expect(page.getByLabel("Cleaned text", { exact: true })).toHaveValue(
    "First line.\n\nSecond line.",
  );
  await page.getByRole("button", { name: "Copy result", exact: true }).click();
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(
    "First line.\n\nSecond line.",
  );
  const pending = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download result" }).click();
  const download = await pending;
  expect(download.suggestedFilename()).toBe("cleaned-text.txt");
  expect((await contents(download)).toString()).toBe(
    "First line.\n\nSecond line.",
  );
  await page.getByLabel("Remove empty lines").check();
  await expect(page.getByLabel("Cleaned text", { exact: true })).toBeEmpty();
  await page.getByRole("button", { name: "Clean text", exact: true }).click();
  await expect(page.getByLabel("Cleaned text", { exact: true })).toHaveValue(
    "First line.\nSecond line.",
  );
  await page.getByLabel("Join wrapped lines").check();
  await page.getByRole("button", { name: "Clean text", exact: true }).click();
  await expect(page.getByLabel("Cleaned text", { exact: true })).toHaveValue(
    "First line.\nSecond line.",
  );
  await page.getByLabel("Import text file").setInputFiles({
    name: "notes.txt",
    mimeType: "text/plain",
    buffer: Buffer.from(" imported   text "),
  });
  await expect(page.getByLabel("Original text", { exact: true })).toHaveValue(
    " imported   text ",
  );
  await page.getByRole("button", { name: "Clear", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Clean text", exact: true }),
  ).toBeDisabled();
});

test("JSON Format validates input and preserves large numbers in formatted and minified downloads", async ({
  page,
}) => {
  await page.goto("/services/json-format/");
  const input = page.getByLabel("JSON input", { exact: true }),
    output = page.getByLabel("Formatted JSON", { exact: true });
  await input.fill(
    '{"big":90071992547409931234,"data":[true,null,"<script>"]}',
  );
  await page.getByRole("button", { name: "Format JSON", exact: true }).click();
  await expect(output).toHaveValue(
    '{\n  "big": 90071992547409931234,\n  "data": [\n    true,\n    null,\n    "<script>"\n  ]\n}',
  );
  await page.getByLabel("Output style").selectOption("minify");
  await expect(output).toBeEmpty();
  await page.getByRole("button", { name: "Format JSON", exact: true }).click();
  const pending = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download result" }).click();
  const download = await pending;
  expect(download.suggestedFilename()).toBe("formatted.json");
  expect((await contents(download)).toString()).toBe(
    '{"big":90071992547409931234,"data":[true,null,"<script>"]}',
  );
  await input.fill('{"broken":}');
  await page.getByRole("button", { name: "Format JSON", exact: true }).click();
  await expect(page.getByRole("alert")).toContainText("Invalid JSON");
  await expect(output).toBeEmpty();
  await expect(
    page.getByRole("button", { name: "Download result" }),
  ).toBeDisabled();
  await page.getByLabel("Import text file").setInputFiles({
    name: "binary.json",
    mimeType: "application/json",
    buffer: Buffer.from("x\0x"),
  });
  await expect(page.getByRole("alert")).toContainText("binary file");
});

test("Image Compress produces real JPEG and WebP downloads with an honest size comparison", async ({
  page,
}) => {
  await page.goto("/services/image-compress/");
  const base64 = await page.evaluate(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 2048;
    canvas.height = 128;
    const ctx = canvas.getContext("2d")!;
    const data = ctx.createImageData(2048, 128);
    let seed = 42;
    for (let i = 0; i < data.data.length; i += 4) {
      seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
      data.data[i] = seed % 256;
      data.data[i + 1] = (seed >>> 8) % 256;
      data.data[i + 2] = (seed >>> 16) % 256;
      data.data[i + 3] = i < 2048 * 4 ? 0 : 255;
    }
    ctx.putImageData(data, 0, 0);
    return canvas.toDataURL("image/png").split(",")[1];
  });
  const original = Buffer.from(base64, "base64");
  await page.getByLabel("Choose image", { exact: true }).setInputFiles({
    name: "sample.png",
    mimeType: "image/png",
    buffer: original,
  });
  await expect(page.getByAltText("Original image preview")).toBeVisible();
  await page.getByRole("slider").fill("50");
  await page
    .getByRole("button", { name: "Compress image", exact: true })
    .click();
  await expect(page.getByAltText("Compressed image preview")).toBeVisible();
  await expect(page.getByRole("status")).toContainText("smaller");
  let pending = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download image" }).click();
  const jpeg = await pending;
  expect(jpeg.suggestedFilename()).toBe("sample-compressed.jpg");
  const jpegBytes = await contents(jpeg);
  expect(jpegBytes[0]).toBe(255);
  expect(jpegBytes[1]).toBe(216);
  expect(jpegBytes.length).toBeLessThan(original.length);
  const info = await page.evaluate(async (encoded) => {
    const response = await fetch("data:image/jpeg;base64," + encoded);
    const bitmap = await createImageBitmap(await response.blob());
    const canvas = document.createElement("canvas");
    canvas.width = bitmap.width;
    canvas.height = bitmap.height;
    const ctx = canvas.getContext("2d")!;
    ctx.drawImage(bitmap, 0, 0);
    const pixel = Array.from(ctx.getImageData(0, 0, 1, 1).data);
    bitmap.close();
    return { width: canvas.width, height: canvas.height, pixel };
  }, jpegBytes.toString("base64"));
  expect(info.width).toBe(1920);
  expect(info.height).toBe(120);
  expect(info.pixel[3]).toBe(255);
  expect(info.pixel[0]).toBeGreaterThan(220);
  await page.getByLabel("Output format").selectOption("image/webp");
  await expect(
    page.getByRole("button", { name: "Download image" }),
  ).toHaveCount(0);
  await page
    .getByRole("button", { name: "Compress image", exact: true })
    .click();
  await expect(page.getByAltText("Compressed image preview")).toBeVisible();
  pending = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download image" }).click();
  const webp = await pending;
  const webpBytes = await contents(webp);
  expect(webp.suggestedFilename()).toBe("sample-compressed.webp");
  expect(webpBytes.toString("ascii", 0, 4)).toBe("RIFF");
  expect(webpBytes.toString("ascii", 8, 12)).toBe("WEBP");
  await page.screenshot({
    path: "test-results/image-compress-desktop.png",
    fullPage: true,
  });
  await page.getByLabel("Choose image", { exact: true }).setInputFiles({
    name: "fake.png",
    mimeType: "image/png",
    buffer: Buffer.from("not an image"),
  });
  await expect(page.getByRole("alert")).toContainText("Could not read");
  await expect(
    page.getByRole("button", { name: "Compress image", exact: true }),
  ).toBeDisabled();
});

test("PDF Merge orders actual output pages, rejects bad files and removes stale downloads", async ({
  page,
}) => {
  const a = await PDFDocument.create();
  a.addPage([300, 400]);
  const b = await PDFDocument.create();
  b.addPage([500, 600]);
  b.addPage([700, 800]);
  await page.goto("/services/pdf-merge/");
  await page.getByLabel("Choose PDF files", { exact: true }).setInputFiles([
    {
      name: "first.pdf",
      mimeType: "application/pdf",
      buffer: Buffer.from(await a.save()),
    },
    {
      name: "second.pdf",
      mimeType: "application/pdf",
      buffer: Buffer.from(await b.save()),
    },
  ]);
  await expect(page.getByRole("status")).toContainText("2 PDF files added");
  await page.getByRole("button", { name: "Move second.pdf earlier" }).click();
  await page.getByRole("button", { name: "Merge PDFs", exact: true }).click();
  await expect(page.getByRole("status")).toContainText("2 files · 3 pages");
  const pending = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download merged PDF" }).click();
  const download = await pending;
  const result = await PDFDocument.load(await contents(download));
  expect(result.getPages().map((p) => p.getWidth())).toEqual([500, 700, 300]);
  expect(download.suggestedFilename()).toBe("merged.pdf");
  await page.screenshot({
    path: "test-results/pdf-merge-desktop.png",
    fullPage: true,
  });
  await page.getByRole("button", { name: "Remove second.pdf" }).click();
  await expect(
    page.getByRole("button", { name: "Download merged PDF" }),
  ).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "Merge PDFs", exact: true }),
  ).toBeDisabled();
  await page.getByLabel("Choose PDF files", { exact: true }).setInputFiles({
    name: "broken.pdf",
    mimeType: "application/pdf",
    buffer: Buffer.from("no pdf here"),
  });
  await expect(page.getByRole("alert")).toContainText("could not open");
  await expect(page.locator(".pdf-file-list li")).toHaveCount(1);
  await page.getByRole("button", { name: "Clear all" }).click();
  await expect(page.locator(".pdf-file-list li")).toHaveCount(0);
});

test("every service is linked from the Lab, accessible on mobile, and keeps entered content off the network", async ({
  page,
}) => {
  await page.goto("/lab/");
  const linked = [
    "image-compress",
    "file-converter",
    "background-remover",
    "ocr",
    "pdf-tools",
    "text-compare",
    "text-clean",
    "json-format",
    "qr-code",
    "quick-pass",
  ];
  for (const route of linked)
    await expect(
      page.locator(`a.tile[href="/services/${route}/"]`),
    ).toBeVisible();
  for (const route of [...linked, "pdf-merge"]) {
    await page.goto(`/services/${route}/`);
    await page.locator("astro-island").waitFor({ state: "visible" });
    await expect(page.locator("astro-island")).not.toHaveAttribute("ssr", "");
    await page.setViewportSize({ width: 390, height: 844 });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
    await page
      .getByRole("button", { name: "Use dark theme", exact: true })
      .click();
    expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
    await page
      .getByRole("button", { name: "Use light theme", exact: true })
      .click();
    await page.screenshot({
      path: `test-results/${route}-mobile.png`,
      fullPage: true,
    });
  }
  await page.goto("/services/text-clean/");
  await page.getByLabel("Original text", { exact: true }).waitFor();
  const sent: string[] = [];
  page.on("request", (request) =>
    sent.push(request.url() + (request.postData() || "")),
  );
  await page
    .getByLabel("Original text", { exact: true })
    .fill("PRIVATE-SERVICE-CANARY  text");
  await page.getByRole("button", { name: "Clean text", exact: true }).click();
  await expect(page.getByLabel("Cleaned text", { exact: true })).toHaveValue(
    "PRIVATE-SERVICE-CANARY text",
  );
  expect(sent.some((value) => value.includes("PRIVATE-SERVICE-CANARY"))).toBe(
    false,
  );
});
