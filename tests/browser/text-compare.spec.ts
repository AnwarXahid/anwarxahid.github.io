import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
test("compares text privately, imports files, exports and works on mobile", async ({
  page,
}) => {
  await page.goto("/services/text-compare/");
  await page.getByRole("button", { name: "Try an example" }).click();
  await page
    .getByRole("button", { name: "Compare texts", exact: true })
    .click();
  await expect(page.getByRole("status")).toContainText("2 added · 1 removed");
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download result" }).click();
  expect((await download).suggestedFilename()).toBe("text-comparison.txt");
  await page
    .getByLabel("Original text", { exact: true })
    .fill("<script>alert(1)</script>");
  await expect(
    page.getByRole("heading", { name: "Here’s what changed" }),
  ).toHaveCount(0);
  await page
    .getByLabel("Updated text", { exact: true })
    .fill("<SCRIPT>alert(1)</SCRIPT>");
  await page.getByLabel("Ignore case").check();
  await page
    .getByRole("button", { name: "Compare texts", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "No differences found" }),
  ).toBeVisible();
  await page
    .getByLabel("Import original text file")
    .setInputFiles({
      name: "sample.txt",
      mimeType: "text/plain",
      buffer: Buffer.from("Imported text"),
    });
  await expect(page.getByLabel("Original text", { exact: true })).toHaveValue(
    "Imported text",
  );
  await page.setViewportSize({ width: 390, height: 844 });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  await page.screenshot({
    path: "test-results/text-compare-mobile.png",
    fullPage: true,
  });
});
