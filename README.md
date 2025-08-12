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
1. Create a `.env.local` file if it doesn't exist
2. Run the Firebase setup script
3. Start the Firebase emulators if they're not already running
4. Import sample quiz data
5. Import sample user data
6. Create sample authentication users
7. Verify Firestore collections
8. Export emulator data for persistence

After running this script, you can start the development server with one of these commands:
- `npm run dev` - Start only the Next.js development server
- `npm run dev:with-emulators` - Start both emulators and the development server
- `npm run dev:with-persistent-emulators` - Start both emulators (with data persistence) and the development server
- `npm run dev:complete` - Start emulators, create sample users, and start the development server

For a complete restart of all processes:
```bash
./scripts/restart-dev.sh
```

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Environment Setup and Security

This project requires proper environment configuration for Firebase services. For security reasons, sensitive credentials should never be committed to version control.

### Environment Files

The application uses several environment files:

- `.env.local` - Local development environment variables (not committed to git)
- `.env.test` - Test environment variables
- `.env` - Default environment variables
- `.env.example` - Example environment file with placeholders (committed to git)

### Securing Firebase Service Account

For server-side Firebase operations, a service account is required. We provide a script to securely handle these credentials:

```bash
# Run the script with your service account file
node scripts/secure-credentials.js path/to/your-service-account.json

# Or let it auto-detect the service account file
node scripts/secure-credentials.js
```

This script stores your service account credentials in the `FIREBASE_ADMIN_CREDENTIALS` environment variable in `.env.local`.

For detailed information about environment setup and security best practices, see the [Environment Setup Guide](./docs/environment-setup.md).

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

# Firebase Emulator Configuration
NEXT_PUBLIC_USE_FIREBASE_EMULATOR=true
FIRESTORE_EMULATOR_HOST=localhost:8080
FIREBASE_AUTH_EMULATOR_HOST=localhost:9099
FIREBASE_STORAGE_EMULATOR_HOST=localhost:9199
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

# Import sample quiz data into your Firestore database
npm run firebase:import-data

# Import sample user data with profiles and statistics
npm run firebase:add-users

# Create sample users in the Auth emulator
npm run firebase:create-sample-users

# Check if Firebase emulators are running
npm run firebase:check-emulators

# Check if Auth emulator is properly configured
npm run firebase:check-auth

# Start the Firebase emulators
npm run firebase:start-emulators

# Deploy your Firebase configuration
npm run firebase:deploy

# Run the complete setup process
npm run setup:all
```

These scripts automate common Firebase tasks and ensure your development environment is properly configured.

### Sample User Data

The application includes sample user data for testing and development:

- **Alex Johnson** (alex@example.com / password123)
  - Level 8, 2450 XP, 780 coins
  - 24 quizzes completed, 78.5% average score
  - Dark theme preference

- **Samantha Lee** (samantha@example.com / password123)
  - Level 12, 4120 XP, 1250 coins
  - 42 quizzes completed, 87.1% average score
  - Light theme preference, accessibility features enabled

- **Miguel Rodriguez** (miguel@example.com / password123)
  - Level 5, 1280 XP, 420 coins
  - 12 quizzes completed, 73.8% average score
  - System theme preference, Spanish language

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

# Start emulators with data persistence
npm run emulators:persistent

# Start all emulators (including functions, hosting, etc.)
npm run emulators:all

# Start the emulators and the Next.js development server simultaneously
npm run dev:with-emulators

# Start persistent emulators and the Next.js development server
npm run dev:with-persistent-emulators

# Start everything (emulators, sample users, and Next.js)
npm run dev:complete

# Check ports, then start emulators and Next.js (recommended)
npm run safe-start

# Check ports, then start persistent emulators and Next.js
npm run safe-start:persistent

# Check ports, then start complete development environment
npm run safe-start:complete
```

For a comprehensive guide to Firebase Emulator setup, see [Firebase Emulator Setup Guide](./docs/FIREBASE_EMULATOR_SETUP.md).

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

### Emulator Data Persistence

You can enable data persistence for emulators to maintain your data between restarts:

```bash
# Export emulator data
npm run emulators:export

# Start emulators with imported data
npm run emulators:import

# Start emulators with persistent data
npm run emulators:persistent

# Start development with persistent emulators
npm run dev:with-persistent-emulators
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

3. For authentication issues, create sample users:
   ```bash
   npm run firebase:create-sample-users
   ```

4. For a complete reset and restart:
   ```bash
   ./scripts/restart-dev.sh
   ```

5. If specific ports are consistently causing issues, see the [Port Configuration Guide](./docs/port-configuration.md) for instructions on how to modify the port assignments.

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

## Documentation System

This project includes a comprehensive documentation system that covers architecture, patterns, guides, and reference materials. The documentation is designed to be maintainable, searchable, and machine-readable.

### Documentation Structure

The documentation is organized into several categories:

```
/docs
├── architecture/          # System design and architectural decisions
├── patterns/              # Code patterns and examples
├── guides/                # Developer and operations guides
├── reference/             # Technical reference materials
├── decisions/             # Architecture Decision Records
├── standards/             # Development standards
├── schemas/               # JSON schemas for LLM parsing
└── templates/             # Templates for new documentation
```

### Accessing Documentation

You can browse the documentation directly in the codebase or use the documentation generation tools:

```bash
# Generate documentation from code
node scripts/generate-docs.js --type pattern --source app/lib/componentUtils.ts --output docs/patterns/component-patterns/generated-example.md

# Add documentation references to code
node scripts/add-doc-refs.js --file app/components/ui/Button.tsx --doc docs/reference/components/ui-components.md --type component
```

### Documentation Standards

All documentation follows the standards specified in [documentation-standards.md](./docs/standards/documentation-standards.md). This ensures consistency and maintainability across all documentation.

### Machine-Readable Documentation

The documentation includes machine-readable metadata that can be parsed by AI assistants and other tools. This enables advanced features like:

- Automatic linking between code and documentation
- AI-assisted documentation generation
- Documentation validation and quality checks

For more information, see the [Documentation README](./docs/README.md).

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
