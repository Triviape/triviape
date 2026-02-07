#!/usr/bin/env node

const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

const USERS_COLLECTION = 'users';
const SUMMARIES_COLLECTION = 'user_profile_summaries';
const DEFAULT_BATCH_SIZE = 250;

function parseArgs(argv) {
  const args = { commit: false, batchSize: DEFAULT_BATCH_SIZE, limit: undefined };

  argv.forEach((arg) => {
    if (arg === '--commit') {
      args.commit = true;
      return;
    }
    if (arg.startsWith('--batch-size=')) {
      const value = Number(arg.split('=')[1]);
      if (Number.isFinite(value) && value > 0 && value <= 500) {
        args.batchSize = value;
      }
      return;
    }
    if (arg.startsWith('--limit=')) {
      const value = Number(arg.split('=')[1]);
      if (Number.isFinite(value) && value > 0) {
        args.limit = value;
      }
    }
  });

  return args;
}

function initializeFirebaseAdmin() {
  const serviceAccountPath =
    process.env.GOOGLE_APPLICATION_CREDENTIALS ||
    path.resolve(process.cwd(), 'triviape-cbc23-firebase-adminsdk-3otvm-770baa5b21.json');

  const useEmulators =
    process.env.USE_FIREBASE_EMULATORS === 'true' ||
    process.env.FIRESTORE_EMULATOR_HOST !== undefined;

  if (admin.apps.length) {
    return admin.firestore();
  }

  if (useEmulators) {
    admin.initializeApp({
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'triviape-cbc23',
    });
    if (process.env.FIRESTORE_EMULATOR_HOST) {
      admin.firestore().settings({
        host: process.env.FIRESTORE_EMULATOR_HOST,
        ssl: false,
      });
    }
    return admin.firestore();
  }

  if (fs.existsSync(serviceAccountPath)) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccountPath),
    });
    return admin.firestore();
  }

  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'triviape-cbc23',
  });
  return admin.firestore();
}

function buildSummary(userData) {
  return {
    displayName: userData.displayName || 'Anonymous',
    photoURL: userData.photoURL || null,
    level: userData.level || 1,
    lastLoginAt: userData.lastLoginAt || null,
    quizzesTaken: userData.quizzesTaken || 0,
    averageScore: userData.averageScore || 0,
    favoriteCategory: userData.favoriteCategory || null,
    achievementsCount: Array.isArray(userData.achievements) ? userData.achievements.length : 0,
    shareActivityWithFriends: userData.privacySettings?.shareActivityWithFriends !== false,
    updatedAt: new Date().toISOString(),
  };
}

async function run() {
  const options = parseArgs(process.argv.slice(2));
  const db = initializeFirebaseAdmin();
  const fieldPath = admin.firestore.FieldPath.documentId();

  console.log(
    `Starting profile summary backfill in ${options.commit ? 'COMMIT' : 'DRY-RUN'} mode` +
      ` (batch-size=${options.batchSize}${options.limit ? `, limit=${options.limit}` : ''})`
  );

  let processed = 0;
  let scanned = 0;
  let lastDoc = null;

  while (true) {
    let usersQuery = db.collection(USERS_COLLECTION).orderBy(fieldPath).limit(options.batchSize);
    if (lastDoc) {
      usersQuery = usersQuery.startAfter(lastDoc);
    }

    const snapshot = await usersQuery.get();
    if (snapshot.empty) {
      break;
    }

    let batch = db.batch();
    let writesInBatch = 0;

    for (const userDoc of snapshot.docs) {
      scanned += 1;
      const summaryRef = db.collection(SUMMARIES_COLLECTION).doc(userDoc.id);
      const summaryData = buildSummary(userDoc.data());

      if (options.commit) {
        batch.set(summaryRef, summaryData, { merge: true });
        writesInBatch += 1;
      }

      processed += 1;
      if (options.limit && processed >= options.limit) {
        break;
      }
    }

    if (options.commit && writesInBatch > 0) {
      await batch.commit();
    }

    lastDoc = snapshot.docs[snapshot.docs.length - 1];
    console.log(`Processed ${processed} users so far...`);

    if (options.limit && processed >= options.limit) {
      break;
    }
  }

  console.log(`Completed. Scanned=${scanned}, Processed=${processed}, Mode=${options.commit ? 'COMMIT' : 'DRY-RUN'}`);
}

run().catch((error) => {
  console.error('Backfill failed:', error);
  process.exit(1);
});
