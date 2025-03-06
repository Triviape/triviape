# Authentication Testing

This directory contains tests for the authentication system, including unit tests, integration tests, and end-to-end tests.

## Running Authentication Tests

1. Start Firebase emulators:
   ```
   npm run emulators
   ```

2. Run unit and integration tests:
   ```
   npm test
   ```

3. For end-to-end tests, start the Next.js dev server in another terminal:
   ```
   npm run dev
   ```
   Then run the Playwright tests:
   ```
   npm run test:e2e
   ```

## Test Categories

- **Unit Tests**: Test individual components and hooks in isolation
- **Integration Tests**: Test interactions between components and services
- **End-to-End Tests**: Test complete user flows in a browser environment
- **Security Tests**: Test authentication and authorization mechanisms

## Test Files

### Unit Tests
- `app/__tests__/hooks/useAuth.test.ts`: Tests for the authentication hook
- `app/__tests__/components/AuthProvider.test.tsx`: Tests for the authentication provider component

### Integration Tests
- `app/__tests__/api/auth-api.test.ts`: Tests for authentication API routes

### End-to-End Tests
- `app/__tests__/e2e/auth-flow.spec.ts`: Tests for complete authentication flows

### Security Tests
- `app/__tests__/security/token-validation.test.ts`: Tests for token validation
- `app/__tests__/security/api-protection.test.ts`: Tests for API route protection

## Test Utilities

### Firebase Test Utilities
- `app/__tests__/utils/firebase-test-utils.ts`: Utilities for testing with Firebase emulators

### General Test Utilities
- `app/__tests__/utils/test-utils.tsx`: General test utilities for rendering components with providers

## Skipping Tests

Tests that require Firebase emulators will be skipped if the emulators are not running. This is useful for CI/CD environments where emulators might not be available.

## TypeScript Configuration

The test files use TypeScript and are configured to work with the project's TypeScript settings. Key points:

1. **JSX in Test Files**: Test files that include JSX should use the `.tsx` extension.
2. **Firebase Types**: We import types like `User` from `firebase/auth` to properly type Firebase objects.
3. **Mock Types**: When mocking functions, we use `jest.Mock` type assertions to ensure type safety.
4. **Test Utilities**: The test utilities are typed to provide proper type checking when used in tests.

## Adding New Tests

When adding new tests:

1. Use the existing utilities where possible
2. Follow the same patterns for mocking and assertions
3. Place tests in the appropriate directory based on what they're testing
4. Make sure to use proper TypeScript types

## Troubleshooting

If you encounter issues with the tests:

1. Make sure Firebase emulators are running
2. Check that you're using the correct imports and types
3. Verify that mocks are properly set up
4. Check for TypeScript errors in your test files 