import { test, expect, Page } from '@playwright/test';

async function signInUser(page: Page) {
  const uniqueEmail = `smoke-${Date.now()}-${Math.random()}@example.com`;
  const user = {
    email: uniqueEmail,
    password: 'Test@123456',
    displayName: `Smoke User ${Date.now()}`,
  };

  await page.goto('/auth');
  await page.click('text=Don\'t have an account? Sign up');
  await page.fill('input[name="email"]', user.email);
  await page.fill('input[name="password"]', user.password);
  await page.fill('input[name="displayName"]', user.displayName);
  await page.click('button:has-text("Create Account")');
  await page.waitForURL('/', { timeout: 15000 });
}

test.describe('Cache Warming Smoke', () => {
  test('dashboard loads after login (leaderboard prefetch path)', async ({ page }) => {
    await signInUser(page);
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    expect(page.url()).toContain('/dashboard');
    await expect(page.getByRole('heading', { name: /dashboard/i })).toBeVisible();
  });

  test('social page loads after login (friends prefetch path)', async ({ page }) => {
    await signInUser(page);
    await page.goto('/social');
    await page.waitForLoadState('networkidle');

    expect(page.url()).toContain('/social');
    await expect(page.getByRole('heading', { name: /social hub/i })).toBeVisible();
  });

  test('leaderboard search input remains responsive while typing', async ({ page }) => {
    await page.goto('/leaderboard');
    await page.waitForLoadState('networkidle');

    const searchInput = page.getByPlaceholder('Search players...');
    if (!(await searchInput.isVisible())) {
      const buttons = page.locator('button');
      const buttonCount = await buttons.count();
      for (let i = 0; i < buttonCount; i += 1) {
        await buttons.nth(i).click({ trial: true }).catch(() => {});
        await buttons.nth(i).click().catch(() => {});
        if (await searchInput.isVisible()) {
          break;
        }
      }
    }

    await expect(searchInput).toBeVisible({ timeout: 5000 });
    await searchInput.fill('abcdefghijkl');
    await expect(searchInput).toHaveValue('abcdefghijkl');
  });
});
