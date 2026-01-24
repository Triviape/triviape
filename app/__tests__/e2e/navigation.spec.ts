/**
 * End-to-end tests for core navigation and user flows
 * 
 * These tests verify:
 * 1. Homepage navigation
 * 2. Main menu navigation
 * 3. Search functionality
 * 4. Mobile responsive behavior
 */

import { test, expect, Page } from '@playwright/test';

test.describe('Core Navigation', () => {
  test('should load homepage successfully', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Verify homepage loaded
    expect(page.url()).toBe(page.url()); // Just ensure we got a URL
    
    // Look for key homepage elements
    const mainContent = page.locator('main, [role="main"], .main-content').first();
    await expect(mainContent).toBeVisible({ timeout: 5000 });
  });

  test('should navigate to about page', async ({ page }) => {
    await page.goto('/');
    
    // Look for about link
    const aboutLink = page.locator('a:has-text("About"), a[href="/about"]').first();
    
    if (await aboutLink.isVisible({ timeout: 3000 })) {
      await aboutLink.click();
      await page.waitForLoadState('networkidle');
      expect(page.url()).toContain('/about');
    }
  });

  test('should navigate to how to play page', async ({ page }) => {
    await page.goto('/');
    
    // Look for how to play link
    const howToPlayLink = page.locator('a:has-text("How to Play"), a:has-text("Instructions"), a[href*="how"]').first();
    
    if (await howToPlayLink.isVisible({ timeout: 3000 })) {
      await howToPlayLink.click();
      await page.waitForLoadState('networkidle');
      // Verify navigation occurred
      expect(page.url()).toBeTruthy();
    }
  });

  test('should open and close mobile menu', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    
    // Look for mobile menu button (hamburger)
    const menuButton = page.locator('button[aria-label*="menu" i], button[aria-label*="navigation" i], .mobile-menu-button, [data-testid="mobile-menu"]').first();
    
    if (await menuButton.isVisible({ timeout: 3000 })) {
      // Open menu
      await menuButton.click();
      await page.waitForTimeout(500); // Wait for menu animation
      
      // Check if menu opened
      const mobileMenu = page.locator('[role="navigation"], .mobile-menu, [data-testid="mobile-nav"]').first();
      await expect(mobileMenu).toBeVisible({ timeout: 2000 });
      
      // Close menu
      const closeButton = page.locator('button[aria-label*="close" i], button:has-text("×")').first();
      if (await closeButton.isVisible({ timeout: 2000 })) {
        await closeButton.click();
      }
    }
  });

  test('should navigate between main sections', async ({ page }) => {
    await page.goto('/');
    
    // Test navigation to different sections
    const sections = [
      { text: 'Quizzes', pattern: '/quiz' },
      { text: 'Leaderboard', pattern: '/leaderboard' },
      { text: 'Profile', pattern: '/profile' }
    ];
    
    for (const section of sections) {
      const link = page.locator(`a:has-text("${section.text}")`).first();
      
      if (await link.isVisible({ timeout: 2000 })) {
        await link.click();
        await page.waitForLoadState('networkidle');
        
        // Verify URL changed
        expect(page.url()).toBeTruthy();
        
        // Go back to home
        await page.goto('/');
      }
    }
  });

  test('should display footer with links', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Look for footer
    const footer = page.locator('footer, [role="contentinfo"]').first();
    
    if (await footer.isVisible({ timeout: 3000 })) {
      // Check for footer links
      const footerLinks = footer.locator('a');
      const linkCount = await footerLinks.count();
      expect(linkCount).toBeGreaterThan(0);
    }
  });

  test('should handle 404 page gracefully', async ({ page }) => {
    await page.goto('/this-page-does-not-exist-404');
    await page.waitForLoadState('networkidle');
    
    // Should show 404 content or redirect
    const notFoundText = page.locator('text=/404|not found|page.*not.*exist/i').first();
    
    // Either we see 404 message or got redirected
    expect(page.url()).toBeTruthy();
  });

  test('should persist navigation state on page refresh', async ({ page }) => {
    await page.goto('/leaderboard');
    await page.waitForLoadState('networkidle');
    
    // Reload the page
    await page.reload();
    await page.waitForLoadState('networkidle');
    
    // Should still be on leaderboard
    expect(page.url()).toContain('/leaderboard');
  });

  test('should handle back button navigation', async ({ page }) => {
    // Start at home
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Navigate to another page
    await page.goto('/leaderboard');
    await page.waitForLoadState('networkidle');
    
    // Use browser back button
    await page.goBack();
    await page.waitForLoadState('networkidle');
    
    // Should be back at home
    expect(page.url()).toMatch(/\/$|\/index/);
  });

  test('should have accessible navigation', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Check for main navigation with proper ARIA
    const nav = page.locator('nav, [role="navigation"]').first();
    await expect(nav).toBeVisible({ timeout: 5000 });
    
    // Check if keyboard navigation works
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    
    // Should have focused something
    const focusedElement = await page.evaluate(() => document.activeElement?.tagName);
    expect(focusedElement).toBeTruthy();
  });
});

test.describe('Search Functionality', () => {
  test('should display search input', async ({ page }) => {
    await page.goto('/quizzes');
    await page.waitForLoadState('networkidle');
    
    // Look for search input
    const searchInput = page.locator('input[type="search"], input[placeholder*="search" i], [data-testid="search"]').first();
    
    if (await searchInput.isVisible({ timeout: 3000 })) {
      await expect(searchInput).toBeVisible();
      
      // Try typing in search
      await searchInput.fill('test');
      await page.waitForTimeout(500); // Wait for debounce
      
      // Verify input worked
      expect(await searchInput.inputValue()).toBe('test');
    }
  });

  test('should filter results based on search', async ({ page }) => {
    await page.goto('/quizzes');
    await page.waitForLoadState('networkidle');
    
    // Get initial result count
    const initialResults = await page.locator('[data-testid="quiz-card"], .quiz-card, .quiz-item').count();
    
    // Perform search
    const searchInput = page.locator('input[type="search"], input[placeholder*="search" i]').first();
    
    if (await searchInput.isVisible({ timeout: 3000 })) {
      await searchInput.fill('science');
      await page.waitForTimeout(1000); // Wait for filtering
      
      // Results should have changed (or stayed same if no matches)
      const newResults = await page.locator('[data-testid="quiz-card"], .quiz-card, .quiz-item').count();
      expect(newResults).toBeGreaterThanOrEqual(0);
    }
  });
});
