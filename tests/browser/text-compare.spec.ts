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
  await page.getByLabel("Import original text file").setInputFiles({
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

test("options, swapping, filtering, copy and exported content preserve the text", async ({
  page,
  context,
}) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.goto("/services/text-compare/");
  const before = page.getByLabel("Original text", { exact: true }),
    after = page.getByLabel("Updated text", { exact: true });
  await before.fill("keep\nold\nlast");
  await after.fill("keep\nnew\nlast");
  await page
    .getByRole("button", { name: "Compare texts", exact: true })
    .click();
  await expect(page.getByRole("status")).toContainText("1 added · 1 removed");
  await expect(page.locator(".diff-line")).toHaveCount(4);
  await page.getByLabel("Changes only").check();
  await expect(page.locator(".diff-line")).toHaveCount(2);
  await page.getByRole("button", { name: "Copy result", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Copied!", exact: true }),
  ).toBeVisible();
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(
    "  keep\n- old\n+ new\n  last",
  );
  const pending = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download result" }).click();
  const download = await pending;
  const stream = await download.createReadStream();
  const chunks: Buffer[] = [];
  for await (const chunk of stream!) chunks.push(Buffer.from(chunk));
  expect(Buffer.concat(chunks).toString()).toBe("  keep\n- old\n+ new\n  last");
  await page.getByRole("button", { name: "Swap", exact: true }).click();
  await expect(before).toHaveValue("keep\nnew\nlast");
  await expect(after).toHaveValue("keep\nold\nlast");
  await expect(page.locator(".diff-result")).toHaveCount(0);
  await before.fill(" A   b ");
  await after.fill("a b");
  await page.getByLabel("Ignore case").check();
  await page.getByLabel("Ignore whitespace").check();
  await page
    .getByRole("button", { name: "Compare texts", exact: true })
    .click();
  await expect(page.getByRole("status")).toContainText("0 added · 0 removed");
  await page.getByRole("button", { name: "Clear", exact: true }).click();
  await expect(before).toBeEmpty();
  await expect(after).toBeEmpty();
  await expect(
    page.getByRole("button", { name: "Compare texts", exact: true }),
  ).toBeDisabled();
});

test("handles invalid files, one-sided limits, clipboard failure and theme persistence", async ({
  page,
}) => {
  await page.goto("/services/text-compare/");
  await page
    .getByLabel("Import original text file")
    .setInputFiles({
      name: "binary.txt",
      mimeType: "text/plain",
      buffer: Buffer.from("a\0b"),
    });
  await expect(page.getByRole("alert")).toContainText("binary file");
  await page
    .getByLabel("Import original text file")
    .setInputFiles({
      name: "large.txt",
      mimeType: "text/plain",
      buffer: Buffer.alloc(200001, 65),
    });
  await expect(page.getByRole("alert")).toContainText("smaller than 200 KB");
  await page
    .getByLabel("Original text", { exact: true })
    .fill("a\n".repeat(1400));
  await page
    .getByRole("button", { name: "Compare texts", exact: true })
    .click();
  await expect(page.getByRole("alert")).toContainText("fewer lines");
  await page.getByRole("button", { name: "Try an example" }).click();
  await page
    .getByRole("button", { name: "Compare texts", exact: true })
    .click();
  await page.evaluate(() =>
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText: () => Promise.reject(new Error("denied")) },
    }),
  );
  await page.getByRole("button", { name: "Copy result", exact: true }).click();
  await expect(page.getByRole("alert")).toContainText("Use Download result");
  await page
    .getByRole("button", { name: "Use dark theme", exact: true })
    .click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await page
    .getByRole("button", { name: "Use light theme", exact: true })
    .click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  await page.emulateMedia({ colorScheme: "dark" });
  await expect(page.locator("html")).toHaveCSS("color-scheme", "light");
});

test("compares sensitive-looking input without sending it in network requests", async ({
  page,
}) => {
  await page.goto("/services/text-compare/");
  await page.getByRole("button", { name: "Try an example" }).waitFor();
  const sent: string[] = [];
  page.on("request", (request) =>
    sent.push(request.url() + (request.postData() || "")),
  );
  await page
    .getByLabel("Original text", { exact: true })
    .fill("PRIVATE-COMPARISON-CANARY alpha");
  await page
    .getByLabel("Updated text", { exact: true })
    .fill("PRIVATE-COMPARISON-CANARY beta");
  await page
    .getByRole("button", { name: "Compare texts", exact: true })
    .click();
  await expect(page.getByRole("status")).toContainText("1 added · 1 removed");
  expect(
    sent.some((request) => request.includes("PRIVATE-COMPARISON-CANARY")),
  ).toBe(false);
  await page.screenshot({
    path: "test-results/text-compare-desktop.png",
    fullPage: true,
  });
});
