# Firebase Authentication Troubleshooting Guide

This guide provides comprehensive troubleshooting steps for Firebase Authentication issues, with a focus on network-related problems like the `auth/network-request-failed` error.

## Common Firebase Authentication Errors

### Network-Related Errors

- **auth/network-request-failed**: The network connection failed or timed out.
- **auth/timeout**: The operation timed out.
- **auth/web-storage-unsupported**: The browser does not support web storage.
- **auth/cors-unsupported**: The browser does not support CORS.

### Authentication Errors

- **auth/user-not-found**: No user record corresponds to the provided identifier.
- **auth/wrong-password**: The password is invalid.
- **auth/invalid-email**: The email address is not valid.
- **auth/email-already-in-use**: The email address is already in use by another account.
- **auth/weak-password**: The password is too weak.
- **auth/user-disabled**: The user account has been disabled.
- **auth/too-many-requests**: Too many unsuccessful login attempts.
- **auth/operation-not-allowed**: The requested authentication provider is disabled for your Firebase project.

## Diagnosing Network-Related Issues

### 1. Check Your Internet Connection

- Ensure your device has a stable internet connection
- Try accessing other websites to verify general connectivity
- If using Wi-Fi, try switching to a mobile data connection or vice versa
- Check if your connection is stable by running a speed test

### 2. Check Firebase Service Status

