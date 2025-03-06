/**
 * Script to add quiz data to Firestore
 * 
 * This script reads quiz data from quizzes.json and adds it to Firestore
 * Run with: node scripts/db/add-quiz.js
 */

// Import Firebase Admin SDK
const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// Get the absolute path to the service account key file
const serviceAccountPath = process.env.GOOGLE_APPLICATION_CREDENTIALS || 
                          path.resolve(process.cwd(), 'service-account-key.json');

// Check if we're using emulators
const useEmulators = process.env.USE_FIREBASE_EMULATORS === 'true' || 
                    process.env.FIRESTORE_EMULATOR_HOST !== undefined;

// Initialize Firebase Admin
let app;
try {
  if (useEmulators) {
    // For emulators, we can initialize with minimal config
    app = admin.initializeApp({
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'triviape-cbc23'
    });
    
    // Connect to Firestore emulator if host is defined
    if (process.env.FIRESTORE_EMULATOR_HOST) {
      const [host, portStr] = process.env.FIRESTORE_EMULATOR_HOST.split(':');
      const port = parseInt(portStr, 10);
      
      admin.firestore().settings({
        host: process.env.FIRESTORE_EMULATOR_HOST,
        ssl: false,
      });
      
      console.log(`Connected to Firestore emulator at ${process.env.FIRESTORE_EMULATOR_HOST}`);
    }
  } else {
    // Check if service account file exists
    if (fs.existsSync(serviceAccountPath)) {
      // Initialize with service account
      app = admin.initializeApp({
        credential: admin.credential.cert(serviceAccountPath)
      });
    } else {
      // Try to use application default credentials
      app = admin.initializeApp({
        credential: admin.credential.applicationDefault(),
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'triviape-cbc23'
      });
    }
  }
} catch (error) {
  console.error('Error initializing Firebase Admin:', error);
  process.exit(1);
}

// Get Firestore instance
const db = admin.firestore();

// Read quiz data from JSON file
const quizDataPath = path.resolve(__dirname, 'quizzes.json');
let quizData;

try {
  const rawData = fs.readFileSync(quizDataPath, 'utf8');
  quizData = JSON.parse(rawData);
} catch (error) {
  console.error(`Error reading quiz data from ${quizDataPath}:`, error);
  process.exit(1);
}

// Function to add quizzes to Firestore
async function addQuizzes() {
  const { quizzes } = quizData;
  const batch = db.batch();
  
  console.log(`Adding ${Object.keys(quizzes).length} quizzes to Firestore...`);
  
  for (const [id, quiz] of Object.entries(quizzes)) {
    const docRef = db.collection('Quizzes').doc(id);
    batch.set(docRef, quiz);
    console.log(`Added quiz: ${quiz.title} (${id})`);
  }
  
  try {
    await batch.commit();
    console.log('Successfully added all quizzes to Firestore!');
  } catch (error) {
    console.error('Error adding quizzes to Firestore:', error);
  }
}

// Function to add categories to Firestore
async function addCategories() {
  const { categories } = quizData;
  const batch = db.batch();
  
  console.log(`Adding ${Object.keys(categories).length} categories to Firestore...`);
  
  for (const [id, category] of Object.entries(categories)) {
    const docRef = db.collection('Categories').doc(id);
    batch.set(docRef, category);
    console.log(`Added category: ${category.name} (${id})`);
  }
  
  try {
    await batch.commit();
    console.log('Successfully added all categories to Firestore!');
  } catch (error) {
    console.error('Error adding categories to Firestore:', error);
  }
}

// Function to add questions to Firestore
async function addQuestions() {
  const { questions } = quizData;
  const batch = db.batch();
  
  console.log(`Adding ${Object.keys(questions).length} questions to Firestore...`);
  
  for (const [id, question] of Object.entries(questions)) {
    const docRef = db.collection('Questions').doc(id);
    batch.set(docRef, question);
    console.log(`Added question: ${question.text.substring(0, 30)}... (${id})`);
  }
  
  try {
    await batch.commit();
    console.log('Successfully added all questions to Firestore!');
  } catch (error) {
    console.error('Error adding questions to Firestore:', error);
  }
}

// Main function to run all operations
async function main() {
  try {
    await addCategories();
    await addQuestions();
    await addQuizzes();
    
    console.log('All data has been successfully added to Firestore!');
    process.exit(0);
  } catch (error) {
    console.error('Error in main execution:', error);
    process.exit(1);
  }
}

// Run the main function
main(); 