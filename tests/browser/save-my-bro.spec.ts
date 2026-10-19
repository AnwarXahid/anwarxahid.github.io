import { expect, test } from '@playwright/test';

test('skydiving bros visibly descend toward the player', async ({ page }) => {
  await page.addInitScript(() => {
    const original = CanvasRenderingContext2D.prototype.fillText;
    CanvasRenderingContext2D.prototype.fillText = function (text, x, y, maxWidth) {
      if (text === 'BRO!') (window as Window & { __broY?: number }).__broY = y;
      return original.call(this, text, x, y, maxWidth);
    };
  });
  await page.goto('/game/save-my-bro/');
  await page.getByRole('button', { name: /START THE RESCUE/ }).click();
  await page.waitForFunction(() => ((window as Window & { __broY?: number }).__broY ?? 0) > 30);
  const before = await page.evaluate(() => (window as Window & { __broY?: number }).__broY!);
  await page.waitForTimeout(300);
  const after = await page.evaluate(() => (window as Window & { __broY?: number }).__broY!);
  expect(after).toBeGreaterThan(before + 25);
});

test('Lab card opens Save My Bro with a 10-bro first stage', async ({ page }) => {
  await page.goto('/lab/');
  await page.evaluate(() => document.fonts.ready);

  const cards = await page.locator('.lab-grid > .lab-card').evaluateAll((nodes) =>
    nodes.map((node) => ({
      width: Math.round(node.getBoundingClientRect().width),
      height: Math.round(node.getBoundingClientRect().height),
    })),
  );
  expect(cards).toHaveLength(6);
  expect(cards.every((card) => card.height === cards[0].height)).toBe(true);
  for (let index = 0; index < cards.length; index += 2) {
    expect(cards[index].width).toBe(cards[index + 1].width);
    expect(cards[index].height).toBe(cards[index + 1].height);
  }

  await page.getByRole('navigation', { name: 'Jump to a project' }).getByRole('link', { name: /Save My Bro/ }).click();
  await expect(page).toHaveURL(/#save-project$/);
  await page.locator('#save-project').click({ position: { x: 20, y: 90 } });
  await expect(page).toHaveURL(/\/game\/save-my-bro\/$/);

  await page.getByRole('button', { name: /START THE RESCUE/ }).click();
  await expect(page.locator('#rescueValue')).toHaveText('0 / 10');
  await expect(page.locator('#rescueValue')).toHaveText('1 / 10', { timeout: 10000 });
});

test('missing the rescue target lets the player retry the same round', async ({ page }) => {
  await page.goto('/game/save-my-bro/');
  await page.getByRole('button', { name: /START THE RESCUE/ }).click();
  const stage = await page.locator('#stage').boundingBox();
  expect(stage).not.toBeNull();
  await page.mouse.move(stage!.x + 20, stage!.y + stage!.height * 0.43);
  await expect(page.getByRole('heading', { name: 'One more try!' })).toBeVisible({ timeout: 45000 });
  await page.getByRole('button', { name: /RETRY ROUND 1/ }).click();
  await expect(page.locator('#roundValue')).toHaveText('1 / 3');
  await expect(page.locator('#rescueValue')).toHaveText('0 / 10');
});
