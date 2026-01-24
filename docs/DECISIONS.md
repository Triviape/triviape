# Architectural Decision Log

**Last Updated:** 2026-01-24  
**Status:** Living Document

This document captures key architectural decisions made in the TriviaPE codebase, including context, alternatives considered, and implications.

---

## Table of Contents

1. [Authentication & Authorization](#1-authentication--authorization)
2. [State Management Strategy](#2-state-management-strategy)
3. [API Response Standards](#3-api-response-standards)
4. [Database Query Patterns](#4-database-query-patterns)
5. [Error Handling Architecture](#5-error-handling-architecture)
6. [Component Organization](#6-component-organization)
7. [Service Layer Design](#7-service-layer-design)

---

## 1. Authentication & Authorization

### Decision: Hybrid NextAuth + Firebase Auth System

**Context:**
- Need for secure authentication with session management
- Existing Firebase infrastructure for backend services
- Requirement for JWT-based API authentication

**Chosen Approach:**
```typescript
// NextAuth.js with JWT sessions (30-day max age)
// Firebase Admin SDK for credential verification
// Custom Credentials Provider that:
//   1. Validates credentials with Firebase Auth
//   2. Immediately signs out from Firebase
//   3. Creates NextAuth JWT session with user data
```

**Rationale:**
- NextAuth provides robust session management and middleware
- Firebase Auth handles credential verification and user management
- JWT sessions enable stateless API authentication
- Hybrid approach leverages strengths of both systems

**Alternatives Considered:**
- Pure Firebase Auth: Lacked NextAuth's middleware and session features
- Pure NextAuth: Would require rebuilding user management infrastructure
- Clerk/Auth0: Additional cost and vendor lock-in

**Current Status:** ⚠️ **Fragmentation Issues Identified**
- Inconsistent auth patterns across endpoints (NextAuth, Bearer tokens, Firebase)
- Some routes bypass authentication middleware
- Session synchronization challenges between systems

**Next Steps:**
- Standardize authentication across all API routes
- Consolidate auth checking logic into middleware
- Document migration path for legacy Firebase-only auth

---

## 2. State Management Strategy

### Decision: Multi-Layered State Management

**Context:**
- Complex application with global UI state, feature state, and server state
- Need to avoid prop drilling while maintaining component isolation
- Performance concerns with unnecessary re-renders

**Chosen Approach:**
```typescript
// Layer 1: Global State (React Context)
//   - UI preferences (ResponsiveUIProvider)
//   - Theme, layout settings
//   - User session context

// Layer 2: Feature State (Custom Hooks)
//   - useQuiz(), useLeaderboard()
//   - Encapsulate feature-specific logic

// Layer 3: Server State (React Query)
//   - API data fetching and caching
//   - Optimistic updates
//   - Background refetching

// Layer 4: Component State (useState)
//   - Local UI state (modals, inputs, toggles)
//   - Transient component behavior
```

**Rationale:**
- **Context** for truly global state prevents prop drilling
- **Custom hooks** encapsulate feature logic and promote reusability
- **React Query** handles server state with built-in caching and refetching
- **useState** keeps simple state close to usage

**Guidelines:**
1. Keep state as close as possible to where it's used
2. Lift state only when multiple components need shared access
3. Use URL state for shareable/bookmarkable application state
4. Prefer composition over global state when possible

**Performance Optimizations:**
- `useMemo` for expensive computations
- `useCallback` for stable function references
- Custom `memoWithPerf()` utility for monitored memoization
- Avoid context updates that trigger unnecessary re-renders

---

## 3. API Response Standards

### Decision: Standardized Response Wrapper (In Progress)

**Context:**
- Inconsistent response formats across API endpoints
- Clients need predictable error handling
- Need for consistent metadata (timestamps, request IDs, etc.)

**Target Standard:**
```typescript
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    type: ErrorType;
    message: string;
    code?: string;
    details?: unknown;
  };
  meta: {
    timestamp: string;
    requestId: string;
    version?: string;
  };
}
```

**Implementation:**
```typescript
// Wrapper function for consistent error handling
export const withApiErrorHandling = <T>(
  handler: (req: NextRequest) => Promise<ApiResponse<T>>
) => async (req: NextRequest) => {
  try {
    return await handler(req);
  } catch (error) {
    return standardErrorResponse(error);
  }
};
```

**Current Status:** ⚠️ **Inconsistencies Remain**
- Pattern A (Standard): `/api/auth/*` - Full standard response
- Pattern B (Partial): `/api/user/stats` - Missing meta, inconsistent nesting
- Pattern C (Raw): `/api/daily-quiz` - Direct data returns

**Migration Path:**
1. Create response builder utilities (`buildSuccessResponse`, `buildErrorResponse`)
2. Update all API routes to use wrapper function
3. Add TypeScript interfaces for all response types
4. Document in API runbook (see RUNBOOKS.md)

---

## 4. Database Query Patterns

### Decision: Firestore Service Layer with Query Builders

**Context:**
- Firestore as primary database
- Need for type-safe, reusable query patterns
- Performance concerns with N+1 queries and unnecessary reads

**Chosen Approach:**
```typescript
// Service layer abstraction
class QuizService {
  // Modular query construction
  async getQuestionsByCategory(category: string, limit: number) {
    const q = query(
      collection(db, 'questions'),
      where('category', '==', category),
      where('active', '==', true),
      orderBy('createdAt', 'desc'),
      limit(limit)
    );
    return this.executeQuery(q);
  }
  
  // Timestamp conversion helper
  private convertTimestamps<T>(doc: DocumentSnapshot): T {
    const data = doc.data();
    return {
      ...data,
      createdAt: data.createdAt?.toDate?.()?.toISOString(),
      updatedAt: data.updatedAt?.toDate?.()?.toISOString(),
    } as T;
  }
}
```

**Query Conventions:**
1. **Service Layer**: All database queries go through service classes
2. **Type Safety**: Generic types ensure compile-time safety
3. **Error Handling**: Service-specific error types (`QuizServiceError`, `UserServiceError`)
4. **Pagination**: Use `startAfter()` + `limit()` for cursor-based pagination
5. **Batching**: Batch writes for multi-document operations

**Performance Patterns:**
- Query indexes defined in `firestore.indexes.json`
- Caching strategies for frequently accessed data
- Composite queries to reduce round trips
- Background data prefetching for known user flows

**Service Organization:**
```
/lib/services/
  ├── auth/          # Authentication services
  ├── user/          # User profile and settings
  ├── quiz/          # Quiz and question management
  ├── leaderboard/   # Scoring and rankings
  └── admin/         # Administrative operations
```

---

## 5. Error Handling Architecture

### Decision: Multi-Layer Error Handling with Recovery

**Context:**
- Need for consistent error handling across API, services, and UI
- Requirement for user-friendly messages vs. technical logging
- Support for error recovery and retry mechanisms

**Architecture:**

#### Layer 1: API Route Error Handler
```typescript
export const withApiErrorHandling = <T>(
  handler: (req: NextRequest) => Promise<ApiResponse<T>>
) => async (req: NextRequest) => {
  try {
    return await handler(req);
  } catch (error) {
    logError(error); // Server-side logging
    return createErrorResponse(error); // User-facing response
  }
};
```

#### Layer 2: Service Layer Error Handler
```typescript
export const withErrorHandling = <T>(
  operation: () => Promise<T>,
  context: string
) => async (): Promise<T> => {
  try {
    return await operation();
  } catch (error) {
    throw createServiceError(error, context);
  }
};
```

#### Layer 3: Component Error Boundary
```typescript
<EnhancedErrorHandler
  fallback={(error) => <ErrorDisplay error={error} />}
  onError={(error) => logToMonitoring(error)}
>
  <FeatureComponent />
</EnhancedErrorHandler>
```

**Error Type System:**
```typescript
type ErrorType = 
  | 'authentication'    // 401 errors
  | 'authorization'     // 403 errors
  | 'validation'        // 400 errors
  | 'not_found'         // 404 errors
  | 'rate_limit'        // 429 errors
  | 'network'           // Connection issues
  | 'server'            // 500 errors
  | 'csrf';             // CSRF token issues
```

**Recovery Strategies:**
- **Retry with Backoff**: Network errors, rate limits
- **User Intervention**: Validation errors, authentication failures
- **Graceful Degradation**: Feature unavailable, show cached data
- **Automatic Recovery**: Refresh auth tokens, reconnect websockets

**Logging Strategy:**
- **Client**: Minimal, user-friendly messages
- **Server**: Full stack traces, context, request details
- **Monitoring**: Error aggregation by type, frequency, user impact

---

## 6. Component Organization

### Decision: Feature-Based Component Hierarchy

**Context:**
- Large application with many components
- Need for clear ownership and discoverability
- Balance between reusability and feature coupling

**Structure:**
```
/app/components/
  ├── ui/              # Pure UI components (Button, Card, Input)
  │   ├── shadcn/      # shadcn/ui imports
  │   └── custom/      # Custom UI components
  ├── layouts/         # Layout wrappers (AppLayout, DashboardLayout)
  ├── errors/          # Error handling components
  ├── animations/      # Reusable animation components
  ├── quiz/            # Quiz feature components
  ├── daily/           # Daily quiz feature
  ├── auth/            # Authentication UI
  ├── performance/     # Performance monitoring UI
  └── [feature]/       # Other feature-specific components
```

**Component Patterns:**

#### 1. UI Components (Presentational)
```typescript
// Pure, reusable, no business logic
export const Button = ({ variant, size, ...props }: ButtonProps) => {
  return <button className={buttonVariants({ variant, size })} {...props} />;
};
```

#### 2. Feature Components (Container)
```typescript
// Connects to services, manages feature state
export const QuizContainer = () => {
  const { quiz, loading, error } = useQuiz();
  return <QuizView quiz={quiz} loading={loading} error={error} />;
};
```

#### 3. Layout Components
```typescript
// Provides consistent layout structure
export const AppLayout = ({ children }: LayoutProps) => {
  return (
    <div className="min-h-screen">
      <Header />
      <main>{children}</main>
      <Footer />
    </div>
  );
};
```

**Optimization Patterns:**
- **Memoization**: `memoWithPerf()` for expensive components
- **Code Splitting**: Dynamic imports for heavy features
- **Lazy Loading**: Below-the-fold and modal content
- **Performance Monitoring**: `useBenchmark()` hooks on critical paths

**Naming Conventions:**
- PascalCase for component files: `QuizCard.tsx`
- Feature prefix for feature components: `QuizAnswerOptions.tsx`
- `use*` prefix for custom hooks: `useQuiz.ts`
- `*Service` suffix for services: `quizService.ts`

---

## 7. Service Layer Design

### Decision: Singleton Service Pattern with Static Utilities

**Context:**
- Need for centralized business logic outside React components
- Consistent database and API access patterns
- Support for both instance and utility methods

**Pattern:**

#### Singleton Service
```typescript
export class LeaderboardService {
  private static instance: LeaderboardService;
  
  private constructor(private db: Firestore) {}
  
  static getInstance(): LeaderboardService {
    if (!this.instance) {
      this.instance = new LeaderboardService(getFirestore());
    }
    return this.instance;
  }
  
  async getUserRank(userId: string): Promise<number> {
    // Instance method with access to db
  }
}
```

#### Static Utility Methods
```typescript
export class ProfileService {
  // No constructor, pure static methods
  static async getUserProfile(userId: string): Promise<UserProfile> {
    const db = getFirestore();
    const doc = await getDoc(doc(db, 'users', userId));
    return doc.data() as UserProfile;
  }
}
```

**Service Organization Principles:**
1. **Single Responsibility**: One service per domain (Quiz, User, Leaderboard)
2. **Dependency Injection**: Services receive dependencies in constructor
3. **Error Handling**: Service-specific error types for better error messages
4. **Testing**: Services are easily mockable for unit tests
5. **Migration Path**: Mark old services as `.deprecated.ts`

**Firebase Integration:**
```typescript
// Centralized Firebase Admin Service
export class FirebaseAdminService {
  private static instance: FirebaseAdminService;
  
  static getInstance(): FirebaseAdminService {
    if (!this.instance) {
      this.instance = new FirebaseAdminService(getApp());
    }
    return this.instance;
  }
  
  getAuth() { return getAuth(this.app); }
  getFirestore() { return getFirestore(this.app); }
  getStorage() { return getStorage(this.app); }
}
```

**Service Layer Benefits:**
- ✅ Separates business logic from UI concerns
- ✅ Centralizes Firebase and API interactions
- ✅ Enables comprehensive unit testing
- ✅ Consistent error handling across operations
- ✅ Easy to refactor and optimize

**Current Challenges:**
- Some direct Firebase calls still in API routes (should use services)
- Inconsistent service patterns (singleton vs. static vs. functional)
- Service layer not fully covering all database operations

**Improvement Roadmap:**
1. Complete migration of all database calls to services
2. Standardize on singleton pattern for stateful services
3. Add comprehensive service layer tests
4. Document service contracts and interfaces

---

## Decision Review Schedule

This document should be reviewed quarterly or when:
- New major features are planned
- Significant refactoring is proposed
- Performance or scaling issues emerge
- Team feedback indicates confusion or inconsistency

**Next Review:** 2026-04-24

---

## Contributing to This Document

When making architectural decisions:
1. Document the context and alternatives considered
2. Explain the rationale for the chosen approach
3. Note any trade-offs or limitations
4. Link to related implementation examples
5. Update status if the decision needs revision

**Template:**
```markdown
### Decision: [Short Title]

**Context:** [Why was this decision needed?]

**Chosen Approach:** [What was decided?]

**Rationale:** [Why this approach?]

**Alternatives Considered:** [What else was evaluated?]

**Current Status:** [Fully Implemented / In Progress / Needs Revision]

**Next Steps:** [What remains to be done?]
```
