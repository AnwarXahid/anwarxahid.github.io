import { expect, test } from '@playwright/test';

test('Carry My Bro opens from the Lab and the run can be paused', async ({ page }) => {
  await page.goto('/lab/');
  const gameLink = page.getByRole('link', { name: 'Play Carry My Bro' });
  await expect(gameLink).toHaveAttribute('href', '/game/');
  await gameLink.click();
  await expect(page).toHaveURL(/\/game\/$/);

  await page.getByRole('button', { name: /START RUNNING/ }).click();
  await expect(page.getByRole('dialog', { name: /You got this, bro/ })).toBeVisible();
  const tutorial = page.getByRole('dialog', { name: /You got this, bro/ });
  await expect(tutorial.getByText('Switch lanes', { exact: true })).toBeVisible();
  await expect(tutorial.getByText('Duck under bridges', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: /GOT IT/ }).click();
  await expect(page.locator('#brosValue')).toHaveText('1', { timeout: 5000 });
  await page.getByRole('button', { name: 'Pause game' }).click();
  await expect(page.getByRole('heading', { name: 'Paused.' })).toBeVisible();
  const stoppedDistance = await page.locator('#distanceValue').innerText();
  await page.waitForTimeout(250);
  await expect(page.locator('#distanceValue')).toHaveText(stoppedDistance);
  await page.getByRole('button', { name: /KEEP RUNNING/ }).click();
  await expect(page.getByRole('heading', { name: 'Paused.' })).toBeHidden();

  await page.reload();
  await page.getByRole('button', { name: /START RUNNING/ }).click();
  await expect(page.getByRole('dialog', { name: /You got this, bro/ })).toBeHidden();
  await expect(page.locator('#gameHud')).toBeVisible();
});
