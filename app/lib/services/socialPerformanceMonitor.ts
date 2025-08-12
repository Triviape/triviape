/**
 * Performance monitoring service for social features
 * Tracks metrics for leaderboards, friend system, and multiplayer functionality
 */

export interface PerformanceMetric {
  name: string;
  value: number;
  timestamp: number;
  category: 'leaderboard' | 'friends' | 'multiplayer' | 'social' | 'general';
  metadata?: Record<string, any>;
}

export interface PerformanceThresholds {
  leaderboardLoad: number; // ms
  friendRequestResponse: number; // ms
  multiplayerLatency: number; // ms
  socialActionResponse: number; // ms
  realtimeUpdate: number; // ms
}

export interface PerformanceReport {
  totalMetrics: number;
  averageResponseTime: number;
  threshold_violations: Array<{
    metric: string;
    threshold: number;
    actual: number;
    severity: 'warning' | 'critical';
  }>;
  categoryBreakdown: Record<string, {
    count: number;
    averageTime: number;
    violations: number;
  }>;
  recommendations: string[];
}

export class SocialPerformanceMonitor {
  private static instance: SocialPerformanceMonitor;
  private metrics: PerformanceMetric[] = [];
  private maxMetrics = 1000; // Keep last 1000 metrics
  private thresholds: PerformanceThresholds = {
    leaderboardLoad: 500,   // 500ms
    friendRequestResponse: 300, // 300ms
    multiplayerLatency: 100,    // 100ms
    socialActionResponse: 400,  // 400ms
    realtimeUpdate: 50,         // 50ms
  };

  public static getInstance(): SocialPerformanceMonitor {
    if (!SocialPerformanceMonitor.instance) {
      SocialPerformanceMonitor.instance = new SocialPerformanceMonitor();
    }
    return SocialPerformanceMonitor.instance;
  }

