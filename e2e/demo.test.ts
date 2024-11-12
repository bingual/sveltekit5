import { expect, test } from '@playwright/test';

test('네비게이션바 테스트', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('header div nav')).toBeVisible();
});
