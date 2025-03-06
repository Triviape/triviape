export const EMULATOR_PORTS = {
  auth: 9099,
  firestore: 8080,
  storage: 9199,
  functions: 5001,
  database: 9000,
  hosting: 5000,
  ui: 4000,
  hub: 4400
};

export const EMULATOR_HOSTS = {
  auth: `localhost:${EMULATOR_PORTS.auth}`,
  firestore: `localhost:${EMULATOR_PORTS.firestore}`,
  storage: `localhost:${EMULATOR_PORTS.storage}`,
  functions: `localhost:${EMULATOR_PORTS.functions}`,
  database: `localhost:${EMULATOR_PORTS.database}`,
  hosting: `localhost:${EMULATOR_PORTS.hosting}`,
  ui: `localhost:${EMULATOR_PORTS.ui}`,
  hub: `localhost:${EMULATOR_PORTS.hub}`
};

/**
 * Get the full URL for an emulator service
 * @param service The emulator service name
 * @param protocol The protocol to use (default: http)
 * @returns The full URL for the emulator service
 */
export function getEmulatorUrl(service: keyof typeof EMULATOR_HOSTS, protocol: 'http' | 'https' = 'http'): string {
  return `${protocol}://${EMULATOR_HOSTS[service]}`;
}

/**
 * Check if emulators should be used based on environment variables
 */
export function shouldUseEmulators(): boolean {
  // For client-side
  if (typeof window !== 'undefined') {
    return process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATOR === 'true';
  }
  
  // For server-side
  return (
    process.env.NODE_ENV === 'development' || 
    process.env.NODE_ENV === 'test' || 
    process.env.USE_FIREBASE_EMULATOR === 'true'
  );
}

/**
 * Get environment variable names for emulator hosts
 */
export const EMULATOR_ENV_VARS = {
  auth: {
    server: 'FIREBASE_AUTH_EMULATOR_HOST',
    client: 'NEXT_PUBLIC_FIREBASE_AUTH_EMULATOR_HOST'
  },
  firestore: {
    server: 'FIRESTORE_EMULATOR_HOST',
    client: 'NEXT_PUBLIC_FIRESTORE_EMULATOR_HOST'
  },
  storage: {
    server: 'FIREBASE_STORAGE_EMULATOR_HOST',
    client: 'NEXT_PUBLIC_FIREBASE_STORAGE_EMULATOR_HOST'
  },
  functions: {
    server: 'FIREBASE_FUNCTIONS_EMULATOR_HOST',
    client: 'NEXT_PUBLIC_FIREBASE_FUNCTIONS_EMULATOR_HOST'
  },
  database: {
    server: 'FIREBASE_DATABASE_EMULATOR_HOST',
    client: 'NEXT_PUBLIC_FIREBASE_DATABASE_EMULATOR_HOST'
  }
}; 