  /**
   * Record a performance metric
   */
  recordMetric(
    name: string,
    value: number,
    category: PerformanceMetric['category'],
    metadata?: Record<string, any>
  ): void {
    const metric: PerformanceMetric = {
      name,
      value,
      timestamp: Date.now(),
      category,
      metadata
    };

    this.metrics.push(metric);

    // Keep only the most recent metrics
    if (this.metrics.length > this.maxMetrics) {
      this.metrics = this.metrics.slice(-this.maxMetrics);
    }

    // Check for threshold violations
    this.checkThresholds(metric);

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`[Performance] ${category}:${name} - ${value}ms`, metadata);
    }
  }

  /**
   * Start measuring a performance metric
   */
  startMeasurement(name: string): () => void {
    const startTime = performance.now();
    
    return (category: PerformanceMetric['category'], metadata?: Record<string, any>) => {
      const duration = performance.now() - startTime;
      this.recordMetric(name, duration, category, metadata);
    };
  }

  /**
   * Measure an async operation
   */
  async measureAsync<T>(
    name: string,
    category: PerformanceMetric['category'],
    operation: () => Promise<T>,
    metadata?: Record<string, any>
  ): Promise<T> {
    const endMeasurement = this.startMeasurement(name);
    
    try {
      const result = await operation();
      endMeasurement(category, { ...metadata, success: true });
      return result;
    } catch (error) {
      endMeasurement(category, { ...metadata, success: false, error: error instanceof Error ? error.message : 'Unknown error' });
      throw error;
    }
  }

  /**
   * Measure a synchronous operation
   */
  measureSync<T>(
    name: string,
    category: PerformanceMetric['category'],
    operation: () => T,
    metadata?: Record<string, any>
  ): T {
    const endMeasurement = this.startMeasurement(name);
    
    try {
      const result = operation();
      endMeasurement(category, { ...metadata, success: true });
      return result;
    } catch (error) {
      endMeasurement(category, { ...metadata, success: false, error: error instanceof Error ? error.message : 'Unknown error' });
      throw error;
    }
  }

  /**
   * Get performance metrics for a specific category
   */
  getMetricsByCategory(category: PerformanceMetric['category']): PerformanceMetric[] {
    return this.metrics.filter(metric => metric.category === category);
  }

  /**
   * Get metrics within a time range
   */
  getMetricsInRange(startTime: number, endTime: number): PerformanceMetric[] {
    return this.metrics.filter(metric => 
      metric.timestamp >= startTime && metric.timestamp <= endTime
    );
  }

  /**
   * Generate a performance report
   */
  generateReport(timeRangeMs = 300000): PerformanceReport { // Default: last 5 minutes
    const now = Date.now();
    const metrics = this.getMetricsInRange(now - timeRangeMs, now);
    
    if (metrics.length === 0) {
      return {
        totalMetrics: 0,
        averageResponseTime: 0,
        threshold_violations: [],
        categoryBreakdown: {},
        recommendations: ['No metrics available for analysis']
      };
    }

    const totalTime = metrics.reduce((sum, metric) => sum + metric.value, 0);
    const averageResponseTime = totalTime / metrics.length;
    
    // Calculate threshold violations
    const violations = metrics
      .map(metric => this.checkThresholdViolation(metric))
      .filter(violation => violation !== null) as Array<{
        metric: string;
        threshold: number;
        actual: number;
        severity: 'warning' | 'critical';
      }>;

    // Category breakdown
    const categoryBreakdown: Record<string, { count: number; averageTime: number; violations: number }> = {};
    
    for (const metric of metrics) {
      if (!categoryBreakdown[metric.category]) {
        categoryBreakdown[metric.category] = { count: 0, averageTime: 0, violations: 0 };
      }
      
      const category = categoryBreakdown[metric.category];
      category.count++;
      category.averageTime = ((category.averageTime * (category.count - 1)) + metric.value) / category.count;
      
      if (this.checkThresholdViolation(metric)) {
        category.violations++;
      }
    }

    // Generate recommendations
    const recommendations = this.generateRecommendations(metrics, violations);

    return {
      totalMetrics: metrics.length,
      averageResponseTime,
      threshold_violations: violations,
      categoryBreakdown,
      recommendations
    };
  }

  /**
   * Update performance thresholds
   */
  updateThresholds(newThresholds: Partial<PerformanceThresholds>): void {
    this.thresholds = { ...this.thresholds, ...newThresholds };
  }

  /**
   * Get current performance thresholds
   */
  getThresholds(): PerformanceThresholds {
    return { ...this.thresholds };
  }

  /**
   * Clear all metrics
   */
  clearMetrics(): void {
    this.metrics = [];
  }

  /**
   * Export metrics as JSON
   */
  exportMetrics(): string {
    return JSON.stringify({
      metrics: this.metrics,
      thresholds: this.thresholds,
      exportedAt: new Date().toISOString()
    }, null, 2);
  }

  // Private methods
  private checkThresholds(metric: PerformanceMetric): void {
    const violation = this.checkThresholdViolation(metric);
    
    if (violation) {
      const message = `Performance threshold exceeded: ${violation.metric} (${violation.actual}ms > ${violation.threshold}ms)`;
      
      if (violation.severity === 'critical') {
        console.error(`[CRITICAL] ${message}`);
      } else {
        console.warn(`[WARNING] ${message}`);
      }
    }
  }

  private checkThresholdViolation(metric: PerformanceMetric): {
    metric: string;
    threshold: number;
    actual: number;
    severity: 'warning' | 'critical';
  } | null {
    let threshold: number | undefined;
    
    // Map metric names to thresholds
    if (metric.name.includes('leaderboard')) {
      threshold = this.thresholds.leaderboardLoad;
    } else if (metric.name.includes('friend')) {
      threshold = this.thresholds.friendRequestResponse;
    } else if (metric.name.includes('multiplayer') || metric.name.includes('websocket')) {
      threshold = this.thresholds.multiplayerLatency;
    } else if (metric.name.includes('realtime')) {
      threshold = this.thresholds.realtimeUpdate;
    } else {
      threshold = this.thresholds.socialActionResponse;
    }

    if (threshold && metric.value > threshold) {
      const severity = metric.value > threshold * 2 ? 'critical' : 'warning';
      return {
        metric: `${metric.category}:${metric.name}`,
        threshold,
        actual: metric.value,
        severity
      };
    }

    return null;
  }

  private generateRecommendations(
    metrics: PerformanceMetric[], 
    violations: Array<{ metric: string; threshold: number; actual: number; severity: 'warning' | 'critical' }>
  ): string[] {
    const recommendations: string[] = [];
    
    if (violations.length === 0) {
      recommendations.push('All performance metrics are within acceptable thresholds');
      return recommendations;
    }

    // Analyze violation patterns
    const criticalViolations = violations.filter(v => v.severity === 'critical');
    const warningViolations = violations.filter(v => v.severity === 'warning');
    
    if (criticalViolations.length > 0) {
      recommendations.push(`🚨 ${criticalViolations.length} critical performance issues detected`);
    }
    
    if (warningViolations.length > 0) {
      recommendations.push(`⚠️ ${warningViolations.length} performance warnings detected`);
    }

    // Category-specific recommendations
    const leaderboardIssues = violations.filter(v => v.metric.includes('leaderboard'));
    if (leaderboardIssues.length > 0) {
      recommendations.push('Consider implementing leaderboard caching or pagination');
    }

    const friendIssues = violations.filter(v => v.metric.includes('friend'));
    if (friendIssues.length > 0) {
      recommendations.push('Optimize friend system queries or implement friend list caching');
    }

    const multiplayerIssues = violations.filter(v => v.metric.includes('multiplayer'));
    if (multiplayerIssues.length > 0) {
      recommendations.push('Check WebSocket connection quality and server performance');
    }

    // General recommendations based on metric patterns
    const avgResponseTime = metrics.reduce((sum, m) => sum + m.value, 0) / metrics.length;
    if (avgResponseTime > 1000) {
      recommendations.push('Overall response times are high - consider server optimization');
    }

    return recommendations;
  }
}

// Export singleton instance
export const socialPerformanceMonitor = SocialPerformanceMonitor.getInstance();

// Convenience functions for common operations
export const measureLeaderboardLoad = (operation: () => Promise<any>, metadata?: Record<string, any>) => 
  socialPerformanceMonitor.measureAsync('leaderboard-load', 'leaderboard', operation, metadata);

export const measureFriendAction = (operation: () => Promise<any>, metadata?: Record<string, any>) => 
  socialPerformanceMonitor.measureAsync('friend-action', 'friends', operation, metadata);

export const measureMultiplayerAction = (operation: () => Promise<any>, metadata?: Record<string, any>) => 
  socialPerformanceMonitor.measureAsync('multiplayer-action', 'multiplayer', operation, metadata);

export const measureSocialAction = (operation: () => Promise<any>, metadata?: Record<string, any>) => 
  socialPerformanceMonitor.measureAsync('social-action', 'social', operation, metadata);

export const recordRealtimeLatency = (latency: number, metadata?: Record<string, any>) => 
  socialPerformanceMonitor.recordMetric('realtime-latency', latency, 'multiplayer', metadata);