# Firebase Setup Guide for Triviape

This guide explains how to set up Firebase for the Triviape application, both for development and production environments.

## Prerequisites

- Node.js (v16 or higher)
- npm (v7 or higher)
- Firebase CLI (`npm install -g firebase-tools`)

## Quick Setup

For a quick setup of the entire Firebase environment, run:

```bash
npm run setup:all
```

This script will:
1. Create a `.env.local` file if it doesn't exist
2. Run the Firebase setup script
3. Start Firebase emulators if they're not already running
4. Import sample quiz data
5. Import sample user data
6. Verify Firestore collections

## Manual Setup Steps

If you prefer to set up Firebase manually, follow these steps:

### 1. Environment Variables

Create a `.env.local` file in the root directory with the following variables:

```
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-messaging-sender-id
NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=your-measurement-id

# Firebase Emulator Configuration
USE_FIREBASE_EMULATOR=true
FIRESTORE_EMULATOR_HOST=localhost:8080
FIREBASE_AUTH_EMULATOR_HOST=localhost:9099
FIREBASE_STORAGE_EMULATOR_HOST=localhost:9199
```

For development with emulators, you can use placeholder values for the Firebase configuration variables.

### 2. Firebase Setup

Run the Firebase setup script:

```bash
npm run firebase:setup
```

This script will:
- Check if Firebase CLI is installed
- Initialize Firebase in the project
- Set up Firebase emulators

### 3. Start Firebase Emulators

Start the Firebase emulators:

```bash
npm run emulators
```

Or, to start both the emulators and the development server:

```bash
npm run dev:with-emulators
```

### 4. Import Sample Data

Import sample quiz data:

```bash
npm run firebase:import-data
```

Import sample user data:

```bash
npm run firebase:add-users
```

### 5. Verify Firestore Collections

Verify that all required Firestore collections exist:

```bash
npm run firebase:verify
```

## Firebase Emulators

The following emulators are used for local development:

- **Firestore**: `localhost:8080`
- **Authentication**: `localhost:9099`
- **Storage**: `localhost:9199`
- **Emulator UI**: `localhost:4000`

To check if the emulators are running:

```bash
npm run firebase:check-emulators
```

## Firebase Authentication

The application uses Firebase Authentication for user management. Sample users are created with the following credentials:

- **Email**: alex@example.com, **Password**: password123
- **Email**: samantha@example.com, **Password**: password123
- **Email**: miguel@example.com, **Password**: password123

## Firestore Collections

The application uses the following Firestore collections:

- **Categories**: Quiz categories
- **Questions**: Quiz questions
- **Quizzes**: Quiz metadata and configuration
- **Users**: User profiles and settings
- **UserStats**: User statistics and achievements
- **QuizAttempts**: Records of user quiz attempts

## Firebase Storage

Firebase Storage is used for storing user avatars and quiz images. The emulator is configured to run on `localhost:9199`.

## Security Rules

Firebase security rules are defined in:
- `firestore.rules`: Rules for Firestore
- `storage.rules`: Rules for Storage

## Deployment

To deploy the Firebase configuration to production:

```bash
npm run firebase:deploy
```

This will deploy Firestore security rules, Storage security rules, and Firebase functions (if any).

## Troubleshooting

### Emulators Not Starting

If the emulators fail to start:

1. Check if the ports are already in use:
   ```bash
   lsof -i:8080
   lsof -i:9099
   lsof -i:9199
   lsof -i:4000
   ```

2. Kill any processes using those ports:
   ```bash
   kill -9 <PID>
   ```

3. Try starting the emulators again:
   ```bash
   npm run emulators
   ```

### Authentication Issues

If you encounter authentication issues:

1. Check if the Auth emulator is running:
   ```bash
   npm run firebase:check-emulators
   ```

2. Verify that `USE_FIREBASE_EMULATOR` is set to `true` in your `.env.local` file.

3. Clear your browser cookies and local storage.

### Data Import Issues

If data import fails:

1. Check if the Firestore emulator is running:
   ```bash
   npm run firebase:check-emulators
   ```

2. Try running the import scripts individually:
   ```bash
   npm run firebase:import-data
   npm run firebase:add-users
   ```

## Additional Resources

- [Firebase Documentation](https://firebase.google.com/docs)
- [Firebase Emulator Suite](https://firebase.google.com/docs/emulator-suite)
- [Firebase Authentication](https://firebase.google.com/docs/auth)
- [Cloud Firestore](https://firebase.google.com/docs/firestore)
- [Firebase Storage](https://firebase.google.com/docs/storage) 