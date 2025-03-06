# Firebase Emulator Setup Guide

This guide explains how to set up and use Firebase Emulators for local development of the Triviape application.

## Prerequisites

- Node.js (v16+)
- npm or yarn
- Firebase Tools (`npm install -g firebase-tools`)

## Quick Start

For the fastest setup, run:

```bash
npm run setup:all
```

This will:
1. Set up your environment variables
2. Start Firebase emulators with persistence
3. Import sample quiz data
4. Create sample user accounts
5. Verify Firestore collections

After setup completes, start the application with:

```bash
npm run dev:with-persistent-emulators
```

## Available Scripts

| Command                           | Description                                                |
|-----------------------------------|------------------------------------------------------------|
| `npm run emulators`               | Start Firebase emulators (auth, firestore, storage)        |
| `npm run emulators:all`           | Start all Firebase emulators                               |
| `npm run emulators:persistent`    | Start emulators with data persistence                      |
| `npm run emulators:export`        | Export current emulator data to ./firebase-data            |
| `npm run emulators:import`        | Start emulators and import data from ./firebase-data       |
| `npm run dev:with-emulators`      | Start both emulators and dev server                        |
| `npm run dev:with-persistent-emulators` | Start emulators with persistence and dev server      |
| `npm run firebase:create-sample-users`  | Create sample users in the Auth emulator             |
| `npm run firebase:check-emulators`      | Check if emulators are running                       |
| `npm run kill-ports`              | Kill processes using required ports                        |
| `npm run check-ports`             | Check if required ports are available                      |
| `npm run safe-start`              | Check ports and start emulators and dev server             |
| `npm run safe-start:persistent`   | Check ports and start persistent emulators and dev server  |

## Emulator Details

The following emulators are configured:

| Emulator       | Port  | UI Access                          |
|----------------|-------|----------------------------------- |
| Auth           | 9099  | http://localhost:4000/auth         |
| Firestore      | 8080  | http://localhost:4000/firestore    |
| Storage        | 9199  | http://localhost:4000/storage      |
| Emulator UI    | 4000  | http://localhost:4000              |

## Sample Users

The following sample users are created automatically:

| Email                | Password    | Description       |
|----------------------|-------------|-------------------|
| alex@example.com     | password123 | Alex Johnson      |
| samantha@example.com | password123 | Samantha Lee      |
| miguel@example.com   | password123 | Miguel Rodriguez  |

You can manually create these users by running:

```bash
npm run firebase:create-sample-users
```

## Data Persistence

By default, emulator data is cleared when the emulators are stopped. To enable persistence:

1. Use scripts with `:persistent` suffix (e.g., `npm run emulators:persistent`)
2. Export data manually with `npm run emulators:export`
3. Import data on next startup with `npm run emulators:import`

Data is stored in the `.emulator-data` directory.

## Troubleshooting

### "User not found" errors

If you see "User not found" errors when trying to log in:

```bash
npm run firebase:create-sample-users
```

### Port conflicts

If emulators fail to start due to port conflicts:

```bash
npm run kill-ports
```

### Connection issues

Make sure environment variables are properly set:

- `NEXT_PUBLIC_USE_FIREBASE_EMULATOR=true` in `.env.local`

### Checking emulator status

Visit the Emulator UI at http://localhost:4000 or run:

```bash
npm run firebase:check-emulators
```

## Testing with Emulators

Run tests with emulators automatically:

```bash
npm run test:with-emulators
```

## Additional Resources

- [Firebase Emulator Documentation](https://firebase.google.com/docs/emulator-suite)
- [Firebase Auth Emulator Documentation](https://firebase.google.com/docs/emulator-suite/connect_auth)
- [Firestore Emulator Documentation](https://firebase.google.com/docs/emulator-suite/connect_firestore) 