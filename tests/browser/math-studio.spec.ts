import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test("solve, inspect checked steps, and export a result", async ({ page }) => {
  await page.goto("/math/");
  await expect(
    page.getByRole("heading", { name: "Work through a problem" }),
  ).toBeVisible();
  await page.getByLabel("Expression or equation").fill("2x+3=11");
  await page.getByRole("button", { name: "Solve expression" }).click();
  await expect(page.locator(".ms-result > strong")).toHaveText("x = 4");
  await expect(page.locator(".ms-step")).toHaveCount(2);
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download solution" }).click();
  expect((await download).suggestedFilename()).toBe("openmath-solution.txt");
});

test("multiple graphs and 3D surface render with exports", async ({ page }) => {
  await page.goto("/math/");
  await page.getByRole("button", { name: "Graph" }).first().click();
  await expect(
    page.getByRole("heading", { name: "Explore the shape" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "+ Add curve" }).click();
  await expect(page.locator(".ms-curve")).toHaveCount(2);
  await expect(page.locator(".js-plotly-plot")).toBeVisible({ timeout: 30000 });
  const imageDownload = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download PNG" }).click();
  expect((await imageDownload).suggestedFilename()).toContain("openmath-graph");
  await page.getByRole("button", { name: "3D" }).click();
  await expect(page.getByText("Graph ready.")).toBeVisible({ timeout: 30000 });
  await expect(page.locator(".ms-plot")).toBeVisible();
  expect(
    await page
      .locator(".ms-plot")
      .evaluate((el) => (el as any).data?.[0]?.type),
  ).toBe("surface");
});

test("notebook saves across reload and exports JSON", async ({ page }) => {
  await page.goto("/math/");
  await page.getByRole("button", { name: "Notebook" }).first().click();
  await page.getByRole("button", { name: "New notebook" }).click();
  await page.getByRole("button", { name: "Add text note" }).click();
  await expect(page.locator(".ms-card")).toHaveCount(1);
  await page.reload();
  await page.getByRole("button", { name: "Notebook" }).first().click();
  await expect(page.locator(".ms-card")).toHaveCount(1);
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export JSON" }).click();
  expect((await download).suggestedFilename()).toContain(".json");
});

test("graph settings can be saved and reopened from a notebook", async ({
  page,
}) => {
  await page.goto("/math/");
  await page.getByRole("button", { name: "Graph" }).first().click();
  await page.getByLabel("Expression for curve 1").fill("x^2-4");
  await page.getByRole("button", { name: "Save graph to notebook" }).click();
  await page.getByRole("button", { name: "Notebook" }).first().click();
  await expect(page.locator(".ms-card")).toHaveCount(1);
  await page.getByRole("button", { name: "Open graph" }).click();
  await expect(page.getByLabel("Expression for curve 1")).toHaveValue("x^2-4");
});

test("mobile navigation keeps the solver usable", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/math/");
  await page
    .locator(".ms-bottom")
    .getByRole("button", { name: "Solve" })
    .click();
  await page.getByLabel("Expression or equation").fill("x^2-5x+6=0");
  await page.getByRole("button", { name: "Solve expression" }).click();
  await expect(page.locator(".ms-result > strong")).toHaveText("x = 2 or 3");
});

test("extracts actual printed text from an uploaded image", async ({
  page,
}) => {
  test.setTimeout(120000);
  await page.goto("/math/");
  await page.getByRole("button", { name: "Scan" }).first().click();
  const base64 = await page.evaluate(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 950;
    canvas.height = 180;
    const context = canvas.getContext("2d")!;
    context.fillStyle = "#fff";
    context.fillRect(0, 0, 950, 180);
    context.fillStyle = "#111";
    context.font = "bold 58px Arial";
    context.fillText("OPENMATH STUDIO", 40, 105);
    return canvas.toDataURL("image/png").split(",")[1];
  });
  await page
    .locator("input[type=file]")
    .first()
    .setInputFiles({
      name: "paragraph.png",
      mimeType: "image/png",
      buffer: Buffer.from(base64, "base64"),
    });
  await page.getByRole("button", { name: "Run text OCR on crop" }).click();
  await expect(page.getByLabel("Editable extracted text")).toHaveValue(
    /OPENMATH/,
    { timeout: 90000 },
  );
});

test("opens the visual math field and shares an edit with Solve", async ({
  page,
}) => {
  await page.goto("/math/");
  await page.getByRole("button", { name: "Editor" }).first().click();
  const field = page.locator("math-field");
  await expect(field).toBeVisible({ timeout: 15000 });
  await field.evaluate((node: any) => {
    node.value = "x^2-4=0";
    node.dispatchEvent(new Event("input", { bubbles: true }));
  });
  await page.getByRole("button", { name: "Send to Solve" }).click();
  await page.getByRole("button", { name: "Solve expression" }).click();
  await expect(page.locator(".ms-result > strong")).toHaveText("x = -2 or 2");
});

test("extracts selectable text from a PDF page", async ({ page }) => {
  await page.goto("/math/");
  await page.getByRole("button", { name: "Scan" }).first().click();
  await page
    .locator("input[type=file]")
    .first()
    .setInputFiles("files/resume.pdf");
  await expect(page.getByLabel("Editable extracted text")).toHaveValue(
    /Anwar|Zahid/i,
    { timeout: 30000 },
  );
});

test("runs lazy SymPy CAS without evaluating user Python", async ({ page }) => {
  test.setTimeout(120000);
  await page.goto("/math/");
  await page.getByLabel("Expression or equation").fill("x^2-5x+6");
  await page.getByLabel("Operation").selectOption("CAS factor");
  await page.getByRole("button", { name: "CAS factor expression" }).click();
  await expect(page.locator(".ms-result > strong")).toContainText(
    "(x - 3)*(x - 2)",
    { timeout: 90000 },
  );
  await page.getByLabel("Expression or equation").fill("sin(x)");
  await page.getByLabel("Operation").selectOption("CAS integrate");
  await page.getByRole("button", { name: "CAS integrate expression" }).click();
  await expect(page.locator(".ms-result > strong")).toHaveText("-cos(x) + C");
  await page.getByLabel("Expression or equation").fill("x^2-5x+6=0");
  await page.getByLabel("Operation").selectOption("CAS solve");
  await page.getByRole("button", { name: "CAS solve expression" }).click();
  await expect(page.locator(".ms-result > strong")).toHaveText("x = 2 or 3");
});

test("solver shell passes accessibility smoke checks", async ({ page }) => {
  await page.goto("/math/");
  const result = await new AxeBuilder({ page }).analyze();
  expect(
    result.violations.filter((v) =>
      ["critical", "serious"].includes(v.impact || ""),
    ),
  ).toEqual([]);
});
