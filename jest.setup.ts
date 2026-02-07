import '@testing-library/jest-dom';
import { setupTestEnvironment, teardownTestEnvironment } from './app/__tests__/utils/test-setup';

// Set a longer timeout for tests that need to interact with emulators
jest.setTimeout(30000);

// Mock fetch API
global.fetch = jest.fn() as jest.Mock;

// Mock Request and Response APIs
global.Request = class Request {
  constructor(public url: string, public init?: RequestInit) {}
} as any;

global.Response = class Response {
  body?: BodyInit | null;
  init?: ResponseInit;

  constructor(body?: BodyInit | null, init?: ResponseInit) {
    this.body = body;
    this.init = init;
  }

  get status() {
    return this.init?.status ?? 200;
  }

  async json() {
    if (typeof this.body === 'string') {
      return JSON.parse(this.body);
    }
    return this.body;
  }

  async text() {
    if (typeof this.body === 'string') {
      return this.body;
    }
    return this.body ? JSON.stringify(this.body) : '';
  }

  static json(data: any, init?: ResponseInit) {
    return new Response(JSON.stringify(data), {
      ...init,
      headers: { 'Content-Type': 'application/json', ...init?.headers },
    });
  }
  static redirect(url: string, status = 302) {
    return new Response(null, { status, headers: { Location: url } });
  }
} as any;

// Mock HTMLCanvasElement for tests that use canvas
HTMLCanvasElement.prototype.getContext = jest.fn(() => ({
  clearRect: jest.fn(),
  fillRect: jest.fn(),
  fillStyle: '',
  strokeStyle: '',
  lineWidth: 1,
  lineCap: 'butt',
  lineJoin: 'miter',
  miterLimit: 10,
  shadowOffsetX: 0,
  shadowOffsetY: 0,
  shadowBlur: 0,
  shadowColor: '',
  globalAlpha: 1,
  globalCompositeOperation: 'source-over',
  font: '',
  textAlign: 'start',
  textBaseline: 'alphabetic',
  direction: 'ltr',
  drawImage: jest.fn(),
  beginPath: jest.fn(),
  closePath: jest.fn(),
  moveTo: jest.fn(),
  lineTo: jest.fn(),
  bezierCurveTo: jest.fn(),
  quadraticCurveTo: jest.fn(),
  arc: jest.fn(),
  arcTo: jest.fn(),
  rect: jest.fn(),
  fill: jest.fn(),
  stroke: jest.fn(),
  clip: jest.fn(),
  isPointInPath: jest.fn(),
  isPointInStroke: jest.fn(),
  rotate: jest.fn(),
  scale: jest.fn(),
  translate: jest.fn(),
  transform: jest.fn(),
  setTransform: jest.fn(),
  resetTransform: jest.fn(),
  save: jest.fn(),
  restore: jest.fn(),
  createLinearGradient: jest.fn(),
  createRadialGradient: jest.fn(),
  createPattern: jest.fn(),
  fillText: jest.fn(),
  strokeText: jest.fn(),
  measureText: jest.fn(() => ({ width: 0 })),
  getImageData: jest.fn(),
  putImageData: jest.fn(),
  createImageData: jest.fn(),
})) as any;

// Mock console methods to reduce noise in test output
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;
const originalConsoleLog = console.log;

console.error = (...args: any[]) => {
  // Filter out expected errors during tests
  const errorMessage = args.join(' ');
  if (
    errorMessage.includes('Warning: ReactDOM.render is no longer supported') ||
    errorMessage.includes('Warning: useLayoutEffect does nothing on the server')
  ) {
    return;
  }
  originalConsoleError(...args);
};

console.warn = (...args: any[]) => {
  // Filter out expected warnings during tests
  const warnMessage = args.join(' ');
  if (
    warnMessage.includes('Warning: ReactDOM.render is no longer supported') ||
    warnMessage.includes('Warning: useLayoutEffect does nothing on the server')
  ) {
    return;
  }
  originalConsoleWarn(...args);
};

// Reduce console noise during tests
console.log = (...args: any[]) => {
  // Filter out verbose logs during tests
  const logMessage = args.join(' ');
  if (
    logMessage.includes('Firebase') ||
    logMessage.includes('Emulator')
  ) {
    return;
  }
  originalConsoleLog(...args);
};

// Set up global beforeAll and afterAll hooks
beforeAll(async () => {
  // Only set up emulators for integration tests
  const isIntegrationTest = process.env.TEST_TYPE === 'integration';
  
  if (isIntegrationTest) {
    await setupTestEnvironment({
      startEmulators: true,
      cleanupBeforeTests: true
    });
  } else {
    // For unit tests, just set the environment variables
    // NODE_ENV is read-only, so we don't modify it
    process.env.USE_FIREBASE_EMULATOR = 'true';
    process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATOR = 'true';
  }
});

