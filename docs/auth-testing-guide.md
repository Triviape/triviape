# Firebase Authentication Testing Guide

This guide provides a structured approach to test Firebase authentication functionality in your application, with a focus on diagnosing and troubleshooting network-related issues.

## Testing Pages

We have several dedicated testing pages to help diagnose authentication issues:

### 1. Authentication Test Dashboard
**URL**: `/test/auth`

This dashboard provides a comprehensive interface for testing authentication operations:
- Sign up and sign in forms with validation
- Current user status display
- Diagnostic tools for network connectivity
- Test endpoints for authentication operations
- Create test accounts for development

### 2. Firebase Diagnostics
**URL**: `/test/firebase-diagnostics`

This page provides detailed diagnostics on Firebase connectivity:
- Network information
- API endpoint connectivity tests
- Firebase service initialization status

### 3. Firebase Connectivity
**URL**: `/test/firebase`

Tests basic Firebase connectivity including:
- Firebase core initialization 
- Firestore database connection
- Authentication service status

## Testing the Sign-Up Flow

Follow these steps to test the complete sign-up flow:

1. **Verification**: Navigate to `/test/auth` and click on the "Diagnostics" tab
2. **Run Diagnostics**: Click "Run Diagnostics" to verify:
   - Firebase Auth connectivity
   - Network connectivity
   - Endpoint reachability

3. **Test Sign-Up**: 
   - Click "Test Sign Up" to perform a test signup with a random email
   - Verify the operation completes without errors
   - Check the performance metrics

4. **Create Test Account**:
   - Click "Create Test Account" to create a permanent test user
   - Note the credentials (test@example.com / Test123!)

5. **Manual Testing**:
   - Click "Register" tab
   - Fill in the registration form with a new email
   - Submit and verify successful signup

## Testing the Sign-In Flow

1. **Verification**: Navigate to `/test/auth` and click on the "Diagnostics" tab
2. **Test Sign-In**: 
   - Click "Test Sign In" to test signing in with the test account
   - Verify the operation completes without errors
   - Check the performance metrics

3. **Manual Testing**:
   - Click "Login" tab
   - Enter test account credentials 
   - Submit and verify successful login
   - Confirm user info appears in the Current User Status section

## Troubleshooting Network-Related Issues

If you encounter the "Firebase: Error (auth/network-request-failed)" error:

1. **Network Diagnostics**:
   - Check the "Network Information" section to confirm connectivity
   - Verify the "Online Status" shows "Online"
   - Check "Connection Type" for potential issues

2. **Endpoint Testing**:
   - Review the endpoint test results for Firebase authentication services
   - Verify all endpoints show as "reachable"
   - Check latency values for potential timeout issues

3. **Firebase Configuration**:
   - Confirm Firebase is initialized correctly
   - Verify all Firebase services are properly connected

4. **Common Solutions**:
   - Check firewall or network restrictions
   - Verify API keys are correct
   - Check for CORS issues if applicable
   - Review Firebase console for service outages
   - Test on different networks if possible

## Understanding Error Handling

Our authentication system includes comprehensive error handling with:

1. **Validation**: Client-side form validation with Zod
2. **Error Messages**: User-friendly error messages for all authentication errors
3. **Retry Mechanism**: Automatic retry for transient network errors
4. **Diagnostics**: Detailed diagnostic information for troubleshooting

## Performance Considerations

Test results include performance metrics for authentication operations:
- Latency to Firebase endpoints
- Operation duration in milliseconds
- Network quality indicators

## Test APIs

For automated testing, we provide these API endpoints:

- **POST** `/api/auth/test-signup`: Tests signup functionality
- **POST** `/api/auth/test-signin`: Tests signin functionality
- **POST** `/api/auth/create-test-account`: Creates a permanent test account

These endpoints can be used for integration testing and continuous integration workflows.

## Security Notes

- Test accounts should only be created in development environments
- The test API endpoints are not included in production builds
- Always use strong passwords even for test accounts
- Delete test accounts when they are no longer needed 