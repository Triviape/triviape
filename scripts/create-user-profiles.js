/**
 * Create Firestore profiles for existing sample users
 * This script creates profiles in Firestore for users that already exist in Auth
 */

const { initializeApp } = require('firebase/app');
const { 
  getAuth, 
  signInWithEmailAndPassword,
  connectAuthEmulator 
} = require('firebase/auth');
const { 
  getFirestore, 
  doc, 
  setDoc,
  Timestamp,
  connectFirestoreEmulator 
} = require('firebase/firestore');

// Sample users
const SAMPLE_USERS = [
  { email: 'alex@example.com', password: 'password123' },
  { email: 'samantha@example.com', password: 'password123' },
  { email: 'miguel@example.com', password: 'password123' }
];

// Default user preferences
const DEFAULT_USER_PREFERENCES = {
  theme: 'system',
  soundEffects: true,
  musicVolume: 70,
  sfxVolume: 100,
  language: 'en',
  notifications: {
    dailyReminder: true,
    quizAvailable: true,
    friendActivity: true,
    teamActivity: true
  },
  animationLevel: 'full'
};

// Default privacy settings
const DEFAULT_PRIVACY_SETTINGS = {
  profileVisibility: 'public',
  showOnlineStatus: true,
  showActivity: true,
  allowFriendRequests: true,
  allowTeamInvites: true
};

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
 * Create user profiles in Firestore
 */
async function createUserProfiles() {
  console.log('Creating user profiles in Firestore for existing users...');
  
  for (const user of SAMPLE_USERS) {
    try {
      // Sign in the user to get their UID
      const userCredential = await signInWithEmailAndPassword(auth, user.email, user.password);
      const uid = userCredential.user.uid;
      const displayName = user.email.split('@')[0]; // Use part before @ as display name
      
      // Create timestamp
      const now = Timestamp.now();
      
      // Create user profile in Firestore
      const userDocRef = doc(db, 'users', uid);
      await setDoc(userDocRef, {
        uid: uid,
        displayName: displayName,
        email: user.email,
        createdAt: now.toMillis(),
        lastLoginAt: now.toMillis(),
        isActive: true,
        level: 1,
        xp: 0,
        xpToNextLevel: 100,
        coins: 0,
        quizzesTaken: 0,
        questionsAnswered: 0,
        correctAnswers: 0,
        preferences: DEFAULT_USER_PREFERENCES,
        privacySettings: DEFAULT_PRIVACY_SETTINGS
      });
      
      // Create user stats in Firestore
      const userStatsDocRef = doc(db, 'user_stats', uid);
      await setDoc(userStatsDocRef, {
        userId: uid,
        bestCategory: null,
        worstCategory: null,
        averageScore: 0,
        highestScore: 0,
        totalPlayTime: 0,
        longestStreak: 0,
        currentStreak: 0,
        quizzesTaken: 0,
        quizzesCreated: 0,
        totalPoints: 0,
        correctAnswers: 0,
        totalAnswers: 0,
        streak: 0,
        lastPlayed: null,
        createdAt: now,
        updatedAt: now
      });
      
      console.log(`✅ Created profile for ${user.email} (UID: ${uid})`);
    } catch (error) {
      console.error(`❌ Error creating profile for ${user.email}:`, error.message);
    }
  }
  
  console.log('User profile creation completed');
}

// Run the profile creation
createUserProfiles().catch(console.error); 