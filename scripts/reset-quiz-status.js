/**
 * This script resets the quiz status for a user
 * Useful for testing quiz flow and completion
 */
const admin = require('firebase-admin');
const { getFirestore } = require('firebase-admin/firestore');

// Initialize Firebase Admin if not already initialized
if (!admin.apps.length) {
  admin.initializeApp({
    // Using emulator
    projectId: 'triviape-cbc23',
  });
}

// Connect to Firestore emulator
process.env.FIRESTORE_EMULATOR_HOST = 'localhost:8080';
const db = getFirestore();

async function resetQuizStatus(userId, quizId = 'daily-quiz') {
  try {
    console.log(`Resetting quiz status for user ${userId} and quiz ${quizId}...`);
    
    // Delete quiz status document
    const quizStatusRef = db
      .collection('users')
      .doc(userId)
      .collection('quiz_status')
      .doc(quizId);
    
    await quizStatusRef.delete();
    console.log('Quiz status document deleted.');
    
    // Delete quiz attempts for this quiz
    const querySnapshot = await db
      .collection('quiz_attempts')
      .where('userId', '==', userId)
      .where('quizId', '==', quizId)
      .get();
    
    if (!querySnapshot.empty) {
      const batch = db.batch();
      querySnapshot.forEach(doc => {
        batch.delete(doc.ref);
      });
      
      await batch.commit();
      console.log(`Deleted ${querySnapshot.size} quiz attempts.`);
    } else {
      console.log('No quiz attempts found to delete.');
    }
    
    // Update user's stats to remove the quiz completion
    const userRef = db.collection('users').doc(userId);
    const userDoc = await userRef.get();
    
    if (userDoc.exists) {
      // Decrease quizzes taken count
      await userRef.update({
        quizzesTaken: admin.firestore.FieldValue.increment(-1)
      });
      console.log('Updated user stats.');
    }
    
    console.log('Quiz status reset successfully!');
  } catch (error) {
    console.error('Error resetting quiz status:', error);
  }
}

// Check for command line arguments
const userId = process.argv[2];
const quizId = process.argv[3] || 'daily-quiz';

if (!userId) {
  console.error('Please provide a user ID as the first argument.');
  console.log('Usage: node scripts/reset-quiz-status.js <userId> [quizId]');
  process.exit(1);
}

// Run the reset function
resetQuizStatus(userId, quizId).then(() => {
  console.log('Script completed.');
  process.exit(0);
}).catch(error => {
  console.error('Script failed:', error);
  process.exit(1);
}); 