// Test script for Firebase Admin initialization
require('dotenv').config();
const admin = require('firebase-admin');

console.log('Testing Firebase Admin initialization...');

// Check if credentials are available
if (process.env.FIREBASE_ADMIN_CREDENTIALS) {
  console.log('✅ FIREBASE_ADMIN_CREDENTIALS is set');
  
  try {
    // Try parsing the credentials
    const serviceAccount = JSON.parse(process.env.FIREBASE_ADMIN_CREDENTIALS);
    console.log('✅ Credentials parsed successfully');
    console.log('Project ID:', serviceAccount.project_id);
    
    // Initialize Firebase Admin
    if (admin.apps.length === 0) {
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
      });
      
      console.log('✅ Firebase Admin initialized successfully');
      
      // Test auth functionality
      admin.auth().listUsers(1)
        .then((listUsersResult) => {
          console.log('✅ Authentication working - retrieved users');
          process.exit(0);
        })
        .catch((error) => {
          console.error('❌ Error listing users:', error);
          process.exit(1);
        });
    }
  } catch (error) {
    console.error('❌ Error parsing credentials:', error);
    process.exit(1);
  }
} else {
  console.error('❌ FIREBASE_ADMIN_CREDENTIALS not set in environment');
  process.exit(1);
} 