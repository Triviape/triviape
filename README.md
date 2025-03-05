This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3030](http://localhost:3030) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

### Quick Setup

For a quick and comprehensive setup of the entire development environment, including Firebase emulators and sample data, run:

```bash
npm run setup:all
```

This script will:
1. Check if Firebase CLI is installed and install it if needed
2. Start the Firebase emulators if they're not already running
3. Verify that all required Firestore collections exist
4. Import sample quiz data
5. Import additional quiz data

After running this script, you can start the development server with `npm run dev` and begin working with the application immediately.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Firebase Authentication

This project includes a robust Firebase authentication system with comprehensive testing and debugging tools.

### Setting Up Firebase

1. Create a Firebase project at [Firebase Console](https://console.firebase.google.com/)
2. Add a web app to your Firebase project
3. Copy your Firebase configuration to `.env.local`:

```bash
NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=your-measurement-id
```

4. Enable Email/Password authentication in the Firebase Console

For detailed instructions on setting up Firebase, including Firestore collections, security rules, and sample data, see the [Firebase Setup Guide](./docs/firebase-setup-guide.md).

### Firebase Setup Scripts

This project includes several scripts to help you set up and manage your Firebase integration:

```bash
# Run the Firebase setup script to initialize your project
npm run firebase:setup

# Verify that all required Firestore collections exist
npm run firebase:verify

# Import basic sample quiz data into your Firestore database
npm run firebase:import-data

# Import additional quiz data with more categories and questions
npm run firebase:import-additional-data

# Check if Firebase emulators are running
npm run firebase:check-emulators

# Start the Firebase emulators
npm run firebase:start-emulators

# Deploy your Firebase configuration
npm run firebase:deploy
```

These scripts automate common Firebase tasks and ensure your development environment is properly configured.

### Authentication Testing

The project includes several testing pages to help diagnose authentication issues:

- `/test/auth` - Complete authentication testing dashboard
- `/test/firebase-diagnostics` - Firebase connection diagnostics
- `/test/firebase` - Basic Firebase connectivity tests

For comprehensive testing guidance, see:
- [Authentication Testing Guide](./docs/auth-testing-guide.md)
- [Firebase Authentication Error Guide](./docs/firebase-auth-errors.md)

## Firebase Emulators

This project uses Firebase emulators for local development and testing. The emulators provide a local version of Firebase services without requiring a connection to the actual Firebase services.

### Starting the Emulators

To start the Firebase emulators:

```bash
# Check if all required ports are available
npm run check-ports

# Start only auth, firestore, and storage emulators
npm run emulators

# Start all emulators (including functions, hosting, etc.)
npm run emulators:all

# Start the emulators and the Next.js development server simultaneously
npm run dev:with-emulators

# Check ports, then start emulators and Next.js (recommended)
npm run safe-start
```

### Emulator Ports

The Firebase emulators run on the following ports:

- Authentication: http://localhost:9099
- Firestore: http://localhost:8080
- Storage: http://localhost:9199
- Emulator UI: http://localhost:4000
- Emulator Hub: http://localhost:4400
- Functions: http://localhost:5001
- Hosting: http://localhost:5000
- Database: http://localhost:9000
- DataConnect: http://localhost:9399

For detailed port configuration information, see [Port Configuration Guide](./docs/port-configuration.md).

### Emulator Data

You can export and import data to/from the emulators:

```bash
# Export emulator data
npm run emulators:export

# Start emulators with imported data
npm run emulators:import
```

### Troubleshooting Emulators

If you encounter issues with the emulators:

1. Check if all required ports are available:
   ```bash
   npm run check-ports
   ```

2. Kill processes using the required ports:
   ```bash
   npm run kill-ports
   ```

3. If specific ports are consistently causing issues, see the [Port Configuration Guide](./docs/port-configuration.md) for instructions on how to modify the port assignments.

## Authentication Testing

This project includes a comprehensive testing plan for the authentication system, ensuring that all aspects of user authentication are properly tested and secured.

### Running Authentication Tests

To run the authentication tests, you need to start the Firebase emulators first:

```bash
# Start Firebase emulators
npm run emulators

# In a separate terminal, run the tests
npm test
```

### Test Categories

The authentication testing plan includes the following categories:

1. **Unit Tests**
   - Tests for the `AuthProvider` component
   - Tests for authentication hooks
   - Tests for authentication actions

2. **Integration Tests**
   - User registration flow
   - User login flow
   - User profile management

3. **End-to-End Tests**
   - Complete authentication flows
   - Protected routes
   - Role-based access control

4. **Security Tests**
   - Token validation
   - API route protection

### Test Files

- `app/__tests__/components/auth/AuthProvider.test.tsx` - Tests for the AuthProvider component
- `app/__tests__/hooks/useAuth.test.ts` - Tests for the useAuth hook
- `app/__tests__/integration/auth-flow.test.tsx` - Integration tests for authentication flows
- `app/__tests__/api/auth-api.test.ts` - Tests for authentication API routes
- `app/__tests__/security/token-validation.test.ts` - Security tests for token validation
- `app/__tests__/security/api-protection.test.ts` - Security tests for API route protection
- `app/__tests__/e2e/auth-flow.spec.ts` - End-to-end tests for authentication flows

### Test Utilities

- `app/__tests__/utils/test-utils.ts` - General test utilities
- `app/__tests__/utils/firebase-test-utils.ts` - Firebase-specific test utilities

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
