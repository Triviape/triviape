/**
 * Upstash Redis-backed rate limit store for production use
 * Provides distributed rate limiting across serverless functions
 */

interface RateLimitEntry {
  count: number;
  resetTime: number;
  firstRequest: number;
}

interface RateLimitStore {
  get(key: string): RateLimitEntry | undefined | Promise<RateLimitEntry | undefined>;
  set(key: string, entry: RateLimitEntry): void | Promise<void>;
  delete(key: string): void | Promise<void>;
  clear(): void | Promise<void>;
  cleanup?(): void;
}

export class UpstashRateLimitStore implements RateLimitStore {
  private baseUrl: string;
  private token: string;

  constructor(url?: string, token?: string) {
    this.baseUrl = url || process.env.UPSTASH_REDIS_REST_URL || '';
    this.token = token || process.env.UPSTASH_REDIS_REST_TOKEN || '';

    if (!this.baseUrl || !this.token) {
      throw new Error(
        'Upstash Redis credentials not configured. ' +
        'Please set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN environment variables.'
      );
    }
  }

  private async request(method: string, command: string[]): Promise<any> {
    const response = await fetch(`${this.baseUrl}/exec`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify([command]),
    });

    if (!response.ok) {
      throw new Error(
        `Upstash Redis error: ${response.status} ${response.statusText}`
      );
    }

    const data = await response.json();
    return data[0]; // Returns array of results for each command
  }

  async get(key: string): Promise<RateLimitEntry | undefined> {
    try {
      const result = await this.request('GET', ['GET', key]);

      if (!result) {
        return undefined;
      }

      // Parse JSON stored in Redis
      return JSON.parse(result);
    } catch (error) {
      console.error(`Error getting key from Upstash: ${key}`, error);
      return undefined;
    }
  }

  async set(key: string, entry: RateLimitEntry): Promise<void> {
    try {
      const ttl = Math.ceil((entry.resetTime - Date.now()) / 1000);

      // Store as JSON with TTL
      await this.request('SET', [
        'SET',
        key,
        JSON.stringify(entry),
        'EX',
        ttl.toString(),
      ]);
    } catch (error) {
      console.error(`Error setting key in Upstash: ${key}`, error);
      throw error;
    }
  }

  async delete(key: string): Promise<void> {
    try {
      await this.request('DEL', ['DEL', key]);
    } catch (error) {
      console.error(`Error deleting key from Upstash: ${key}`, error);
      throw error;
    }
  }

  async clear(): Promise<void> {
    try {
      // FLUSHDB is dangerous in production, so we don't implement it
      console.warn('clear() not implemented for UpstashRateLimitStore');
    } catch (error) {
      console.error('Error clearing Upstash:', error);
      throw error;
    }
  }

  // No cleanup needed - Upstash handles expiration automatically
  cleanup(): void {
    // NOOP - Redis handles TTL expiration
  }
}
