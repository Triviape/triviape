# Firebase Emulators Guide

This document provides instructions on how to set up and use Firebase emulators for local development and testing.

## What are Firebase Emulators?

Firebase emulators allow you to run a local version of Firebase services like Authentication, Firestore, Storage, and Functions. This enables you to:

- Develop and test your app without connecting to production Firebase services
- Work offline without an internet connection
- Run tests against isolated environments
- Avoid usage quotas and billing charges during development
- Reset data easily between test runs

## Available Emulators

The project is configured with the following emulators:

- **Authentication** (port 11001): Emulates Firebase Authentication
- **Firestore** (port 11002): Emulates Firestore database
- **Storage** (port 11003): Emulates Firebase Storage
- **Functions** (port 5001): Emulates Cloud Functions
- **Emulator UI** (port 11000): Provides a web interface to manage emulators

## Prerequisites

Before using Firebase emulators, ensure you have the following installed:

1. Node.js (v14+)
2. Firebase CLI: `npm install -g firebase-tools`
3. Java Runtime Environment (JRE) 11 or higher (required for Firestore and Storage emulators)

## Starting the Emulators

To start all emulators:

```bash
npm run emulators
```

This will start all emulators and open the Emulator UI in your browser at http://localhost:11000.

### Persisting Emulator Data

By default, emulator data is not persisted between sessions. To save and reuse data:

1. Export data from a running emulator session:
   ```bash
   npm run emulators:export
   ```

2. Start emulators with previously exported data:
   ```bash
   npm run emulators:import
   ```

This will store data in the `./firebase-data` directory.

## Connecting to Emulators

### Automatic Configuration

The application is configured to automatically connect to emulators when:

1. The `NODE_ENV` is set to `development` or `test`
2. The `USE_FIREBASE_EMULATOR` environment variable is set to `true`

In these cases, the application will connect to emulators instead of the production Firebase services.

### Manual Configuration

You can manually configure the emulator connection by setting the following environment variables:

**Server-side environment variables:**
```
USE_FIREBASE_EMULATOR=true
FIREBASE_AUTH_EMULATOR_HOST=localhost:11001
FIRESTORE_EMULATOR_HOST=localhost:11002
FIREBASE_STORAGE_EMULATOR_HOST=localhost:11003
```

**Client-side environment variables:**
```
NEXT_PUBLIC_USE_FIREBASE_EMULATOR=true
NEXT_PUBLIC_FIREBASE_AUTH_EMULATOR_HOST=localhost:11001
NEXT_PUBLIC_FIRESTORE_EMULATOR_HOST=localhost:11002
NEXT_PUBLIC_FIREBASE_STORAGE_EMULATOR_HOST=localhost:11003
NEXT_PUBLIC_FIREBASE_FUNCTIONS_EMULATOR_HOST=localhost:5001
```

## Testing with Emulators

The test environment (`.env.test`) is already configured to use emulators. When running tests with:

```bash
npm test
```

The tests will automatically connect to emulators instead of actual Firebase services.

### Running Tests with Emulators

For the best testing experience:

1. Start the emulators in a separate terminal:
   ```bash
   npm run emulators
   ```

2. Run tests in another terminal:
   ```bash
   npm test
   ```

This ensures that test data doesn't affect your development data.

## Emulator UI

The Emulator UI provides a visual interface to:

- View and manage Firestore data
- View and manage Authentication users
- View Storage files
- Monitor Functions execution and logs

Access the UI at: http://localhost:11000

## Security Rules

The project includes security rules for Firestore and Storage:

- `firestore.rules`: Defines Firestore access rules
- `storage.rules`: Defines Storage access rules

Both rule sets include special conditions that allow full access when using emulators for development purposes while maintaining security in production.

## Troubleshooting

### Common Issues

1. **Port conflicts**: If you see errors about ports already in use, you may have another service running on one of the emulator ports. You can change the ports in `firebase.json`.

2. **Missing Java**: If you see errors about Java, make sure you have JRE 11+ installed.

3. **Authentication issues**: If you're having trouble with authentication in the emulator, try:
   - Clearing your browser cookies and local storage
   - Restarting the emulators
   - Using incognito/private browsing

4. **Data persistence**: Remember that emulator data is lost when you stop the emulators unless you use the export/import commands.

### Logs

Emulator logs are displayed in the terminal and in the Emulator UI. Check these logs for debugging information if you encounter issues.

## Further Resources

- [Firebase Emulator Suite Documentation](https://firebase.google.com/docs/emulator-suite)
- [Firebase Local Emulator Security Rules](https://firebase.google.com/docs/rules/emulator-setup)
- [Testing Cloud Firestore Security Rules](https://firebase.google.com/docs/firestore/security/test-rules-emulator) 