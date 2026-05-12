# Firebase Setup Guide

This guide provides comprehensive instructions for setting up Firebase for the Triviape application, including Firestore, Authentication, Storage, and Emulators.

## Prerequisites

- Node.js 18.x or later
- npm 8.x or later
- Firebase CLI (`npm install -g firebase-tools`)
- A Firebase project created in the [Firebase Console](https://console.firebase.google.com/)

## Quick Setup

### 1. Install Dependencies

```bash
# Install Firebase CLI globally
npm install -g firebase-tools

# Login to Firebase
firebase login
```

### 2. Initialize Firebase Project

```bash
# Initialize Firebase in your project
firebase init
```

**Select the following services:**
- Firestore Database
- Authentication  
- Storage
- Hosting (optional for local development)

**Configuration options:**
- Choose your Firebase project
- Accept default Firestore rules and indexes
- Accept default Authentication settings
- Accept default Storage rules
- For Hosting: set public directory to `out` (for Next.js static export)

### 3. Environment Configuration

Create or update your `.env.local` file with the following configuration:

```bash
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

# Emulator Hosts
FIRESTORE_EMULATOR_HOST=localhost:8080
FIREBASE_AUTH_EMULATOR_HOST=localhost:9099
NEXT_PUBLIC_AUTH_EMULATOR_HOST=http://localhost:9099
FIREBASE_STORAGE_EMULATOR_HOST=localhost:9199
NEXT_PUBLIC_STORAGE_EMULATOR_HOST=http://localhost:9199
```

**Get configuration values from:**
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Go to Project Settings > General
4. Scroll down to "Your apps" section
5. Copy the configuration values

### 4. Start Firebase Emulators

```bash
# Start all emulators
firebase emulators:start

# Or use the npm script
npm run firebase:start-emulators
```

**Available emulator ports:**
- Firestore: `localhost:8080`
- Authentication: `localhost:9099`
- Storage: `localhost:9199`
- Emulator UI: `localhost:4000`

### 5. Import Sample Data

```bash
# Import basic sample data
npm run firebase:import-data

# Import additional quiz data
npm run firebase:import-additional-data

# Verify collections exist
npm run firebase:verify
```

### 6. Verify Setup

```bash
# Check if emulators are running
npm run firebase:check-emulators

# Test authentication
npm run dev
# Navigate to http://localhost:3000/test/auth
```

## Project Structure

### Firebase Configuration Files

- `src/config/firebase.ts` - Main Firebase configuration
- `app/lib/firebase.ts` - Firebase services initialization
- `app/providers/firebase-provider.tsx` - React context provider
- `firebase.json` - Firebase project configuration
- `firestore.rules` - Firestore security rules
- `firestore.indexes.json` - Firestore indexes

### Key Directories

- `src/config/` - Firebase configuration and utilities
- `app/lib/services/` - Firebase service implementations
- `app/hooks/` - Firebase-related React hooks
- `scripts/db/` - Database setup and sample data scripts

## Data Structure

### Firestore Collections

**Quizzes Collection:**
```typescript
{
  id: string;
  title: string;
  description: string;
  categoryIds: string[];
  difficulty: 'easy' | 'medium' | 'hard';
  questionIds: string[];
  shuffleQuestions: boolean;
  estimatedDuration: number;
  baseXP: number;
  baseCoins: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  isActive: boolean;
  timesPlayed: number;
  averageScore: number;
  completionRate: number;
  timeLimit?: number;
  passingScore?: number;
  coverImage?: string;
}
```

**Questions Collection:**
```typescript
{
  id: string;
  text: string;
  type: 'multiple-choice' | 'true-false' | 'fill-blank';
  difficulty: 'easy' | 'medium' | 'hard';
  categoryIds: string[];
  answers: Answer[];
  points: number;
  timeLimit?: number;
  hint?: string;
  timesAnswered: number;
  timesAnsweredCorrectly: number;
  averageAnswerTime: number;
  skipRate: number;
  tags: string[];
  createdAt: Timestamp;
  updatedAt: Timestamp;
  isActive: boolean;
}
```

**Categories Collection:**
```typescript
{
  id: string;
  name: string;
  description: string;
  icon: string;
  parentCategoryId?: string;
}
```

**QuizAttempts Collection:**
```typescript
{
  id: string;
  userId: string;
  quizId: string;
  startedAt: Timestamp;
  completedAt?: Timestamp;
  questionSequence: string[];
  answers: Answer[];
  score: number;
  maxPossibleScore: number;
  xpEarned: number;
  coinsEarned: number;
  deviceInfo: DeviceInfo;
}
```

## Security Rules

### Firestore Rules

```javascript
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

### Storage Rules

```javascript
rules_version = '2';

service firebase.storage {
  match /b/{bucket}/o {
    // Allow authenticated users to read all files
    match /{allPaths=**} {
      allow read: if request.auth != null;
    }
    
    // Allow users to upload files to their own directory
    match /users/{userId}/{allPaths=**} {
      allow write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

## Authentication Setup

### 1. Enable Authentication Methods

In Firebase Console > Authentication > Sign-in method:

1. **Email/Password**: Enable for basic authentication
2. **Google**: Enable for social login (recommended)
3. **Anonymous**: Enable for guest users (optional)

### 2. Configure Authentication in Code

The application uses the following authentication setup:

```typescript
// Authentication hooks
import { useAuth } from '@/hooks/useAuth';

// Authentication services
import { authService } from '@/lib/services/user/authService';
```

### 3. Test Authentication

Navigate to `http://localhost:3000/test/auth` to test:
- Firebase connection status
- Emulator status
- Authentication flow
- Sample user login

## Development Workflow

### Using Emulators

1. **Start emulators:**
   ```bash
   firebase emulators:start
   ```

2. **Set environment variables:**
   ```bash
   export NEXT_PUBLIC_USE_FIREBASE_EMULATOR=true
   export USE_FIREBASE_EMULATOR=true
   ```

3. **Run development server:**
   ```bash
   npm run dev
   ```

### Available Scripts

```bash
# Firebase management
npm run firebase:start-emulators    # Start emulators
npm run firebase:check-emulators    # Check emulator status
npm run firebase:verify             # Verify collections
npm run firebase:import-data        # Import sample data
npm run firebase:deploy             # Deploy to production

# Development
npm run dev                         # Start development server
npm run build                       # Build for production
npm run test                        # Run tests
```

## Troubleshooting

### Common Issues

**1. Emulator Connection Issues:**
- Ensure emulators are running: `firebase emulators:start`
- Check environment variables are set correctly
- Verify ports are not in use

**2. Authentication Issues:**
- Check Firebase Console > Authentication settings
- Verify environment variables
- Check browser console for errors

**3. Data Import Issues:**
- Ensure emulators are running
- Check data file format (JSON)
- Verify script permissions

**4. Build Issues:**
- Clear Next.js cache: `rm -rf .next`
- Reinstall dependencies: `npm install`
- Check TypeScript errors: `npm run type-check`

### Debug Tools

- **Emulator UI**: `http://localhost:4000`
- **Firestore Emulator**: `http://localhost:8080`
- **Auth Emulator**: `http://localhost:9099`
- **Test Page**: `http://localhost:3000/test/auth`

## Production Deployment

### 1. Build Application

```bash
npm run build
```

### 2. Deploy to Firebase Hosting

```bash
firebase deploy
```

### 3. Environment Variables

Ensure production environment variables are set:
- Remove emulator flags
- Use production Firebase project
- Set up proper security rules

## Additional Resources

- [Firebase Documentation](https://firebase.google.com/docs)
- [Firestore Documentation](https://firebase.google.com/docs/firestore)
- [Authentication Documentation](https://firebase.google.com/docs/auth)
- [Emulator Suite Documentation](https://firebase.google.com/docs/emulator-suite)
- [Next.js Firebase Integration](https://nextjs.org/docs/guides/firebase) 