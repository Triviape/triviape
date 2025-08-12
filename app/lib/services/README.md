# User Services Architecture

This directory contains the refactored user services, separated by responsibility for better maintainability and testability.

## Service Structure

### AuthService (`authService.ts`)
Handles all authentication operations:
- User registration with email/password
- Sign in with email/password
- Social authentication (Google, Twitter, Facebook)
- Password reset
- Sign out
- Rate limiting for authentication attempts

### ProfileService (`profileService.ts`)
Manages user profiles and data:
- Create user profiles with batch operations
- Update user profiles
- Get user profiles
- Update last login timestamps
- Profile validation and mapping

### PreferencesService (`preferencesService.ts`)
Handles user preferences and privacy settings:
- Update user preferences (theme, sound, notifications, etc.)
- Update privacy settings (visibility, leaderboards, etc.)
- Get user preferences
- Get privacy settings

### ProgressionService (`progressionService.ts`)
Manages XP, levels, and coins:
- Add XP to users with optimized calculations
- Add coins to users
- Get user progression data
- Level calculation utilities
- Progression calculation utilities

### UserService (`userService.ts`)
Orchestrates operations and maintains backward compatibility:
- Delegates to focused services
- Maintains existing API for backward compatibility
- Provides convenience methods
- Acts as a facade for the other services

## Usage

### Importing Services

```typescript
// Import specific services
import { AuthService } from '@/app/lib/services/authService';
import { ProfileService } from '@/app/lib/services/profileService';
import { PreferencesService } from '@/app/lib/services/preferencesService';
import { ProgressionService } from '@/app/lib/services/progressionService';

// Or import from index
import { AuthService, ProfileService, PreferencesService, ProgressionService } from '@/app/lib/services';

// For backward compatibility
import { UserService } from '@/app/lib/services/userService';
```

### Examples

```typescript
// Authentication
const userCredential = await AuthService.registerWithEmail(email, password, displayName);
await AuthService.signInWithEmail(email, password);

// Profile management
await ProfileService.createUserProfileWithBatch(userId, userData);
const profile = await ProfileService.getUserProfile(userId);

// Preferences
await PreferencesService.updateUserPreferences(userId, { theme: 'dark' });
await PreferencesService.updatePrivacySettings(userId, { showOnLeaderboards: false });

// Progression
const result = await ProgressionService.addUserXP(userId, 50);
const coins = await ProgressionService.addUserCoins(userId, 10);

// Backward compatibility
await UserService.registerWithEmail(email, password, displayName);
const profile = await UserService.getUserProfile(userId);
```

## Benefits of This Architecture

1. **Single Responsibility**: Each service has a clear, focused purpose
2. **Maintainability**: Easier to understand and modify individual services
3. **Testability**: Services can be tested in isolation
4. **Scalability**: Services can be extended independently
5. **Backward Compatibility**: Existing code continues to work
6. **Reusability**: Services can be used independently or together

## Configuration

All services use environment variables for configuration:
- `XP_PER_LEVEL`: XP required per level (default: 100)
- `DEFAULT_COINS`: Starting coins for new users (default: 0)
- `MAX_XP_AMOUNT`: Maximum XP amount (default: 10000)
- `MAX_COIN_AMOUNT`: Maximum coin amount (default: 10000)
- `RATE_LIMIT_WINDOW`: Rate limiting window in ms (default: 60000)
- `MAX_AUTH_ATTEMPTS`: Maximum auth attempts (default: 5)
- `USERS_COLLECTION`: Firestore collection name (default: 'users') 