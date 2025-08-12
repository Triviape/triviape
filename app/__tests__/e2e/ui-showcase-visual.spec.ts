import { test, expect } from '@playwright/test';

// Basic visual regression snapshot for UI Showcase
// Run with: npx playwright test app/__tests__/e2e/ui-showcase-visual.spec.ts

test.describe('UI Showcase Visual', () => {
  test('captures light and dark mode', async ({ page }) => {
    await page.goto('/ui-showcase');
    await page.waitForLoadState('networkidle');

    // Light mode snapshot
    await expect(page).toHaveScreenshot('ui-showcase-light.png', { fullPage: true });

    // Toggle dark mode
    await page.getByRole('button', { name: /toggle dark mode/i }).click();
    await page.waitForTimeout(300); // allow CSS transition

    await expect(page).toHaveScreenshot('ui-showcase-dark.png', { fullPage: true });
  });
});
