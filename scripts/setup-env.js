const readline = require('readline');
const fs = require('fs');
const path = require('path');

// Create readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Function to ask a question and get user input
function askQuestion(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer);
    });
  });
}

// Function to update environment variables
async function updateEnvironmentVariables() {
  console.log('\nUpdating environment variables...');
  
  // Check if .env.local exists
  const envPath = path.resolve(process.cwd(), '.env.local');
  let envContent = '';
  
  if (fs.existsSync(envPath)) {
    envContent = fs.readFileSync(envPath, 'utf8');
  }
  
  // Ask for Firebase configuration
  console.log('\nPlease enter your Firebase configuration:');
  console.log('(You can find this in your Firebase project settings -> General -> Your apps -> Web app)');
  
  const apiKey = await askQuestion('API Key: ');
  const authDomain = await askQuestion('Auth Domain: ');
  const projectId = await askQuestion('Project ID: ');
  const storageBucket = await askQuestion('Storage Bucket: ');
  const messagingSenderId = await askQuestion('Messaging Sender ID: ');
  const appId = await askQuestion('App ID: ');
  const measurementId = await askQuestion('Measurement ID (optional): ');
  
  // Update environment variables
  const firebaseConfig = `
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=${apiKey}
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=${authDomain}
NEXT_PUBLIC_FIREBASE_PROJECT_ID=${projectId}
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=${storageBucket}
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=${messagingSenderId}
NEXT_PUBLIC_FIREBASE_APP_ID=${appId}
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=${measurementId}

# Firebase Emulators (for development)
NEXT_PUBLIC_USE_FIREBASE_EMULATOR=false
USE_FIREBASE_EMULATOR=false
`;
  
  // Write to .env.local
  fs.writeFileSync(envPath, firebaseConfig + envContent.replace(/NEXT_PUBLIC_FIREBASE_.*=.*\n/g, ''));
  
  console.log('\nEnvironment variables updated successfully!');
  rl.close();
}

// Run the update function
updateEnvironmentVariables().catch((error) => {
  console.error('Error during setup:', error);
  rl.close();
  process.exit(1);
}); 