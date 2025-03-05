# Firebase Configuration Summary

This document provides a summary of the Firebase configuration for the Triviape application.

## Environment Variables

The following environment variables are used for Firebase configuration:

- `NEXT_PUBLIC_FIREBASE_API_KEY`: Firebase API key
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`: Firebase auth domain
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID`: Firebase project ID
- `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`: Firebase storage bucket
- `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`: Firebase messaging sender ID
- `NEXT_PUBLIC_FIREBASE_APP_ID`: Firebase app ID
- `NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID`: Firebase measurement ID (optional)
- `USE_FIREBASE_EMULATOR`: Set to 'true' to use Firebase emulators
- `FIRESTORE_EMULATOR_HOST`: Host for Firestore emulator (e.g., 'localhost:8080')
- `FIREBASE_AUTH_EMULATOR_HOST`: Host for Auth emulator (e.g., 'localhost:9099')
- `FIREBASE_STORAGE_EMULATOR_HOST`: Host for Storage emulator (e.g., 'localhost:9199')

## Firebase Services Used

- **Authentication**: User authentication and management
- **Firestore**: NoSQL database for storing application data
- **Storage**: File storage for user uploads and application assets

## Firestore Collections

- **Categories**: Quiz categories
- **Questions**: Quiz questions
- **Quizzes**: Quiz metadata and configuration
- **Users**: User profiles and settings
- **UserStats**: User statistics and achievements
- **QuizAttempts**: Records of user quiz attempts

## Sample Data

The application includes scripts to populate Firestore with sample data:

### Quiz Data
- **Categories**: Programming, Web Development, TypeScript, React, CSS, JavaScript, Next.js
- **Quizzes**: 6 sample quizzes with varying difficulties and categories
- **Questions**: Multiple questions with different types (multiple choice, true/false)

### User Data
- **Users**: 3 sample users with profiles, preferences, and privacy settings
- **UserStats**: Statistics for each user including quiz performance and achievements
- **QuizAttempts**: Sample quiz attempt records for each user

## Scripts

- `firebase:setup`: Set up Firebase configuration
- `firebase:verify`: Verify Firestore collections
- `firebase:import-data`: Import sample quiz data
- `firebase:add-users`: Import sample user data
- `firebase:start-emulators`: Start Firebase emulators
- `firebase:check-emulators`: Check if emulators are running
- `firebase:deploy`: Deploy to Firebase

## Emulator Ports

- Firestore: 8080
- Authentication: 9099
- Storage: 9199
- Emulator UI: 4000

## Security Rules

Firebase security rules are defined in:
- `firestore.rules`: Rules for Firestore
- `storage.rules`: Rules for Storage

## Next Steps

1. Complete user authentication flow
2. Implement quiz functionality
3. Set up user profile management
4. Implement quiz attempt tracking
5. Configure security rules for production 