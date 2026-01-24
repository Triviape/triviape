# Operational Runbooks

**Last Updated:** 2026-01-24  
**Purpose:** Step-by-step guides for common development and operational tasks

---

## Table of Contents

1. [Adding a New API Endpoint](#1-adding-a-new-api-endpoint)
2. [Adding a New Database Query](#2-adding-a-new-database-query)
3. [Authenticating a New Route](#3-authenticating-a-new-route)
4. [Creating a New UI Component](#4-creating-a-new-ui-component)
5. [Deploying to Production](#5-deploying-to-production)
6. [Troubleshooting Common Issues](#6-troubleshooting-common-issues)
7. [Performance Monitoring](#7-performance-monitoring)

---

## 1. Adding a New API Endpoint

### Prerequisites
- NextJS 14+ project structure knowledge
- Understanding of API route handlers
- Familiarity with authentication patterns (see `docs/DECISIONS.md#1`)

### Steps

#### 1.1 Create the Route File
```bash
# API routes follow the pattern: /app/api/[resource]/[action]/route.ts
cd app/api
mkdir -p my-resource
cd my-resource
touch route.ts
```

#### 1.2 Implement the Handler
```typescript
// app/api/my-resource/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { withApiErrorHandling } from '@/app/lib/errors/apiErrorHandler';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth';

// Define response type
interface MyResourceResponse {
  id: string;
  name: string;
  createdAt: string;
}

// Main handler
export const GET = withApiErrorHandling<MyResourceResponse>(
  async (req: NextRequest) => {
    // 1. Authenticate request
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        {
          success: false,
          error: {
            type: 'authentication',
            message: 'Authentication required',
          },
        },
        { status: 401 }
      );
    }

    // 2. Parse query parameters
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    // 3. Validate input
    if (!id) {
      return NextResponse.json(
        {
          success: false,
          error: {
            type: 'validation',
            message: 'Resource ID is required',
          },
        },
        { status: 400 }
      );
    }

    // 4. Call service layer
    const resource = await MyResourceService.getById(id);

    // 5. Return standardized response
    return NextResponse.json({
      success: true,
      data: resource,
      meta: {
        timestamp: new Date().toISOString(),
        requestId: crypto.randomUUID(),
      },
    });
  }
);
```

#### 1.3 Create Service Layer (if needed)
```typescript
// app/lib/services/my-resource/myResourceService.ts
import { getFirestore, doc, getDoc } from 'firebase/firestore';

export class MyResourceService {
  static async getById(id: string): Promise<MyResourceResponse> {
    const db = getFirestore();
    const docRef = doc(db, 'my-resources', id);
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) {
      throw new Error('Resource not found');
    }
    
    return {
      id: docSnap.id,
      ...docSnap.data(),
    } as MyResourceResponse;
  }
}
```

#### 1.4 Add Tests
```typescript
// app/api/my-resource/__tests__/route.test.ts
import { GET } from '../route';
import { NextRequest } from 'next/server';

describe('/api/my-resource', () => {
  it('returns 401 when not authenticated', async () => {
    const request = new NextRequest('http://localhost:3000/api/my-resource');
    const response = await GET(request);
    const data = await response.json();
    
    expect(response.status).toBe(401);
    expect(data.success).toBe(false);
    expect(data.error.type).toBe('authentication');
  });

  it('returns resource data when authenticated', async () => {
    // Mock session
    // Mock service call
    // Assert response
  });
});
```

#### 1.5 Update API Documentation
```markdown
## GET /api/my-resource

**Description:** Retrieves a resource by ID

**Authentication:** Required (NextAuth session)

**Query Parameters:**
- `id` (string, required): Resource ID

**Response:**
\`\`\`json
{
  "success": true,
  "data": {
    "id": "abc123",
    "name": "Resource Name",
    "createdAt": "2026-01-24T10:00:00Z"
  },
  "meta": {
    "timestamp": "2026-01-24T10:00:00Z",
    "requestId": "req-xyz"
  }
}
\`\`\`

**Error Responses:**
- 401: Not authenticated
- 400: Invalid input
- 404: Resource not found
- 500: Server error
```

### Checklist
- [ ] Route file created in correct location
- [ ] Error handling wrapper applied
- [ ] Authentication implemented
- [ ] Input validation added
- [ ] Service layer method created/used
- [ ] Standardized response format
- [ ] TypeScript types defined
- [ ] Unit tests written
- [ ] API documentation updated

---

## 2. Adding a New Database Query

### Prerequisites
- Firestore database structure knowledge
- Understanding of service layer pattern
- Familiarity with Firestore query API

### Steps

#### 2.1 Define the Query in Service Layer
```typescript
// app/lib/services/quiz/quizService.ts
import { 
  getFirestore, 
  collection, 
  query, 
  where, 
  orderBy, 
  limit,
  getDocs,
  QueryConstraint 
} from 'firebase/firestore';

export class QuizService {
  static async getQuizzesByDifficulty(
    difficulty: 'easy' | 'medium' | 'hard',
    limitCount: number = 10
  ): Promise<Quiz[]> {
    const db = getFirestore();
    
    // Build query with constraints
    const constraints: QueryConstraint[] = [
      where('difficulty', '==', difficulty),
      where('active', '==', true),
      orderBy('createdAt', 'desc'),
      limit(limitCount),
    ];
    
    const q = query(collection(db, 'quizzes'), ...constraints);
    
    // Execute query
    const snapshot = await getDocs(q);
    
    // Transform results
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate?.()?.toISOString(),
    })) as Quiz[];
  }
}
```

#### 2.2 Add Pagination Support
```typescript
export class QuizService {
  static async getQuizzesPaginated(
    difficulty: string,
    pageSize: number,
    lastDocId?: string
  ): Promise<{ quizzes: Quiz[]; nextCursor: string | null }> {
    const db = getFirestore();
    
    const constraints: QueryConstraint[] = [
      where('difficulty', '==', difficulty),
      where('active', '==', true),
      orderBy('createdAt', 'desc'),
      limit(pageSize),
    ];
    
    // Add cursor if provided
    if (lastDocId) {
      const lastDoc = await getDoc(doc(db, 'quizzes', lastDocId));
      constraints.push(startAfter(lastDoc));
    }
    
    const q = query(collection(db, 'quizzes'), ...constraints);
    const snapshot = await getDocs(q);
    
    const quizzes = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as Quiz[];
    
    const nextCursor = snapshot.docs.length === pageSize
      ? snapshot.docs[snapshot.docs.length - 1].id
      : null;
    
    return { quizzes, nextCursor };
  }
}
```

#### 2.3 Add Required Firestore Index
```json
// firestore.indexes.json
{
  "indexes": [
    {
      "collectionGroup": "quizzes",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "difficulty", "order": "ASCENDING" },
        { "fieldPath": "active", "order": "ASCENDING" },
        { "fieldPath": "createdAt", "order": "DESCENDING" }
      ]
    }
  ]
}
```

#### 2.4 Deploy Index to Firebase
```bash
# Deploy the index configuration
firebase deploy --only firestore:indexes

# Check index status
firebase firestore:indexes
```

#### 2.5 Add Error Handling
```typescript
export class QuizService {
  static async getQuizzesByDifficulty(
    difficulty: string,
    limitCount: number = 10
  ): Promise<Quiz[]> {
    try {
      // Query logic here...
    } catch (error) {
      console.error('Error fetching quizzes:', error);
      throw new QuizServiceError(
        'Failed to fetch quizzes',
        'database_error',
        { difficulty, limitCount, originalError: error }
      );
    }
  }
}
```

#### 2.6 Add Tests
```typescript
// app/lib/services/quiz/__tests__/quizService.test.ts
import { QuizService } from '../quizService';

jest.mock('firebase/firestore');

describe('QuizService', () => {
  describe('getQuizzesByDifficulty', () => {
    it('returns quizzes filtered by difficulty', async () => {
      // Mock Firestore query
      const mockQuizzes = [{ id: '1', difficulty: 'easy' }];
      (getDocs as jest.Mock).mockResolvedValue({
        docs: mockQuizzes.map(q => ({ id: q.id, data: () => q })),
      });
      
      const result = await QuizService.getQuizzesByDifficulty('easy');
      
      expect(result).toHaveLength(1);
      expect(result[0].difficulty).toBe('easy');
    });
  });
});
```

### Checklist
- [ ] Query method added to service class
- [ ] TypeScript types for query parameters and results
- [ ] Firestore indexes defined (if composite query)
- [ ] Indexes deployed to Firebase
- [ ] Pagination support added (if needed)
- [ ] Error handling implemented
- [ ] Unit tests written
- [ ] Performance considerations documented

---

## 3. Authenticating a New Route

### Prerequisites
- Understanding of NextAuth.js
- Familiarity with middleware patterns
- Knowledge of session management

### Approach 1: Server-Side Authentication (API Routes)

```typescript
// app/api/protected-resource/route.ts
import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  // 1. Get session
  const session = await getServerSession(authOptions);
  
  // 2. Check authentication
  if (!session?.user?.id) {
    return NextResponse.json(
      {
        success: false,
        error: {
          type: 'authentication',
          message: 'Please sign in to access this resource',
        },
      },
      { status: 401 }
    );
  }
  
  // 3. Optional: Check authorization
  const userRole = session.user.role;
  if (userRole !== 'admin') {
    return NextResponse.json(
      {
        success: false,
        error: {
          type: 'authorization',
          message: 'Insufficient permissions',
        },
      },
      { status: 403 }
    );
  }
  
  // 4. Proceed with request
  return NextResponse.json({
    success: true,
    data: { /* ... */ },
  });
}
```

### Approach 2: Middleware-Based Authentication (Page Routes)

```typescript
// middleware.ts
import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

export default withAuth(
  function middleware(req) {
    // Request is already authenticated
    // Add custom authorization logic here if needed
    const token = req.nextauth.token;
    
    // Example: Admin-only routes
    if (req.nextUrl.pathname.startsWith('/admin') && token?.role !== 'admin') {
      return NextResponse.redirect(new URL('/unauthorized', req.url));
    }
    
    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  }
);

// Define protected routes
export const config = {
  matcher: [
    '/dashboard/:path*',
    '/admin/:path*',
    '/profile/:path*',
  ],
};
```

### Approach 3: Client-Side Protection (Components)

```typescript
// app/dashboard/page.tsx
'use client';

import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import { useEffect } from 'react';

export default function DashboardPage() {
  const { data: session, status } = useSession();
  
  useEffect(() => {
    if (status === 'unauthenticated') {
      redirect('/auth/signin?callbackUrl=/dashboard');
    }
  }, [status]);
  
  if (status === 'loading') {
    return <LoadingSpinner />;
  }
  
  if (!session) {
    return null;
  }
  
  return <Dashboard user={session.user} />;
}
```

### Approach 4: Higher-Order Component Pattern

```typescript
// app/lib/auth/withAuth.tsx
import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import { ComponentType } from 'react';

export function withAuth<P extends object>(
  Component: ComponentType<P>,
  options?: { requiredRole?: string }
) {
  return function ProtectedComponent(props: P) {
    const { data: session, status } = useSession();
    
    if (status === 'loading') {
      return <LoadingSpinner />;
    }
    
    if (!session) {
      redirect('/auth/signin');
    }
    
    if (options?.requiredRole && session.user.role !== options.requiredRole) {
      redirect('/unauthorized');
    }
    
    return <Component {...props} user={session.user} />;
  };
}

// Usage
export default withAuth(DashboardPage, { requiredRole: 'admin' });
```

### Checklist
- [ ] Authentication method chosen (server/middleware/client)
- [ ] Session check implemented
- [ ] Unauthorized redirect configured
- [ ] Authorization check added (if needed)
- [ ] Loading state handled
- [ ] Error messages user-friendly
- [ ] Protected routes defined in middleware config
- [ ] Tests for authenticated and unauthenticated states

---

## 4. Creating a New UI Component

### Prerequisites
- React and TypeScript knowledge
- Familiarity with Tailwind CSS
- Understanding of component patterns (see `docs/DECISIONS.md#6`)

### Steps

#### 4.1 Determine Component Type

**UI Component** (Pure, reusable)
- No business logic
- Props-driven
- Lives in `/app/components/ui/`

**Feature Component** (Connected)
- Has business logic
- Uses hooks and services
- Lives in `/app/components/[feature]/`

#### 4.2 Create UI Component

```typescript
// app/components/ui/custom/StatusBadge.tsx
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

// Define variants with CVA
const badgeVariants = cva(
  'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors',
  {
    variants: {
      variant: {
        success: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100',
        warning: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100',
        error: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100',
        info: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100',
      },
      size: {
        sm: 'text-xs',
        md: 'text-sm',
        lg: 'text-base',
      },
    },
    defaultVariants: {
      variant: 'info',
      size: 'md',
    },
  }
);

export interface StatusBadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {
  icon?: React.ReactNode;
}

export const StatusBadge = ({
  className,
  variant,
  size,
  icon,
  children,
  ...props
}: StatusBadgeProps) => {
  return (
    <div className={cn(badgeVariants({ variant, size }), className)} {...props}>
      {icon && <span className="mr-1">{icon}</span>}
      {children}
    </div>
  );
};
```

#### 4.3 Create Feature Component

```typescript
// app/components/quiz/QuizCard.tsx
'use client';

import { useQuiz } from '@/app/hooks/useQuiz';
import { Card, CardHeader, CardContent, CardFooter } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { StatusBadge } from '@/app/components/ui/custom/StatusBadge';

interface QuizCardProps {
  quizId: string;
  onStart: (quizId: string) => void;
}

export const QuizCard = ({ quizId, onStart }: QuizCardProps) => {
  const { quiz, loading, error } = useQuiz(quizId);
  
  if (loading) {
    return <QuizCardSkeleton />;
  }
  
  if (error) {
    return <QuizCardError error={error} />;
  }
  
  if (!quiz) {
    return null;
  }
  
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">{quiz.title}</h3>
          <StatusBadge variant="success">{quiz.difficulty}</StatusBadge>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-gray-600">{quiz.description}</p>
        <div className="mt-4 flex gap-4 text-sm">
          <span>{quiz.questionCount} questions</span>
          <span>{quiz.timeLimit} minutes</span>
        </div>
      </CardContent>
      <CardFooter>
        <Button onClick={() => onStart(quiz.id)} className="w-full">
          Start Quiz
        </Button>
      </CardFooter>
    </Card>
  );
};
```

#### 4.4 Add Component Tests

```typescript
// app/components/quiz/__tests__/QuizCard.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { QuizCard } from '../QuizCard';

jest.mock('@/app/hooks/useQuiz');

describe('QuizCard', () => {
  it('renders quiz information', () => {
    (useQuiz as jest.Mock).mockReturnValue({
      quiz: {
        id: '1',
        title: 'Test Quiz',
        description: 'Test description',
        difficulty: 'easy',
        questionCount: 10,
        timeLimit: 15,
      },
      loading: false,
      error: null,
    });
    
    render(<QuizCard quizId="1" onStart={jest.fn()} />);
    
    expect(screen.getByText('Test Quiz')).toBeInTheDocument();
    expect(screen.getByText('Test description')).toBeInTheDocument();
    expect(screen.getByText('10 questions')).toBeInTheDocument();
  });
  
  it('calls onStart when button clicked', () => {
    const onStart = jest.fn();
    (useQuiz as jest.Mock).mockReturnValue({
      quiz: { id: '1', title: 'Test Quiz' },
      loading: false,
      error: null,
    });
    
    render(<QuizCard quizId="1" onStart={onStart} />);
    
    fireEvent.click(screen.getByText('Start Quiz'));
    
    expect(onStart).toHaveBeenCalledWith('1');
  });
});
```

#### 4.5 Add Storybook Story (Optional)

```typescript
// app/components/ui/custom/StatusBadge.stories.tsx
import type { Meta, StoryObj } from '@storybook/react';
import { StatusBadge } from './StatusBadge';

const meta: Meta<typeof StatusBadge> = {
  title: 'UI/StatusBadge',
  component: StatusBadge,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof StatusBadge>;

export const Success: Story = {
  args: {
    variant: 'success',
    children: 'Completed',
  },
};

export const WithIcon: Story = {
  args: {
    variant: 'success',
    icon: '✓',
    children: 'Verified',
  },
};
```

### Checklist
- [ ] Component type determined (UI vs. Feature)
- [ ] File created in correct directory
- [ ] TypeScript props interface defined
- [ ] Variants defined with CVA (if UI component)
- [ ] Accessibility attributes added (aria-labels, roles)
- [ ] Responsive design considered
- [ ] Dark mode support added
- [ ] Unit tests written
- [ ] Storybook story created (optional)

---

## 5. Deploying to Production

### Prerequisites
- Firebase CLI installed: `npm install -g firebase-tools`
- Firebase project configured
- Environment variables set

### Pre-Deployment Checklist

```bash
# 1. Run all tests
npm test

# 2. Run linter
npm run lint

# 3. Type check
npm run type-check  # or: tsc --noEmit

# 4. Build the project
npm run build

# 5. Check build output for errors
# Look for any warnings or errors in the output
```

### Steps

#### 5.1 Deploy to Firebase Hosting

```bash
# Login to Firebase (if not already)
firebase login

# Select the project
firebase use <project-id>

# Deploy hosting only
firebase deploy --only hosting

# Deploy specific functions
firebase deploy --only functions:functionName

# Deploy everything
firebase deploy
```

#### 5.2 Deploy Firestore Rules and Indexes

```bash
# Deploy Firestore rules
firebase deploy --only firestore:rules

# Deploy Firestore indexes
firebase deploy --only firestore:indexes

# Check index deployment status
firebase firestore:indexes
```

#### 5.3 Deploy Cloud Functions

```bash
# Deploy all functions
firebase deploy --only functions

# Deploy specific function
firebase deploy --only functions:myFunction

# View function logs
firebase functions:log

# Monitor function errors
firebase functions:log --only error
```

#### 5.4 Verify Deployment

```bash
# Open the deployed site
firebase open hosting:site

# Check function logs for errors
firebase functions:log --only error --limit 50

# Monitor performance in Firebase Console
# Go to: https://console.firebase.google.com/project/[project-id]/overview
```

### Rollback Procedure

```bash
# View hosting releases
firebase hosting:channel:list

# Rollback to previous release
firebase hosting:rollback

# Rollback functions (redeploy previous version)
# Functions don't have automatic rollback
# You'll need to redeploy the previous code
git checkout <previous-commit>
firebase deploy --only functions
```

### Environment-Specific Deployments

```bash
# Deploy to staging
firebase use staging
firebase deploy

# Deploy to production
firebase use production
firebase deploy

# List available projects
firebase projects:list
```

### Checklist
- [ ] All tests passing
- [ ] Linter passing
- [ ] Type checking passing
- [ ] Build successful
- [ ] Environment variables configured
- [ ] Firebase project selected
- [ ] Deployment successful
- [ ] Smoke tests passed on production
- [ ] Monitoring alerts configured
- [ ] Rollback plan documented

---

## 6. Troubleshooting Common Issues

### Issue: Authentication Failures

**Symptoms:**
- Users can't log in
- 401 errors on protected routes
- Session expires immediately

**Diagnosis:**
```bash
# Check NextAuth configuration
cat auth.ts

# Check environment variables
grep NEXTAUTH .env.local

# Check Firebase Admin initialization
grep -r "initializeApp" app/lib/firebase/
```

**Solutions:**

1. **Invalid JWT Secret**
```bash
# Regenerate secret
openssl rand -base64 32

# Update .env.local
NEXTAUTH_SECRET=<new-secret>
```

2. **Session Callback Issues**
```typescript
// auth.ts - Ensure session callback returns user data
callbacks: {
  async session({ session, token }) {
    if (session.user) {
      session.user.id = token.sub!;
      session.user.role = token.role as string;
    }
    return session;
  },
}
```

3. **Firebase Admin Initialization**
```typescript
// Ensure Firebase Admin is initialized before use
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  });
}
```

### Issue: Firestore Query Errors

**Symptoms:**
- "Missing index" errors
- Slow query performance
- Empty results when data exists

**Diagnosis:**
```bash
# Check Firestore indexes
firebase firestore:indexes

# View Firebase logs
firebase functions:log --only firestore

# Check query structure in code
grep -r "where.*where.*orderBy" app/lib/services/
```

**Solutions:**

1. **Missing Composite Index**
```bash
# Deploy indexes from firestore.indexes.json
firebase deploy --only firestore:indexes

# Wait for index to build (can take several minutes)
# Check status in Firebase Console
```

2. **Query Constraint Order**
```typescript
// WRONG: orderBy before where
const q = query(
  collection(db, 'items'),
  orderBy('createdAt'),
  where('active', '==', true)  // Error!
);

// RIGHT: where before orderBy
const q = query(
  collection(db, 'items'),
  where('active', '==', true),
  orderBy('createdAt')
);
```

3. **Array Contains with Multiple Values**
```typescript
// array-contains doesn't support multiple values
// Use 'in' operator or multiple queries instead
const q = query(
  collection(db, 'items'),
  where('tags', 'array-contains-any', ['tag1', 'tag2'])
);
```

### Issue: Build Failures

**Symptoms:**
- `npm run build` fails
- TypeScript errors
- Module not found errors

**Diagnosis:**
```bash
# Clear build cache
rm -rf .next
rm -rf node_modules/.cache

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install

# Check for TypeScript errors
npx tsc --noEmit
```

**Solutions:**

1. **Circular Dependencies**
```bash
# Find circular dependencies
npx madge --circular --extensions ts,tsx app/
```

2. **Missing Type Definitions**
```bash
# Install missing types
npm install -D @types/[package-name]
```

3. **Import Path Issues**
```typescript
// Use TypeScript path aliases consistently
// tsconfig.json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./app/*"]
    }
  }
}
```

### Issue: Performance Problems

**Symptoms:**
- Slow page loads
- High memory usage
- Long API response times

**Diagnosis:**
```bash
# Profile build
npm run build -- --profile

# Analyze bundle size
npm run analyze

# Check for large dependencies
npx webpack-bundle-analyzer .next/analyze/client.json
```

**Solutions:**

1. **Code Splitting**
```typescript
// Use dynamic imports for heavy components
const HeavyComponent = dynamic(() => import('./HeavyComponent'), {
  loading: () => <Spinner />,
  ssr: false,
});
```

2. **Image Optimization**
```typescript
// Use Next.js Image component
import Image from 'next/image';

<Image
  src="/large-image.jpg"
  width={800}
  height={600}
  alt="Description"
  loading="lazy"
/>
```

3. **API Response Caching**
```typescript
// Add cache headers to API routes
export async function GET(req: NextRequest) {
  const response = NextResponse.json(data);
  response.headers.set(
    'Cache-Control',
    'public, s-maxage=60, stale-while-revalidate=300'
  );
  return response;
}
```

### Checklist
- [ ] Error logs reviewed
- [ ] Root cause identified
- [ ] Solution applied
- [ ] Tests verify fix
- [ ] Documentation updated if needed
- [ ] Similar issues prevented (linting, types, etc.)

---

## 7. Performance Monitoring

### Setting Up Monitoring

#### 7.1 Configure Performance Monitoring

```typescript
// app/lib/monitoring/performance.ts
export const monitorPerformance = (metricName: string) => {
  const startTime = performance.now();
  
  return () => {
    const duration = performance.now() - startTime;
    
    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`[Perf] ${metricName}: ${duration.toFixed(2)}ms`);
    }
    
    // Send to monitoring service in production
    if (process.env.NODE_ENV === 'production') {
      // Send to Firebase Performance, DataDog, etc.
      recordMetric(metricName, duration);
    }
  };
};

// Usage
const endMonitor = monitorPerformance('quiz-load');
await loadQuiz();
endMonitor();
```

#### 7.2 Component Performance Monitoring

```typescript
// app/hooks/useBenchmark.ts
import { useEffect, useRef } from 'react';

export const useBenchmark = (componentName: string) => {
  const renderCount = useRef(0);
  const startTime = useRef(performance.now());
  
  useEffect(() => {
    renderCount.current += 1;
    const renderTime = performance.now() - startTime.current;
    
    console.log(
      `[Benchmark] ${componentName} - Render #${renderCount.current}: ${renderTime.toFixed(2)}ms`
    );
    
    startTime.current = performance.now();
  });
};

// Usage in component
export const QuizPage = () => {
  useBenchmark('QuizPage');
  // Component logic...
};
```

#### 7.3 API Response Time Monitoring

```typescript
// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const startTime = Date.now();
  
  const response = NextResponse.next();
  
  // Add response time header
  response.headers.set('X-Response-Time', `${Date.now() - startTime}ms`);
  
  // Log slow requests
  const duration = Date.now() - startTime;
  if (duration > 1000) {
    console.warn(`[Slow Request] ${request.url}: ${duration}ms`);
  }
  
  return response;
}
```

### Monitoring Metrics

#### Key Performance Indicators (KPIs)

1. **Page Load Times**
   - First Contentful Paint (FCP): < 1.8s
   - Time to Interactive (TTI): < 3.9s
   - Largest Contentful Paint (LCP): < 2.5s

2. **API Response Times**
   - P50: < 200ms
   - P95: < 1000ms
   - P99: < 2000ms

3. **Error Rates**
   - Client Errors (4xx): < 5%
   - Server Errors (5xx): < 1%
   - Authentication Failures: < 0.5%

4. **Database Query Performance**
   - Average query time: < 100ms
   - Slow queries (>500ms): < 1%
   - Query error rate: < 0.1%

### Setting Up Alerts

```typescript
// app/lib/monitoring/alerts.ts
export const alertOnSlowQuery = (queryName: string, duration: number) => {
  const threshold = 500; // 500ms
  
  if (duration > threshold) {
    console.warn(`[Alert] Slow query: ${queryName} took ${duration}ms`);
    
    // Send to monitoring service
    if (process.env.NODE_ENV === 'production') {
      sendAlert({
        type: 'slow_query',
        query: queryName,
        duration,
        threshold,
      });
    }
  }
};
```

### Checklist
- [ ] Performance monitoring configured
- [ ] Key metrics tracked
- [ ] Alerts set up for slow requests
- [ ] Dashboard created for metrics
- [ ] Performance budgets defined
- [ ] Regular performance audits scheduled

---

## Additional Resources

- **Documentation:** `/docs/`
- **Architecture Decisions:** `/docs/DECISIONS.md`
- **Codebase Analysis:** `/docs/CODEBASE_ANALYSIS.md`
- **Firebase Console:** `https://console.firebase.google.com`
- **NextJS Docs:** `https://nextjs.org/docs`

---

## Contributing to This Document

When adding new runbooks:
1. Follow the existing format (Prerequisites, Steps, Checklist)
2. Include code examples for clarity
3. Add troubleshooting tips for common issues
4. Keep instructions concise and actionable
5. Test the runbook before committing

**Last Reviewed:** 2026-01-24
