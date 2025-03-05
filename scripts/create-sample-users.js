const { initializeApp } = require('firebase/app');
const { 
  getAuth, 
  createUserWithEmailAndPassword,
  connectAuthEmulator
} = require('firebase/auth');

// Simple Firebase config for emulator use
const firebaseConfig = {
  apiKey: 'demo-api-key',
  authDomain: 'demo-project-id.firebaseapp.com',
  projectId: 'demo-project-id',
  storageBucket: 'demo-project-id.appspot.com',
  messagingSenderId: '123456789012',
  appId: '1:123456789012:web:abcdef1234567890'
};

// Sample users to create
const sampleUsers = [
  { email: 'alex@example.com', password: 'password123' },
  { email: 'samantha@example.com', password: 'password123' },
  { email: 'miguel@example.com', password: 'password123' }
];

async function createSampleUsers() {
  try {
    // Initialize Firebase
    const app = initializeApp(firebaseConfig);
    const auth = getAuth(app);
    
    // Connect to Auth emulator
    connectAuthEmulator(auth, 'http://localhost:9099');
    
    console.log('Creating sample users in Firebase Auth emulator...');
    
    // Create each sample user
    for (const user of sampleUsers) {
      try {
        await createUserWithEmailAndPassword(auth, user.email, user.password);
        console.log(`✅ Created user: ${user.email}`);
      } catch (error) {
        // Skip if user already exists
        if (error.code === 'auth/email-already-in-use') {
          console.log(`⚠️ User already exists: ${user.email}`);
        } else {
          console.error(`❌ Error creating user ${user.email}:`, error);
        }
      }
    }
    
    console.log('Sample users creation completed');
  } catch (error) {
    console.error('Error initializing Firebase:', error);
  }
}

// Run the function
createSampleUsers(); 