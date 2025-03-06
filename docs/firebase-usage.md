# Firebase Usage Guide

This document explains how to work with Firebase in both development and production environments for the Triviape application.

## Local Development with Firebase Emulators

For local development and testing, we use Firebase emulators to simulate Firebase services without affecting production data.

### Starting the Emulators

1. Run the Firebase emulators:
   ```bash
   npm run emulators
   ```

2. In a separate terminal, start the Next.js development server:
   ```bash
   npm run dev
   ```

### Emulator Configuration

The emulators run on the following ports:

| Service   | Port | UI Access                |
|-----------|------|--------------------------|
| Auth      | 9099 | http://localhost:9099    |
| Firestore | 8080 | http://localhost:4000/firestore |
| Storage   | 9199 | http://localhost:4000/storage |
| Functions | 5001 | http://localhost:4000/functions |
| Database  | 9000 | http://localhost:4000/database |
| Emulator UI | 4000 | http://localhost:4000 |

### Emulator Data Persistence

By default, emulator data is reset when the emulators are restarted. To persist data between sessions:

```bash
# Export data from emulators
firebase emulators:export ./emulator-data

# Start emulators with imported data
firebase emulators:start --import=./emulator-data
```

## Working with Production Firebase

To test against the actual production Firebase database:

1. Disable emulators by setting environment variables:
   ```
   # In .env.local
   NEXT_PUBLIC_USE_FIREBASE_EMULATOR=false
   USE_FIREBASE_EMULATOR=false
   ```

2. Run your Next.js app:
   ```bash
   npm run dev
   ```

3. Your app will now connect to the production Firebase services defined in your environment variables.

### Managing Production Data

For direct manipulation of production data:

1. Use the [Firebase Console](https://console.firebase.google.com/) to view and edit data
2. Use Firebase Admin SDK for server-side operations
3. Consider creating a staging Firebase project for testing with real Firebase services without affecting production data

## Best Practices

1. **Always use emulators for local development** to prevent accidental changes to production data
2. **Create test users in the Auth emulator** for authentication testing
3. **Use environment variables to control Firebase configuration** between environments
4. **Back up production data regularly** using Firebase export tools
5. **Set up proper security rules** in Firestore and Storage before deploying to production

## Troubleshooting

If you encounter issues with the emulators:

1. Check that all emulators are running with `firebase emulators:start`
2. Verify environment variables are set correctly
3. Clear browser cache and local storage if authentication issues occur
4. Check the Firebase emulator logs for errors 