import { NextRequest } from 'next/server';
import { createHash } from 'crypto';
import { cookies } from 'next/headers';

/**
 * Session fingerprint data structure
 */
export interface SessionFingerprint {
  userAgent: string;
  acceptLanguage: string;
  acceptEncoding: string;
  ipAddress: string;
  timezone: string;
  screenResolution: string;
  platform: string;
  timestamp: number;
  hash: string;
}

/**
 * Fingerprint comparison result
 */
export interface FingerprintComparison {
  isValid: boolean;
  score: number;
  differences: string[];
  riskLevel: 'low' | 'medium' | 'high';
  shouldChallenge: boolean;
}

/**
 * Device fingerprint for client-side data
 */
export interface DeviceFingerprint {
  timezone: string;
  screenResolution: string;
  platform: string;
  language: string;
  cookiesEnabled: boolean;
  localStorageEnabled: boolean;
  sessionStorageEnabled: boolean;
}

/**
 * Session fingerprinting utility class
 */
export class SessionFingerprintManager {
  private readonly FINGERPRINT_COOKIE = 'session-fp';
  private readonly MAX_AGE = 60 * 60 * 24 * 7; // 7 days

  /**
   * Extract client IP address from request
   */
  private getClientIP(request: NextRequest): string {
    // Check various headers for the real IP
    const forwardedFor = request.headers.get('x-forwarded-for');
    const realIP = request.headers.get('x-real-ip');
    const cfConnectingIP = request.headers.get('cf-connecting-ip');
    
    if (forwardedFor) {
      // X-Forwarded-For can contain multiple IPs, take the first one
      return forwardedFor.split(',')[0].trim();
    }
    
    if (realIP) {
      return realIP;
    }
    
    if (cfConnectingIP) {
      return cfConnectingIP;
    }
    
    return 'unknown';
  }

  /**
   * Normalize and clean user agent string
   */
  private normalizeUserAgent(userAgent: string): string {
    // Remove version numbers to reduce fingerprint volatility
    return userAgent
      .replace(/\d+\.\d+\.\d+/g, 'X.X.X') // Replace version numbers
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim();
  }

  /**
   * Create fingerprint hash from components
   */
  private createFingerprintHash(components: Partial<SessionFingerprint>): string {
    const { userAgent, acceptLanguage, acceptEncoding, ipAddress, timezone, screenResolution, platform } = components;
    
    const fingerprintString = [
      userAgent || '',
      acceptLanguage || '',
      acceptEncoding || '',
      ipAddress || '',
      timezone || '',
      screenResolution || '',
      platform || ''
    ].join('|');
    
    return createHash('sha256').update(fingerprintString).digest('hex');
  }

  /**
   * Generate session fingerprint from request and device data
   */
  async generateFingerprint(
    request: NextRequest, 
    deviceData?: DeviceFingerprint
  ): Promise<SessionFingerprint> {
    const userAgent = this.normalizeUserAgent(request.headers.get('user-agent') || '');
    const acceptLanguage = request.headers.get('accept-language') || '';
    const acceptEncoding = request.headers.get('accept-encoding') || '';
    const ipAddress = this.getClientIP(request);
    
    const fingerprint: SessionFingerprint = {
      userAgent,
      acceptLanguage,
      acceptEncoding,
      ipAddress,
      timezone: deviceData?.timezone || '',
      screenResolution: deviceData?.screenResolution || '',
      platform: deviceData?.platform || '',
      timestamp: Date.now(),
      hash: ''
    };
    
    fingerprint.hash = this.createFingerprintHash(fingerprint);
    
    return fingerprint;
  }

  /**
   * Compare two fingerprints and calculate similarity score
   */
  compareFingerprints(
    current: SessionFingerprint, 
    stored: SessionFingerprint
  ): FingerprintComparison {
    const differences: string[] = [];
    let score = 100;
    
    // User Agent comparison (weight: 30)
    if (current.userAgent !== stored.userAgent) {
      differences.push('User Agent changed');
      score -= 30;
    }
    
    // IP Address comparison (weight: 25)
    if (current.ipAddress !== stored.ipAddress) {
      differences.push('IP Address changed');
      score -= 25;
      
      // Check if it's within the same subnet (less severe)
      if (this.isSameSubnet(current.ipAddress, stored.ipAddress)) {
        score += 10; // Partial credit for same subnet
        differences[differences.length - 1] = 'IP Address changed (same subnet)';
      }
    }
    
    // Language comparison (weight: 15)
    if (current.acceptLanguage !== stored.acceptLanguage) {
      differences.push('Accept Language changed');
      score -= 15;
    }
    
    // Encoding comparison (weight: 10)
    if (current.acceptEncoding !== stored.acceptEncoding) {
      differences.push('Accept Encoding changed');
      score -= 10;
    }
    
    // Timezone comparison (weight: 10)
    if (current.timezone && stored.timezone && current.timezone !== stored.timezone) {
      differences.push('Timezone changed');
      score -= 10;
    }
    
    // Screen resolution comparison (weight: 5)
    if (current.screenResolution && stored.screenResolution && 
        current.screenResolution !== stored.screenResolution) {
      differences.push('Screen Resolution changed');
      score -= 5;
    }
    
    // Platform comparison (weight: 5)
    if (current.platform && stored.platform && current.platform !== stored.platform) {
      differences.push('Platform changed');
      score -= 5;
    }
    
    // Ensure score doesn't go below 0
    score = Math.max(0, score);
    
    // Determine risk level and challenge requirement
    let riskLevel: 'low' | 'medium' | 'high';
    let shouldChallenge = false;
    
    if (score >= 80) {
      riskLevel = 'low';
    } else if (score >= 50) {
      riskLevel = 'medium';
      shouldChallenge = true;
    } else {
      riskLevel = 'high';
      shouldChallenge = true;
    }
    
    return {
      isValid: score >= 50, // Require at least 50% similarity
      score,
      differences,
      riskLevel,
      shouldChallenge
    };
  }

