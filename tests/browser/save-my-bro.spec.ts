import { expect, test } from '@playwright/test';

test('Lab cards open anywhere and Save My Bro can complete all three rounds', async ({ page }) => {
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
  const stage = await page.locator('#stage').boundingBox();
  expect(stage).not.toBeNull();
  for (const [round, goal] of [[1, 2], [2, 3], [3, 4]]) {
    await expect(page.locator('#rescueValue')).toHaveText('1 / ' + goal, { timeout: 10000 });
    for (let catchNumber = 2; catchNumber <= goal; catchNumber++) {
      const target = [0.32, 0.72, 0.32][catchNumber - 2];
      await page.mouse.move(stage!.x + stage!.width * target, stage!.y + stage!.height * 0.43);
      await expect(page.locator('#rescueValue')).toHaveText(catchNumber + ' / ' + goal, { timeout: 10000 });
    }
    await expect(page.locator('#resultScreen')).toBeVisible({ timeout: 25000 });
    await expect(page.locator('#resultScore')).toHaveText(String(goal));
    if (round < 3) await page.getByRole('button', { name: /NEXT ROUND/ }).click();
  }
  await expect(page.getByRole('heading', { name: 'The sky is yours!' })).toBeVisible();
});

test('missing the rescue target lets the player retry the same round', async ({ page }) => {
  await page.goto('/game/save-my-bro/');
  await page.getByRole('button', { name: /START THE RESCUE/ }).click();
  const stage = await page.locator('#stage').boundingBox();
  expect(stage).not.toBeNull();
  await page.mouse.move(stage!.x + 20, stage!.y + stage!.height * 0.43);
  await expect(page.getByRole('heading', { name: 'One more try!' })).toBeVisible({ timeout: 30000 });
  await page.getByRole('button', { name: /RETRY ROUND 1/ }).click();
  await expect(page.locator('#roundValue')).toHaveText('1 / 3');
  await expect(page.locator('#rescueValue')).toHaveText('0 / 2');
});
