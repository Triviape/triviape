# Firebase Configuration Summary

This document provides a summary of the Firebase configuration for the Triviape application.

## Environment Variables

The following environment variables are used for Firebase configuration:

```
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=your_measurement_id

# Firebase Emulators (for development)
NEXT_PUBLIC_USE_FIREBASE_EMULATOR=true
USE_FIREBASE_EMULATOR=true

# Firestore Emulator Host
FIRESTORE_EMULATOR_HOST=localhost:8080

# Auth Emulator Host
NEXT_PUBLIC_AUTH_EMULATOR_HOST=http://localhost:9099

# Storage Emulator Host
NEXT_PUBLIC_STORAGE_EMULATOR_HOST=http://localhost:9199
```

## Firebase Services

The Triviape application uses the following Firebase services:

- **Firestore**: For storing quiz data, questions, categories, and user attempts
- **Authentication**: For user authentication and management
- **Storage**: For storing images and other media files

## Firestore Collections

The following collections are used in Firestore:

- **Quizzes**: Contains quiz documents
- **Questions**: Contains question documents
- **Categories**: Contains category documents
- **QuizAttempts**: Stores user quiz attempts
- **Users**: Stores user profile information

## Firebase Scripts

The following scripts are available for managing Firebase:

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

# Comprehensive setup (all of the above)
npm run setup:all
```

## Emulator Ports

The Firebase emulators run on the following ports:

- **Authentication**: http://localhost:9099
- **Firestore**: http://localhost:8080
- **Storage**: http://localhost:9199
- **Emulator UI**: http://localhost:4000

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

## Sample Data

The application includes sample data for:

- 6 quizzes (quiz1-quiz6)
- Multiple questions
- 7 categories (programming, web-development, typescript, react, css, javascript, nextjs)

## Next Steps

1. Test the authentication flow in your application
2. Implement quiz functionality using the Firestore data
3. Add user profile management
4. Implement quiz attempt tracking
5. Add leaderboards and social features 