- Visit the [Firebase Status Dashboard](https://status.firebase.google.com/) to check if there are any ongoing service disruptions
- Check the [Google Cloud Status Dashboard](https://status.cloud.google.com/) for broader Google Cloud issues

### 3. Check for Network Restrictions

- Corporate, school, or public networks may block Firebase services
- VPNs may interfere with Firebase authentication
- Firewalls or security software might be blocking connections
- Some countries or regions may restrict access to Google services

### 4. Browser-Related Issues

- Clear your browser cache and cookies
- Try using a different browser
- Disable browser extensions, especially ad blockers or privacy tools
- Ensure your browser is up to date
- Check if you have third-party cookies blocked

### 5. Device-Related Issues

- Restart your device
- Check if the issue occurs on multiple devices
- Ensure your device's date and time are set correctly
- Check if the issue is specific to mobile or desktop

## Troubleshooting Steps for `auth/network-request-failed`

### Step 1: Verify Basic Connectivity

1. Open our diagnostic page at `/test/firebase-network-test`
2. Check the "Network Information" section to see your current connection details
3. Run the "Test General Connectivity" test to verify basic internet connectivity
4. If general connectivity tests fail, focus on fixing your internet connection

### Step 2: Test Firebase Endpoints

1. On the diagnostic page, run the "Test Firebase Endpoints" test
2. This will check connectivity to the specific Firebase Authentication endpoints
3. If these tests fail but general connectivity works, the issue may be:
   - Network restrictions blocking Firebase specifically
   - DNS issues preventing resolution of Firebase domains
   - Temporary Firebase service disruptions

### Step 3: Test Firebase Auth Initialization

1. Run the "Test Firebase Auth" test on the diagnostic page
2. This checks if Firebase Auth can be initialized in your browser
3. If initialization fails, check:
   - Browser compatibility
   - JavaScript errors in the console
   - Browser privacy settings

### Step 4: Check for Common Issues

- **Incorrect API Key**: Verify that your Firebase API key is correct in the environment variables
- **API Key Restrictions**: Check if your API key has restrictions that prevent it from being used from your domain
- **Auth Domain Mismatch**: Ensure your authDomain in the Firebase config matches your Firebase project
- **CORS Issues**: Firebase requires CORS to work properly; some browser extensions or network configurations may block this
- **IndexedDB Issues**: Firebase Auth uses IndexedDB for persistence; some browsers or privacy settings may restrict this

### Step 5: Advanced Troubleshooting

- **Network Monitoring**: Use browser developer tools (Network tab) to monitor requests to Firebase endpoints
- **Error Logging**: Check the browser console for detailed error messages
- **Proxy Configuration**: If using a proxy, ensure it allows connections to Firebase domains
- **DNS Configuration**: Try using alternative DNS servers like Google (8.8.8.8) or Cloudflare (1.1.1.1)
- **Mobile-Specific Issues**: On mobile devices, check if battery optimization is affecting background network operations

## Implementation Recommendations

### Error Handling Best Practices

1. **Implement Retry Logic**: Use exponential backoff for retrying failed network operations
   ```typescript
   // Example using our retryAuthOperation utility
   import { retryAuthOperation } from '@/app/lib/authErrorHandler';
   
   const result = await retryAuthOperation(async () => {
     return await signInWithEmailAndPassword(auth, email, password);
   });
   ```

2. **Provide Clear Error Messages**: Map Firebase error codes to user-friendly messages
   ```typescript
   import { getAuthErrorMessage } from '@/app/lib/authErrorHandler';
   
   try {
     // Authentication code
   } catch (error) {
     const errorMessage = getAuthErrorMessage(error);
     // Display errorMessage to the user
   }
   ```

3. **Implement Offline Detection**: Check for network connectivity before attempting authentication
   ```typescript
   if (!navigator.onLine) {
     // Show offline message and prevent authentication attempt
   }
   ```

4. **Log Detailed Error Information**: Capture comprehensive error details for debugging
   ```typescript
   import { logAuthError } from '@/app/lib/authErrorHandler';
   
   try {
     // Authentication code
   } catch (error) {
     logAuthError(error, { 
       email, // Don't include password!
       operation: 'signIn'
     });
   }
   ```

### Firebase Configuration Optimization

1. **Enable Persistence**: Configure Firebase to work offline when possible
   ```typescript
   import { initializeAuth, indexedDBLocalPersistence } from 'firebase/auth';
   
   const auth = initializeAuth(app, {
     persistence: indexedDBLocalPersistence
   });
   ```

2. **Handle Multiple Tabs**: Be aware of persistence limitations with multiple tabs
   ```typescript
   try {
     await enableMultiTabIndexedDbPersistence(db);
   } catch (err) {
     if (err.code === 'failed-precondition') {
       // Multiple tabs open, persistence can only be enabled in one tab
     } else if (err.code === 'unimplemented') {
       // The current browser does not support persistence
     }
   }
   ```

3. **Optimize for Mobile**: Consider network conditions on mobile devices
   ```typescript
   // Check for slow connections
   if (navigator.connection && navigator.connection.effectiveType === 'slow-2g') {
     // Adjust timeout settings or show warning to user
   }
   ```

## Testing Your Implementation

1. **Network Condition Testing**: Test your app under various network conditions:
   - Slow connections
   - Intermittent connectivity
   - Offline mode
   - High latency

2. **Cross-Browser Testing**: Test on multiple browsers and devices:
   - Chrome, Firefox, Safari, Edge
   - iOS and Android devices
   - Different versions of each browser

3. **Error Simulation**: Deliberately trigger errors to test your error handling:
   - Disconnect from the internet during authentication
   - Use invalid credentials
   - Block Firebase domains in your hosts file temporarily

## When to Contact Support

If you've tried all the troubleshooting steps and still experience issues:

1. Collect detailed information:
   - Error messages and codes
   - Browser and device information
   - Network environment details
   - Steps to reproduce the issue
   - Results from the diagnostic tests

2. Contact Firebase support through the [Firebase Console](https://console.firebase.google.com/)

3. For community help, post on:
   - [Stack Overflow](https://stackoverflow.com/questions/tagged/firebase)
   - [Firebase Google Group](https://groups.google.com/g/firebase-talk)

## Additional Resources

- [Firebase Authentication Documentation](https://firebase.google.com/docs/auth)
- [Firebase Authentication API Reference](https://firebase.google.com/docs/reference/js/auth)
- [Firebase Error Codes Reference](https://firebase.google.com/docs/auth/admin/errors)
- [Firebase Performance Monitoring](https://firebase.google.com/docs/perf-mon)
- [Network Information API](https://developer.mozilla.org/en-US/docs/Web/API/Network_Information_API) 