#!/usr/bin/env node

/**
 * Utility script to manage Firebase emulators and check port availability
 * 
 * Usage:
 *   node scripts/manage-emulators.js check-ports  - Check if required ports are available
 *   node scripts/manage-emulators.js kill-ports   - Kill processes using the required ports
 */

const { execSync } = require('child_process');
const net = require('net');

// Define the ports used by our application
const PORTS = {
  NEXT_APP: 3030,
  EMULATOR_HUB: 4400,
  EMULATOR_UI: 4000,
  HOSTING: 5000,
  FUNCTIONS: 5001,
  FIRESTORE: 8080,
  DATABASE: 9000,
  AUTH: 9099,
  STORAGE: 9199,
  DATACONNECT: 9399
};

/**
 * Check if a port is in use
 * @param {number} port - The port to check
 * @returns {Promise<boolean>} - True if the port is available, false if in use
 */
function isPortAvailable(port) {
  return new Promise((resolve) => {
    const server = net.createServer();
    
    server.once('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        resolve(false); // Port is in use
      } else {
        resolve(false); // Other error, assume port is unavailable
      }
    });
    
    server.once('listening', () => {
      server.close();
      resolve(true); // Port is available
    });
    
    server.listen(port, '127.0.0.1');
  });
}

/**
 * Check all required ports
 */
async function checkPorts() {
  console.log('Checking port availability...');
  
  const results = [];
  for (const [name, port] of Object.entries(PORTS)) {
    const available = await isPortAvailable(port);
    results.push({ name, port, available });
  }
  
  // Display results
  console.log('\nPort availability:');
  console.log('------------------');
  
  let allAvailable = true;
  for (const { name, port, available } of results) {
    const status = available ? '✅ Available' : '❌ In use';
    console.log(`${name.padEnd(15)}: ${port.toString().padEnd(5)} - ${status}`);
    if (!available) allAvailable = false;
  }
  
  if (allAvailable) {
    console.log('\n✅ All ports are available!');
  } else {
    console.log('\n❌ Some ports are in use. Run "npm run kill-ports" to free them.');
  }
}

/**
 * Kill processes using the required ports
 */
function killPorts() {
  console.log('Killing processes on required ports...');
  
  try {
    const ports = Object.values(PORTS).join(' ');
    execSync(`npx kill-port ${ports}`, { stdio: 'inherit' });
    console.log('\n✅ Successfully killed processes on all ports.');
  } catch (error) {
    console.error('\n❌ Error killing ports:', error.message);
  }
}

// Main execution
const command = process.argv[2];

switch (command) {
  case 'check-ports':
    checkPorts();
    break;
  case 'kill-ports':
    killPorts();
    break;
  default:
    console.log(`
Firebase Emulator Management Utility

Usage:
  node scripts/manage-emulators.js check-ports  - Check if required ports are available
  node scripts/manage-emulators.js kill-ports   - Kill processes using the required ports
    `);
} 