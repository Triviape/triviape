/**
 * Verify user profiles in Firestore
 * This script checks if the sample users have proper profiles in Firestore
 */

const { initializeApp } = require('firebase/app');
const { 
  getAuth, 
  signInWithEmailAndPassword,
  connectAuthEmulator 
} = require('firebase/auth');
const { 
  getFirestore, 
  collection, 
  doc, 
  getDoc,
  connectFirestoreEmulator 
} = require('firebase/firestore');

// Sample users
const SAMPLE_USERS = [
  { email: 'alex@example.com', password: 'password123' },
  { email: 'samantha@example.com', password: 'password123' },
  { email: 'miguel@example.com', password: 'password123' }
];

// Firebase configuration for emulator
const firebaseConfig = {
  apiKey: 'demo-api-key',
  authDomain: 'demo-project-id.firebaseapp.com',
  projectId: 'demo-project-id',
  storageBucket: 'demo-project-id.appspot.com',
  messagingSenderId: '123456789012',
  appId: '1:123456789012:web:abcdef1234567890'
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Connect to emulators
connectAuthEmulator(auth, 'http://localhost:9099');
connectFirestoreEmulator(db, 'localhost', 8080);

/**
 * Verify user profiles in Firestore
 */
async function verifyUserProfiles() {
  console.log('Verifying user profiles in Firestore...');
  
  for (const user of SAMPLE_USERS) {
    try {
      // Sign in the user
      const userCredential = await signInWithEmailAndPassword(auth, user.email, user.password);
      const uid = userCredential.user.uid;
      
      // Check user profile in Firestore
      const userDocRef = doc(db, 'users', uid);
      const userDoc = await getDoc(userDocRef);
      
      if (userDoc.exists()) {
        const userData = userDoc.data();
        console.log(`✅ User profile found for ${user.email} (UID: ${uid})`);
        console.log('Profile data:', JSON.stringify({
          displayName: userData.displayName,
          email: userData.email,
          createdAt: new Date(userData.createdAt).toISOString(),
          lastLoginAt: new Date(userData.lastLoginAt).toISOString(),
          level: userData.level,
          xp: userData.xp
        }, null, 2));
      } else {
        console.log(`❌ No user profile found for ${user.email} (UID: ${uid})`);
      }
      
      // Check user stats in Firestore
      const userStatsDocRef = doc(db, 'user_stats', uid);
      const userStatsDoc = await getDoc(userStatsDocRef);
      
      if (userStatsDoc.exists()) {
        console.log(`✅ User stats found for ${user.email} (UID: ${uid})`);
      } else {
        console.log(`❌ No user stats found for ${user.email} (UID: ${uid})`);
      }
      
      console.log('-----------------------------------');
    } catch (error) {
      console.error(`❌ Error verifying user ${user.email}:`, error.message);
    }
  }
  
  console.log('User profile verification completed');
}

// Run the verification
verifyUserProfiles().catch(console.error); 