# Database Scripts

This directory contains scripts for managing the Firestore database.

## Adding Quiz Data to Firestore

The scripts in this directory allow you to add quiz data to Firestore. There are three versions of the script:

1. `add-quiz.js` - JavaScript version
2. `add-quiz.ts` - TypeScript version
3. `add-quiz-admin.js` - JavaScript version using Firebase Admin SDK directly

All scripts read data from `quizzes.json` and add it to Firestore.

## Prerequisites

Before running the scripts, make sure you have:

1. Firebase Admin SDK installed:
   ```bash
   npm install firebase-admin --save-dev
   ```

2. For TypeScript version, you need ts-node:
   ```bash
   npm install -g ts-node
   ```

3. For the admin script, you need dotenv:
   ```bash
   npm install dotenv --save-dev
   ```

4. Firebase credentials set up in one of the following ways:
   - Set the `GOOGLE_APPLICATION_CREDENTIALS` environment variable to point to your service account key file
   - Place a `service-account-key.json` file in the project root
   - Use application default credentials (run `firebase login` first)

## Running the Scripts

### JavaScript Version

```bash
node scripts/db/add-quiz.js
```

### TypeScript Version

```bash
npx ts-node scripts/db/add-quiz.ts
```

### Admin Version

```bash
node scripts/db/add-quiz-admin.js
```

## Using Firebase Emulators

To use Firebase emulators instead of the production database, set the following environment variables:

```bash
export USE_FIREBASE_EMULATORS=true
export FIRESTORE_EMULATOR_HOST=localhost:8080
```

Or run:

```bash
USE_FIREBASE_EMULATORS=true FIRESTORE_EMULATOR_HOST=localhost:8080 node scripts/db/add-quiz.js
```

For the admin version:

```bash
USE_FIREBASE_EMULATORS=true node scripts/db/add-quiz-admin.js
```

## Data Structure

The `quizzes.json` file contains the following collections:

1. `Quizzes` - Quiz documents
2. `Categories` - Category documents
3. `Questions` - Question documents

Each document has an ID that matches its key in the JSON file.

## Customizing the Data

To add your own data, modify the `quizzes.json` file. Make sure to follow the structure defined in the `app/types/quiz.ts` file.

## Verifying the Data

After running the script, you can verify that the data was added to Firestore by:

1. Checking the Firebase console at https://console.firebase.google.com/
2. Using the Firebase emulator UI at http://localhost:4000/firestore
3. Querying the data from your application

## Important Note on Collection Names

The collection names in Firestore are case-sensitive. This script uses the following collection names:
- `Quizzes` (with capital 'Q')
- `Categories` (with capital 'C')
- `Questions` (with capital 'Q')

Make sure your application code uses the same capitalization when querying these collections. 