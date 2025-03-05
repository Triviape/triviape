# Firebase Setup Guide for Triviape

This guide provides detailed instructions for setting up and using Firebase in the Triviape application.

## Prerequisites

Before you begin, make sure you have the following:

1. Node.js and npm installed
2. Firebase CLI installed globally (`npm install -g firebase-tools`)
3. A Firebase account and project created at [Firebase Console](https://console.firebase.google.com/)

## Setup Process

### 1. Initialize Firebase

Run the Firebase setup script to initialize your project:

```bash
npm run firebase:setup
```

This script will:
- Check if Firebase CLI is installed
- Verify if you're logged in to Firebase
- Run `firebase init` to set up your project
- Guide you through entering your Firebase configuration
- Update your environment variables in `.env.local`
- Verify Firestore collections
- Optionally start emulators and import sample data

### 2. Verify Firestore Collections

To verify that all required Firestore collections exist:

```bash
npm run firebase:verify
```

This script checks for the following collections:
- `Quizzes`: Stores quiz metadata and configuration
- `Questions`: Stores quiz questions and answers
- `Categories`: Stores quiz categories
- `QuizAttempts`: Stores user quiz attempts
- `Users`: Stores user data

If any collection is missing or empty, the script will create a sample document.

### 3. Import Sample Data

To populate your Firestore database with sample quiz data:

```bash
npm run firebase:import-data
```

This script adds:
- 4 categories (Programming, Web Development, TypeScript, React)
- Sample questions
- 3 sample quizzes (Introduction to JavaScript, Advanced TypeScript, React Fundamentals)

### 4. Start Firebase Emulators

For local development, you can use Firebase emulators:

```bash
npm run firebase:start-emulators
```

This starts the following emulators:
- Firestore: http://localhost:8080
- Authentication: http://localhost:9099
- Storage: http://localhost:9199
- Emulator UI: http://localhost:4000

You can also use:
```bash
npm run dev:with-emulators
```
to start both the emulators and the Next.js development server.

### 5. Deploy to Firebase

When you're ready to deploy your Firebase configuration:

```bash
npm run firebase:deploy
```

## Firebase Configuration

The application uses the following environment variables for Firebase configuration:

```
NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=your-measurement-id

# Firebase Emulators (for development)
NEXT_PUBLIC_USE_FIREBASE_EMULATOR=false
USE_FIREBASE_EMULATOR=false
```

Set `NEXT_PUBLIC_USE_FIREBASE_EMULATOR` and `USE_FIREBASE_EMULATOR` to `true` when using emulators.

A sample `.env.local.example` file is provided in the project root. Copy this file to `.env.local` and update the values with your Firebase configuration:

```bash
cp .env.local.example .env.local
```

Then edit the `.env.local` file with your actual Firebase configuration values.

## Firestore Data Structure

### Quizzes Collection

Each quiz document contains:
- `id`: Unique identifier
- `title`: Quiz title
- `description`: Quiz description
- `categoryIds`: Array of category IDs
- `difficulty`: Quiz difficulty (easy, medium, hard)
- `questionIds`: Array of question IDs
- `shuffleQuestions`: Whether to shuffle questions
- `estimatedDuration`: Estimated time to complete (in seconds)
- `baseXP`: Base experience points for completion
- `baseCoins`: Base coins for completion
- `createdAt`: Creation timestamp
- `updatedAt`: Last update timestamp
- `isActive`: Whether the quiz is active
- `timesPlayed`: Number of times the quiz has been played
- `averageScore`: Average score of all attempts
- `completionRate`: Percentage of users who complete the quiz
- `timeLimit`: Time limit for the quiz (in seconds)
- `passingScore`: Minimum score to pass (percentage)
- `coverImage`: URL to the quiz cover image (optional)

### Questions Collection

Each question document contains:
- `id`: Unique identifier
- `text`: Question text
- `type`: Question type (multiple_choice, true_false, etc.)
- `difficulty`: Question difficulty
- `categoryIds`: Array of category IDs
- `answers`: Array of answer objects
  - `id`: Answer ID
  - `text`: Answer text
  - `isCorrect`: Whether the answer is correct
  - `explanation`: Explanation for the answer
- `points`: Points for correct answer
- `timeLimit`: Time limit for the question (in seconds)
- `hint`: Hint for the question
- `timesAnswered`: Number of times the question has been answered
- `timesAnsweredCorrectly`: Number of times the question has been answered correctly
- `averageAnswerTime`: Average time to answer (in seconds)
- `skipRate`: Percentage of users who skip the question
- `tags`: Array of tags
- `createdAt`: Creation timestamp
- `updatedAt`: Last update timestamp
- `isActive`: Whether the question is active

### Categories Collection

Each category document contains:
- `id`: Unique identifier
- `name`: Category name
- `description`: Category description
- `icon`: Icon name
- `parentCategoryId`: Parent category ID (optional)

### QuizAttempts Collection

Each quiz attempt document contains:
- `id`: Unique identifier
- `userId`: User ID
- `quizId`: Quiz ID
- `startedAt`: Start timestamp
- `completedAt`: Completion timestamp (null if not completed)
- `score`: Score (percentage)
- `answers`: Array of answer objects
  - `questionId`: Question ID
  - `answerId`: Selected answer ID
  - `isCorrect`: Whether the answer is correct
  - `timeToAnswer`: Time to answer (in seconds)
- `xpEarned`: Experience points earned
- `coinsEarned`: Coins earned
- `completed`: Whether the attempt was completed

### Users Collection

Each user document contains:
- `uid`: User ID (from Firebase Auth)
- `email`: User email
- `displayName`: User display name
- `photoURL`: User profile photo URL
- `createdAt`: Account creation timestamp
- `lastLoginAt`: Last login timestamp
- `xp`: Total experience points
- `coins`: Total coins
- `level`: User level
- `quizzesCompleted`: Number of quizzes completed
- `quizzesStarted`: Number of quizzes started
- `achievements`: Array of achievement objects
  - `id`: Achievement ID
  - `unlockedAt`: Unlock timestamp
- `settings`: User settings object
  - `notifications`: Notification settings
  - `theme`: UI theme preference
  - `sound`: Sound settings

## Security Rules

The following security rules are recommended for Firestore:

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

### Troubleshooting Emulators

If you encounter issues with the emulators:

1. Check if the emulators are running correctly:
   ```bash
   npm run firebase:check-emulators
   ```
   This script will check if all required emulators are running and accessible.

2. Check if all required ports are available:
   ```bash
   npm run check-ports
   ```

3. Kill processes using the required ports:
   ```bash
   npm run kill-ports
   ```

4. Make sure your `.env.local` file has the correct configuration.

### Authentication Issues

If you encounter authentication issues:

1. Check the Firebase Console to ensure Authentication is enabled.
2. Verify that your Firebase configuration in `.env.local` is correct.
3. Use the authentication testing pages:
   - `/test/auth` - Complete authentication testing dashboard
   - `/test/firebase-diagnostics` - Firebase connection diagnostics
   - `/test/firebase` - Basic Firebase connectivity tests

### Data Import Issues

If you encounter issues with data import:

1. Make sure you're running the emulators.
2. Check that the `scripts/db/quizzes.json` file exists and is valid JSON.
3. Verify that your Firebase project has the correct permissions.

## Additional Resources

- [Firebase Documentation](https://firebase.google.com/docs)
- [Next.js with Firebase](https://firebase.google.com/docs/web/setup)
- [Firestore Security Rules](https://firebase.google.com/docs/firestore/security/get-started)
- [Firebase Emulator Suite](https://firebase.google.com/docs/emulator-suite) 