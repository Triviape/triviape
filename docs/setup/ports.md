# Port Configuration Guide

This document outlines the port configuration for the Triviape application and its Firebase emulators.

## Port Assignments

| Service | Port | Environment Variable |
|---------|------|----------------------|
| Next.js Application | 3030 | N/A |
| Firebase Emulator Hub | 4400 | N/A |
| Firebase Emulator UI | 4000 | N/A |
| Firebase Hosting | 5000 | N/A |
| Firebase Functions | 5001 | N/A |
| Firestore | 8080 | FIRESTORE_EMULATOR_HOST |
| Firebase Database | 9000 | N/A |
| Firebase Auth | 9099 | FIREBASE_AUTH_EMULATOR_HOST |
| Firebase Storage | 9199 | FIREBASE_STORAGE_EMULATOR_HOST |
| Firebase DataConnect | 9399 | N/A |

## Managing Ports

We've included several utility scripts to help manage port usage:

### Check Port Availability

To check if all required ports are available:

```bash
npm run check-ports
```

This will display a list of all required ports and whether they're available or in use.

### Kill Processes Using Required Ports

If some ports are in use, you can kill the processes using them:

```bash
npm run kill-ports
```

### Safe Start

To check port availability and then start the application with emulators:

```bash
npm run safe-start
```

## Troubleshooting

If you encounter port conflicts:

1. Run `npm run check-ports` to see which ports are in use
2. Run `npm run kill-ports` to free up the required ports
3. If specific ports are consistently causing issues, you can modify the port assignments in:
   - `firebase.json` - For Firebase emulator ports
   - `.env` and `.env.test` - For emulator host environment variables
   - `package.json` - For Next.js application port
   - `scripts/manage-emulators.js` - Update the `PORTS` object

## Custom Port Configuration

If you need to use different ports, make sure to update all of the following:

1. `firebase.json` - Update the port numbers in the `emulators` section
2. `.env` and `.env.test` - Update the emulator host environment variables
3. `scripts/manage-emulators.js` - Update the `PORTS` object
4. `package.json` - Update the port in the `dev`, `dev:turbo`, and `start` scripts 