afterAll(async () => {
  // Clean up resources after tests
  const isIntegrationTest = process.env.TEST_TYPE === 'integration';
  
  if (isIntegrationTest) {
    await teardownTestEnvironment();
  }
  
  // Restore console methods
  console.error = originalConsoleError;
  console.warn = originalConsoleWarn;
  console.log = originalConsoleLog;
});

// Add any custom setup for Jest tests
import '@testing-library/jest-dom';

// Mock Firebase
jest.mock('firebase/app', () => {
  return {
    initializeApp: jest.fn().mockReturnValue({
      name: 'testApp',
    }),
    getApps: jest.fn().mockReturnValue([]),
    FirebaseError: class FirebaseError extends Error {
      code: string;
      customData?: Record<string, any>;

      constructor(code: string, message: string, customData?: Record<string, any>) {
        super(message);
        this.code = code;
        this.customData = customData;
        this.name = 'FirebaseError';
        Object.setPrototypeOf(this, FirebaseError.prototype);
      }
    }
  };
});

jest.mock('firebase/auth', () => {
  return {
    getAuth: jest.fn().mockReturnValue({
      currentUser: null,
      signOut: jest.fn(),
    }),
    initializeAuth: jest.fn().mockReturnValue({
      currentUser: null,
      signOut: jest.fn(),
    }),
    indexedDBLocalPersistence: 'indexedDBLocalPersistence',
    connectAuthEmulator: jest.fn(),
    onAuthStateChanged: jest.fn(),
    createUserWithEmailAndPassword: jest.fn(),
    signInWithEmailAndPassword: jest.fn(),
    signInWithPopup: jest.fn(),
    updateProfile: jest.fn(),
    sendEmailVerification: jest.fn(),
    sendPasswordResetEmail: jest.fn(),
    signOut: jest.fn(),
    GoogleAuthProvider: jest.fn(),
    TwitterAuthProvider: jest.fn(),
    FacebookAuthProvider: jest.fn(),
  };
});

jest.mock('firebase/firestore', () => {
  return {
    getFirestore: jest.fn().mockReturnValue({}),
    initializeFirestore: jest.fn().mockReturnValue({}),
    connectFirestoreEmulator: jest.fn(),
    enableMultiTabIndexedDbPersistence: jest.fn().mockResolvedValue({}),
    collection: jest.fn(),
    doc: jest.fn(),
    getDoc: jest.fn(),
    getDocs: jest.fn(),
    query: jest.fn(),
    limit: jest.fn(),
    writeBatch: jest.fn(() => ({
      set: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      commit: jest.fn().mockResolvedValue({}),
    })),
    CACHE_SIZE_UNLIMITED: 'CACHE_SIZE_UNLIMITED',
  };
});

jest.mock('firebase/storage', () => {
  return {
    getStorage: jest.fn().mockReturnValue({}),
    connectStorageEmulator: jest.fn(),
  };
});

jest.mock('firebase/analytics', () => {
  return {
    getAnalytics: jest.fn().mockReturnValue({}),
    isSupported: jest.fn().mockResolvedValue(true),
  };
});

jest.mock('firebase/performance', () => {
  return {
    getPerformance: jest.fn().mockReturnValue({}),
  };
});

jest.mock('firebase/functions', () => {
  return {
    getFunctions: jest.fn().mockReturnValue({}),
    connectFunctionsEmulator: jest.fn(),
  };
});

jest.mock('firebase/database', () => {
  return {
    getDatabase: jest.fn().mockReturnValue({}),
    connectDatabaseEmulator: jest.fn(),
    ref: jest.fn(),
    get: jest.fn(),
    set: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    onValue: jest.fn(),
  };
});

// Mock Next.js
jest.mock('next/navigation', () => ({
  redirect: jest.fn(),
  useRouter: jest.fn(() => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
    pathname: '/',
    query: {},
  })),
  usePathname: jest.fn(() => '/'),
  useSearchParams: jest.fn(() => new URLSearchParams()),
}));

// Mock NextAuth
jest.mock('next-auth/react', () => ({
  useSession: jest.fn(() => ({
    data: null,
    status: 'unauthenticated',
  })),
  signIn: jest.fn(),
  signOut: jest.fn(),
  SessionProvider: ({ children }: { children: React.ReactNode }) => children,
})); 
