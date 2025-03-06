/**
 * Secure Firebase Credentials Script
 * 
 * This script securely handles Firebase service account credentials by:
 * 1. Reading the service account JSON file
 * 2. Storing its contents in an environment variable
 * 3. Providing instructions for secure usage
 * 
 * Usage: node scripts/secure-credentials.js [path-to-service-account-file]
 */

const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// Default paths
const ENV_FILE = '.env.local';
const DEFAULT_SERVICE_ACCOUNT_PATTERN = '*-firebase-adminsdk-*.json';

// Function to find service account file if not provided
function findServiceAccountFile() {
  const files = fs.readdirSync('.');
  const serviceAccountFile = files.find(file => 
    file.includes('-firebase-adminsdk-') && file.endsWith('.json')
  );
  
  if (!serviceAccountFile) {
    console.error('❌ No service account file found matching the pattern:', DEFAULT_SERVICE_ACCOUNT_PATTERN);
    console.error('Please provide the path to your service account file as an argument:');
    console.error('node scripts/secure-credentials.js path/to/service-account.json');
    process.exit(1);
  }
  
  return serviceAccountFile;
}

// Main function
async function secureCredentials() {
  try {
    // Get service account file path
    const serviceAccountPath = process.argv[2] || findServiceAccountFile();
    console.log(`📄 Using service account file: ${serviceAccountPath}`);
    
    // Read service account file
    const serviceAccountContent = fs.readFileSync(serviceAccountPath, 'utf8');
    
    // Validate JSON format
    try {
      JSON.parse(serviceAccountContent);
    } catch (error) {
      console.error('❌ Invalid JSON in service account file');
      process.exit(1);
    }
    
    // Prepare environment variable content
    const envVarContent = serviceAccountContent.replace(/\n/g, '\\n');
    
    // Update .env.local file
    let envContent = '';
    if (fs.existsSync(ENV_FILE)) {
      envContent = fs.readFileSync(ENV_FILE, 'utf8');
      
      // Remove existing FIREBASE_ADMIN_CREDENTIALS if present
      envContent = envContent
        .split('\n')
        .filter(line => !line.startsWith('FIREBASE_ADMIN_CREDENTIALS='))
        .join('\n');
    }
    
    // Add the new credentials
    envContent += `\n# Firebase Admin SDK credentials (added by secure-credentials.js)\n`;
    envContent += `FIREBASE_ADMIN_CREDENTIALS='${envVarContent}'\n`;
    
    // Write updated content back to .env.local
    fs.writeFileSync(ENV_FILE, envContent);
    
    console.log(`✅ Successfully stored service account credentials in ${ENV_FILE}`);
    console.log('🔒 Your Firebase Admin SDK credentials are now securely stored as an environment variable.');
    
    // Provide instructions for using the credentials
    console.log('\n📋 To use these credentials in your code:');
    console.log(`
const admin = require('firebase-admin');

// Initialize Firebase Admin with credentials from environment variable
if (process.env.FIREBASE_ADMIN_CREDENTIALS) {
  const serviceAccount = JSON.parse(process.env.FIREBASE_ADMIN_CREDENTIALS);
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
} else {
  console.error('FIREBASE_ADMIN_CREDENTIALS environment variable not set');
}
`);
    
    // Provide instructions for secure handling
    console.log('\n⚠️ IMPORTANT SECURITY NOTES:');
    console.log('1. NEVER commit your .env.local file to version control');
    console.log('2. Consider moving the original service account file to a secure location outside the project');
    console.log('3. For production, use a secret management service like:');
    console.log('   - Vercel/Netlify environment variables');
    console.log('   - Google Secret Manager');
    console.log('   - AWS Secrets Manager');
    console.log('   - HashiCorp Vault');
    
    // Ask if user wants to delete the original file
    console.log('\n❓ Do you want to delete the original service account file for security?');
    console.log('   If yes, run: rm ' + serviceAccountPath);
    
  } catch (error) {
    console.error('❌ Error securing credentials:', error.message);
    process.exit(1);
  }
}

// Run the script
secureCredentials(); 