  /**
   * Check if two IP addresses are in the same subnet
   */
  private isSameSubnet(ip1: string, ip2: string): boolean {
    try {
      // Simple IPv4 subnet check (same /24 network)
      const parts1 = ip1.split('.');
      const parts2 = ip2.split('.');
      
      if (parts1.length === 4 && parts2.length === 4) {
        return parts1[0] === parts2[0] && 
               parts1[1] === parts2[1] && 
               parts1[2] === parts2[2];
      }
    } catch {
      // Ignore errors and assume different subnets
    }
    return false;
  }

  /**
   * Store fingerprint in secure cookie
   */
  async storeFingerprint(fingerprint: SessionFingerprint): Promise<void> {
    const cookieStore = await cookies();
    
    // Only store the hash and timestamp to minimize cookie size
    const fingerprintData = {
      hash: fingerprint.hash,
      timestamp: fingerprint.timestamp
    };
    
    cookieStore.set({
      name: this.FINGERPRINT_COOKIE,
      value: JSON.stringify(fingerprintData),
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: this.MAX_AGE,
      path: '/'
    });
  }

  /**
   * Retrieve stored fingerprint from cookie
   */
  async getStoredFingerprint(): Promise<{ hash: string; timestamp: number } | null> {
    try {
      const cookieStore = await cookies();
      const fingerprintCookie = cookieStore.get(this.FINGERPRINT_COOKIE);
      
      if (!fingerprintCookie?.value) {
        return null;
      }
      
      const data = JSON.parse(fingerprintCookie.value);
      
      // Check if fingerprint is not too old (7 days)
      if (Date.now() - data.timestamp > this.MAX_AGE * 1000) {
        return null;
      }
      
      return data;
    } catch {
      return null;
    }
  }

  /**
   * Validate session fingerprint against stored fingerprint
   */
  async validateSessionFingerprint(
    request: NextRequest,
    deviceData?: DeviceFingerprint
  ): Promise<FingerprintComparison> {
    const currentFingerprint = await this.generateFingerprint(request, deviceData);
    const storedData = await this.getStoredFingerprint();
    
    if (!storedData) {
      // No stored fingerprint, consider this a new session
      await this.storeFingerprint(currentFingerprint);
      return {
        isValid: true,
        score: 100,
        differences: [],
        riskLevel: 'low',
        shouldChallenge: false
      };
    }
    
    // For comparison, we need to reconstruct the stored fingerprint
    // Since we only store the hash, we'll compare hashes directly
    if (currentFingerprint.hash === storedData.hash) {
      return {
        isValid: true,
        score: 100,
        differences: [],
        riskLevel: 'low',
        shouldChallenge: false
      };
    }
    
    // If hashes don't match, we need more detailed comparison
    // For now, consider it a medium risk change
    return {
      isValid: false,
      score: 40,
      differences: ['Session fingerprint changed'],
      riskLevel: 'high',
      shouldChallenge: true
    };
  }

  /**
   * Clear stored fingerprint (on logout)
   */
  async clearFingerprint(): Promise<void> {
    const cookieStore = await cookies();
    cookieStore.delete(this.FINGERPRINT_COOKIE);
  }
}

/**
 * Global session fingerprint manager instance
 */
export const sessionFingerprintManager = new SessionFingerprintManager();

/**
 * Middleware helper for fingerprint validation
 */
export async function validateSessionFingerprint(
  request: NextRequest,
  deviceData?: DeviceFingerprint
): Promise<FingerprintComparison> {
  return sessionFingerprintManager.validateSessionFingerprint(request, deviceData);
}

/**
 * Helper to generate and store fingerprint
 */
export async function createSessionFingerprint(
  request: NextRequest,
  deviceData?: DeviceFingerprint
): Promise<SessionFingerprint> {
  const fingerprint = await sessionFingerprintManager.generateFingerprint(request, deviceData);
  await sessionFingerprintManager.storeFingerprint(fingerprint);
  return fingerprint;
}
