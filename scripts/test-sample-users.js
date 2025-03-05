const { initializeApp } = require('firebase/app');
const { getAuth, signInWithEmailAndPassword, connectAuthEmulator } = require('firebase/auth');

// Simple Firebase config for emulator use
const firebaseConfig = {
  apiKey: 'demo-api-key',
  authDomain: 'demo-project-id.firebaseapp.com',
  projectId: 'demo-project-id',
  storageBucket: 'demo-project-id.appspot.com',
  messagingSenderId: '123456789012',
  appId: '1:123456789012:web:abcdef1234567890'
};

// Sample users to test
const sampleUsers = [
  { email: 'alex@example.com', password: 'password123' },
  { email: 'samantha@example.com', password: 'password123' },
  { email: 'miguel@example.com', password: 'password123' }
];

async function testSampleUsers() {
  try {
    // Initialize Firebase
    const app = initializeApp(firebaseConfig);
    const auth = getAuth(app);
    
    // Connect to Auth emulator
    connectAuthEmulator(auth, 'http://localhost:9099');
    
    console.log('Testing authentication for sample users in Firebase Auth emulator...');
    
    // Try to sign in with each sample user
    for (const user of sampleUsers) {
      try {
        const userCredential = await signInWithEmailAndPassword(auth, user.email, user.password);
        console.log(`✅ Successfully authenticated user: ${user.email} (UID: ${userCredential.user.uid})`);
      } catch (error) {
        console.error(`❌ Error authenticating user ${user.email}:`, error.code, error.message);
      }
    }
    
    console.log('Sample users test completed');
  } catch (error) {
    console.error('Error initializing Firebase:', error);
  }
}

// Run the function
testSampleUsers(); 