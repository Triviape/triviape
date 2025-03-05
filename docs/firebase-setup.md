# Firebase Setup Guide

This guide will help you set up Firebase for your Triviape application, including Firestore, Authentication, and Storage.

## Prerequisites

- Node.js and npm installed
- Firebase CLI installed (`npm install -g firebase-tools`)
- A Firebase project created in the [Firebase Console](https://console.firebase.google.com/)

## Setup Steps

### 1. Install Firebase CLI and Login

```bash
# Install Firebase CLI globally
npm install -g firebase-tools

# Login to Firebase
firebase login
```

### 2. Initialize Firebase in Your Project

```bash
# Initialize Firebase in your project
firebase init
```

During initialization:
- Select Firestore, Authentication, Storage, and Hosting
- Choose your Firebase project
- Accept the default options for Firestore rules and indexes
- Choose the default options for Authentication
- Choose the default options for Storage rules
- For Hosting, set the public directory to `out` (for Next.js static export)

### 3. Configure Environment Variables

Create or update your `.env.local` file with your Firebase configuration:

```
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=your_measurement_id

# Firebase Admin (for server-side operations)
FIREBASE_ADMIN_CREDENTIALS={"type":"service_account","project_id":"...","private_key_id":"...","private_key":"...","client_email":"...","client_id":"...","auth_uri":"...","token_uri":"...","auth_provider_x509_cert_url":"...","client_x509_cert_url":"..."}
```

You can get these values from your Firebase project settings in the Firebase Console.

### 4. Set Up Firebase Emulators (for Development)

Firebase emulators allow you to develop and test your application locally without affecting your production data.

```bash
# Start Firebase emulators
firebase emulators:start
```

To use the emulators in your application, set the following environment variables:

```
NEXT_PUBLIC_USE_FIREBASE_EMULATOR=true
USE_FIREBASE_EMULATOR=true
```

### 5. Import Sample Data

We've provided scripts to import sample quiz data into your Firestore database:

```bash
# Import basic sample data
npm run firebase:import-data

# Import additional quiz data
npm run firebase:import-additional-data
```

These scripts will add sample quizzes, questions, and categories to your Firestore database.

You can also use our utility scripts to manage Firebase:

```bash
# Verify Firestore collections exist
npm run firebase:verify

# Check if emulators are running
npm run firebase:check-emulators

# Start Firebase emulators
npm run firebase:start-emulators

# Deploy to Firebase
npm run firebase:deploy
```

### 6. Verify Firestore Collections

After importing the sample data, verify that the following collections exist in your Firestore database:

- `Quizzes`: Contains quiz documents
- `Questions`: Contains question documents
- `Categories`: Contains category documents
- `QuizAttempts`: Will store user quiz attempts

You can verify these collections in the Firebase Console or the Emulator UI.

### 7. Set Up Authentication

In the Firebase Console, go to Authentication and enable the authentication methods you want to use (Email/Password, Google, etc.).

### 8. Deploy to Production

When you're ready to deploy your application to production:

```bash
# Build your Next.js application
npm run build

# Deploy to Firebase Hosting
firebase deploy
```

## Firestore Data Structure

### Collections

- **Quizzes**: Contains quiz documents
  - Fields: id, title, description, categoryIds, difficulty, questionIds, shuffleQuestions, estimatedDuration, baseXP, baseCoins, createdAt, updatedAt, isActive, timesPlayed, averageScore, completionRate, timeLimit, passingScore, coverImage

- **Questions**: Contains question documents
  - Fields: id, text, type, difficulty, categoryIds, answers, points, timeLimit, hint, timesAnswered, timesAnsweredCorrectly, averageAnswerTime, skipRate, tags, createdAt, updatedAt, isActive

- **Categories**: Contains category documents
  - Fields: id, name, description, icon, parentCategoryId

- **QuizAttempts**: Stores user quiz attempts
  - Fields: id, userId, quizId, startedAt, completedAt, questionSequence, answers, score, maxPossibleScore, xpEarned, coinsEarned, deviceInfo

## Security Rules

The following security rules are applied to your Firestore database:

```
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    // Allow authenticated users to read all documents
    match /{document=**} {
      allow read: if request.auth != null;
    }
    
    // Allow users to read and write their own data
    match /Users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Allow users to read quizzes, questions, and categories
    match /Quizzes/{quizId} {
      allow read: if request.auth != null;
    }
    
    match /Questions/{questionId} {
      allow read: if request.auth != null;
    }
    
    match /Categories/{categoryId} {
      allow read: if request.auth != null;
    }
    
    // Allow users to create and read their own quiz attempts
    match /QuizAttempts/{attemptId} {
      allow create: if request.auth != null && request.resource.data.userId == request.auth.uid;
      allow read: if request.auth != null && resource.data.userId == request.auth.uid;
    }
  }
}
```

## Troubleshooting

### Emulator Connection Issues

If you're having trouble connecting to the emulators, make sure:

1. The emulators are running
2. The environment variables are set correctly
3. Your application is configured to use the emulators

### Authentication Issues

If you're having trouble with authentication:

1. Check that the authentication method is enabled in the Firebase Console
2. Verify that your Firebase configuration is correct
3. Check the browser console for any errors

### Data Import Issues

If you're having trouble importing data:

1. Make sure the emulators are running
2. Check that the data file exists and is valid JSON
3. Verify that the script has the correct permissions to access the file

## Additional Resources

- [Firebase Documentation](https://firebase.google.com/docs)
- [Firestore Documentation](https://firebase.google.com/docs/firestore)
- [Authentication Documentation](https://firebase.google.com/docs/auth)
- [Storage Documentation](https://firebase.google.com/docs/storage)
- [Hosting Documentation](https://firebase.google.com/docs/hosting)
- [Emulator Suite Documentation](https://firebase.google.com/docs/emulator-suite) 