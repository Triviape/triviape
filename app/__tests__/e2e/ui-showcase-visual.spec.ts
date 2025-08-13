import { test, expect } from '@playwright/test';

// Basic visual regression snapshot for UI Showcase
// Run with: npx playwright test app/__tests__/e2e/ui-showcase-visual.spec.ts

test.describe('UI Showcase Visual', () => {
  test('captures light and dark mode', async ({ page }) => {
    test.setTimeout(60000);
    await page.route(/_next\/static/ , route => route.continue());
    await page.goto('/ui-showcase', { waitUntil: 'domcontentloaded' });

    const root = page.locator('[data-test="ui-showcase-root"]');
    await root.waitFor({ state: 'visible', timeout: 10000 });

    // Ensure fonts loaded and settle minor layout shifts
    await page.evaluate(async () => {
      await (document as any).fonts?.ready;
      // Disable animations for determinism
      const style = document.createElement('style');
      style.innerHTML = '* { animation: none !important; transition: none !important; }';
      document.head.appendChild(style);
    });
    await page.waitForTimeout(150);

    await expect(root).toHaveScreenshot('ui-showcase-light.png', { animations: 'disabled', mask: [] });

    // Toggle dark mode
    const toggle = page.getByRole('button', { name: /toggle dark mode/i });
    await toggle.click();
    await page.waitForTimeout(150);
    await expect(root).toHaveScreenshot('ui-showcase-dark.png', { animations: 'disabled', mask: [] });
  });
});
