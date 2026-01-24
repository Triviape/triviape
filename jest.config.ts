import type { Config } from 'jest';
import nextJest from 'next/jest';
import { join } from 'path';

const createJestConfig = nextJest({
  // Provide the path to your Next.js app to load next.config.js and .env files
  dir: './',
});

// Add any custom config to be passed to Jest
const config: Config = {
  coverageProvider: 'v8',
  testEnvironment: 'jsdom',
  // Setup files
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  moduleNameMapper: {
    '^@/app/(.*)$': '<rootDir>/app/$1',
  },
  testMatch: ['**/__tests__/**/*.test.[jt]s?(x)'],
  // Add module directory names to make module resolution work correctly
  moduleDirectories: ['node_modules', '<rootDir>'],
  // Ensure the path mapping works correctly
  modulePaths: [join(__dirname, '')],
  // Test environment configuration
  testTimeout: 30000, // Longer timeout for emulator tests
  // Configure test coverage
  collectCoverageFrom: [
    'app/**/*.{js,jsx,ts,tsx}',
    '!app/**/*.d.ts',
    '!app/**/_*.{js,jsx,ts,tsx}',
    '!app/**/*.stories.{js,jsx,ts,tsx}',
    '!app/api/**',
    '!**/node_modules/**',
  ],
  // Configure test reporting
  verbose: true,
  // Transform ESM modules from node_modules
  transformIgnorePatterns: [
    'node_modules/(?!(next-auth|@auth|@panva)/)',
  ],
};

// createJestConfig is exported this way to ensure that next/jest can load the Next.js config
export default createJestConfig(config); 