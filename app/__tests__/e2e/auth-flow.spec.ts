/**
 * End-to-end tests for authentication flows
 * 
 * These tests use Playwright to test the complete authentication flow
 * including redirects and protected routes.
 * 
 * To run these tests:
 * 1. Start the Firebase emulators: npm run emulators
 * 2. Start the Next.js dev server: npm run dev
 * 3. Run the tests: npx playwright test
 */

import { test, expect, Page } from '@playwright/test';

// Test user credentials
const TEST_USER = {
  email: `test-${Date.now()}@example.com`,
  password: 'Test@123456',
  displayName: 'Test User',
};

// Test setup and teardown
test.beforeEach(async ({ page }: { page: Page }) => {
  // Navigate to the home page
  await page.goto('/');
});

// Helper function to register a new user
async function registerNewUser(page: Page, user = TEST_USER) {
  // Navigate to auth page
  await page.goto('/auth');
  
  // Switch to registration form
  await page.click('text=Don\'t have an account? Sign up');
  
  // Fill in the registration form
  await page.fill('input[name="email"]', user.email);
  await page.fill('input[name="password"]', user.password);
  await page.fill('input[name="displayName"]', user.displayName);
  
  // Submit the form
  await page.click('button:has-text("Create Account")');
  
  // Wait for registration to complete and redirect
  await page.waitForURL('/', { timeout: 10000 });
}

// Helper function to sign in
async function signIn(page: Page, email: string, password: string) {
  // Navigate to auth page
  await page.goto('/auth');
  
  // Fill in the login form
  await page.fill('input[name="email"]', email);
  await page.fill('input[name="password"]', password);
  
  // Submit the form
  await page.click('button:has-text("Sign In")');
  
  // Wait for login to complete and redirect
  await page.waitForURL('/', { timeout: 10000 });
}

// Helper function to sign out
async function signOut(page: Page) {
  // Click the user menu
  await page.click('button[aria-label="User menu"]');
  
  // Click the sign out button
  await page.click('button:has-text("Sign Out")');
  
  // Wait for sign out to complete
  await page.waitForSelector('a:has-text("Sign In")');
}

// Test the complete registration flow
test('should register a new user and redirect to home page', async ({ page }: { page: Page }) => {
  // Generate a unique email for this test
  const uniqueEmail = `test-${Date.now()}@example.com`;
  const user = { ...TEST_USER, email: uniqueEmail };
  
  await registerNewUser(page, user);
  
  // Verify we're on the home page
  expect(page.url()).toContain('/');
  
  // Verify user is logged in
  await expect(page.locator('button[aria-label="User menu"]')).toBeVisible();
});

// Test the sign in flow
test('should sign in an existing user and redirect to home page', async ({ page }: { page: Page }) => {
  // First register a new user
  const uniqueEmail = `test-${Date.now()}@example.com`;
  const user = { ...TEST_USER, email: uniqueEmail };
  
  await registerNewUser(page, user);
  
  // Sign out
  await signOut(page);
  
  // Sign in with the same user
  await signIn(page, user.email, user.password);
  
  // Verify we're on the home page
  expect(page.url()).toContain('/');
  
  // Verify user is logged in
  await expect(page.locator('button[aria-label="User menu"]')).toBeVisible();
});

// Test the sign out flow
test('should sign out a user', async ({ page }: { page: Page }) => {
  // First register a new user
  const uniqueEmail = `test-${Date.now()}@example.com`;
  const user = { ...TEST_USER, email: uniqueEmail };
  
  await registerNewUser(page, user);
  
  // Sign out
  await signOut(page);
  
  // Verify user is logged out
  await expect(page.locator('a:has-text("Sign In")')).toBeVisible();
});

// Test access to protected routes
test('should redirect to login when accessing protected route while logged out', async ({ page }: { page: Page }) => {
  // Try to access a protected route
  await page.goto('/dashboard');
  
  // Should redirect to login page
  expect(page.url()).toContain('/auth');
});

// Test access to protected routes when logged in
test('should allow access to protected routes when logged in', async ({ page }: { page: Page }) => {
  // First register a new user
  const uniqueEmail = `test-${Date.now()}@example.com`;
  const user = { ...TEST_USER, email: uniqueEmail };
  
  await registerNewUser(page, user);
  
  // Try to access a protected route
  await page.goto('/dashboard');
  
  // Should not redirect
  expect(page.url()).toContain('/dashboard');
});

// Test error handling for invalid credentials
test('should show error message for invalid credentials', async ({ page }: { page: Page }) => {
  // Navigate to auth page
  await page.goto('/auth');
  
  // Fill in the login form with invalid credentials
  await page.fill('input[name="email"]', 'invalid@example.com');
  await page.fill('input[name="password"]', 'wrongpassword');
  
  // Submit the form
  await page.click('button:has-text("Sign In")');
  
  // Wait for error message
  await expect(page.locator('text=Invalid email or password')).toBeVisible();
});

// Test error handling for existing email during registration
test('should show error message for existing email during registration', async ({ page }: { page: Page }) => {
  // First register a new user
  const uniqueEmail = `test-${Date.now()}@example.com`;
  const user = { ...TEST_USER, email: uniqueEmail };
  
  await registerNewUser(page, user);
  
  // Sign out
  await signOut(page);
  
  // Try to register with the same email
  await page.goto('/auth');
  await page.click('text=Don\'t have an account? Sign up');
  await page.fill('input[name="email"]', user.email);
  await page.fill('input[name="password"]', user.password);
  await page.fill('input[name="displayName"]', user.displayName);
  await page.click('button:has-text("Create Account")');
  
  // Wait for error message
  await expect(page.locator('text=Email already in use')).toBeVisible();
});

// Test password reset flow
test('should show password reset confirmation', async ({ page }: { page: Page }) => {
  // Navigate to auth page
  await page.goto('/auth');
  
  // Click the forgot password link
  await page.click('text=Forgot password?');
  
  // Fill in the email
  await page.fill('input[name="email"]', TEST_USER.email);
  
  // Submit the form
  await page.click('button:has-text("Reset Password")');
  
  // Wait for confirmation message
  await expect(page.locator('text=Password reset email sent')).toBeVisible();
}); 