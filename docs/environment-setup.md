# Environment Setup and Security

This document explains how to set up your environment variables and securely handle Firebase credentials for the Triviape application.

## Environment Files

The application uses several environment files:

- `.env.local` - Local development environment variables (not committed to git)
- `.env.test` - Test environment variables
- `.env` - Default environment variables
- `.env.example` - Example environment file with placeholders (committed to git)

## Firebase Service Account

For server-side Firebase operations, a service account is required. To securely handle this:

1. **Never commit service account JSON files to git**
2. Use the provided script to securely store credentials in environment variables

### Securing Service Account Credentials

We provide a script to securely store your Firebase service account credentials:

```bash
# Run the script with your service account file
node scripts/secure-credentials.js path/to/your-service-account.json

# Or let it auto-detect the service account file
node scripts/secure-credentials.js
```

This script:
- Reads your service account JSON file
- Stores the contents in the `FIREBASE_ADMIN_CREDENTIALS` environment variable in `.env.local`
- Provides instructions for using these credentials

### Using Service Account Credentials

The Firebase Admin SDK is already configured to use the `FIREBASE_ADMIN_CREDENTIALS` environment variable in `app/lib/firebaseAdmin.ts`.

## Security Best Practices

1. **Never commit sensitive files**:
   - Service account JSON files
   - `.env.local` and other environment files with real credentials

2. **Use environment variables for all sensitive information**:
   - API keys
   - Service account credentials
   - Secrets

3. **For production environments**:
   - Use a secret management service:
     - Vercel/Netlify environment variables
     - Google Secret Manager
     - AWS Secrets Manager
     - HashiCorp Vault

4. **Rotate credentials regularly**:
   - Generate new service account keys periodically
   - Update environment variables with new credentials

## Setting Up for Development

1. Copy the example environment file:
   ```bash
   cp .env.example .env.local
   ```

2. Fill in your Firebase configuration values in `.env.local`

3. Run the secure credentials script:
   ```bash
   node scripts/secure-credentials.js path/to/your-service-account.json
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

## Setting Up for Production

For production deployments:

1. Set up environment variables in your hosting platform (Vercel, Netlify, etc.)
2. Securely store service account credentials using a secret management service
3. Ensure `USE_FIREBASE_EMULATOR` is set to `false` in production 