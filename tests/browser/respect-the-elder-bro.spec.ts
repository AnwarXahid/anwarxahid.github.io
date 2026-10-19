import { expect, test } from '@playwright/test';

test('Lab card opens the game and street calls score correctly', async ({ page }) => {
  await page.goto('/lab/');
  const card = page.locator('#respect-project');
  await expect(card).toBeVisible();
  await card.click({ position: { x: 20, y: 90 } });
  await expect(page).toHaveURL(/\/game\/respect-the-elder-bro\/$/);

  await page.getByRole('button', { name: /START THE VIBE/ }).click();
  await expect(page.locator('#scoreValue')).toHaveText('1', { timeout: 10000 });
  await page.keyboard.press('h');
  await expect(page.locator('#hideButton')).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('#scoreValue')).toHaveText('3', { timeout: 10000 });
  await expect(page.locator('#caughtValue')).toHaveText('0 / 3');
  await page.keyboard.press('v');
  await expect(page.locator('#scoreValue')).toHaveText('5', { timeout: 10000 });

  await page.keyboard.press('p');
  await expect(page.getByRole('heading', { name: /Street's on pause/ })).toBeVisible();
  await page.getByRole('button', { name: /BACK TO THE BLOCK/ }).click();
  await expect(page.locator('#pauseScreen')).toHaveClass(/hidden/);
});

test('three elder call-outs ground bro and retry starts a fresh run', async ({ page }) => {
  await page.goto('/game/respect-the-elder-bro/');
  await page.getByRole('button', { name: /START THE VIBE/ }).click();
  await expect(page.getByRole('heading', { name: /Bro got grounded/ })).toBeVisible({ timeout: 35000 });
  await expect(page.locator('#resultScore')).not.toHaveText('0');
  await page.getByRole('button', { name: /TRY AGAIN/ }).click();
  await expect(page.locator('#scoreValue')).toHaveText('0');
  await expect(page.locator('#caughtValue')).toHaveText('0 / 3');
});
