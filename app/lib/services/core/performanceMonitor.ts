/**
 * Performance monitoring service for all application features
 * Tracks metrics for leaderboards, friend system, multiplayer functionality, and general operations
 */

export interface PerformanceMetric {
  name: string;
  value: number;
  timestamp: number;
  category: 'leaderboard' | 'friends' | 'multiplayer' | 'social' | 'auth' | 'quiz' | 'user' | 'general';
  metadata?: Record<string, any>;
}

export interface PerformanceThresholds {
  leaderboardLoad: number; // ms
  friendRequestResponse: number; // ms
  multiplayerLatency: number; // ms
  socialActionResponse: number; // ms
  realtimeUpdate: number; // ms
  authOperation: number; // ms
  quizOperation: number; // ms
  userOperation: number; // ms
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

export class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private metrics: PerformanceMetric[] = [];
  private maxMetrics = 1000; // Keep last 1000 metrics
  private thresholds: PerformanceThresholds = {
    leaderboardLoad: 500,   // 500ms
    friendRequestResponse: 300, // 300ms
    multiplayerLatency: 100,    // 100ms
    socialActionResponse: 400,  // 400ms
    realtimeUpdate: 50,         // 50ms
    authOperation: 200,         // 200ms
    quizOperation: 300,         // 300ms
    userOperation: 250,         // 250ms
  };

  public static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
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
  startMeasurement(
    name: string
  ): (category?: PerformanceMetric['category'], metadata?: Record<string, any>) => void {
    const startTime = performance.now();
    
    return (category: PerformanceMetric['category'] = 'general', metadata?: Record<string, any>) => {
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
    const startTime = performance.now();
    
    try {
      const result = await operation();
      const duration = performance.now() - startTime;
      this.recordMetric(name, duration, category, metadata);
      return result;
    } catch (error) {
      const duration = performance.now() - startTime;
      this.recordMetric(name, duration, category, { ...metadata, error: true });
      throw error;
    }
  }

  /**
   * Measure a sync operation
   */
  measureSync<T>(
    name: string,
    category: PerformanceMetric['category'],
    operation: () => T,
    metadata?: Record<string, any>
  ): T {
    const startTime = performance.now();
    
    try {
      const result = operation();
      const duration = performance.now() - startTime;
      this.recordMetric(name, duration, category, metadata);
      return result;
    } catch (error) {
      const duration = performance.now() - startTime;
      this.recordMetric(name, duration, category, { ...metadata, error: true });
      throw error;
    }
  }

  /**
   * Get metrics by category
   */
  getMetricsByCategory(category: PerformanceMetric['category']): PerformanceMetric[] {
    return this.metrics.filter(metric => metric.category === category);
  }

  /**
   * Get metrics in a time range
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
    const startTime = now - timeRangeMs;
    const recentMetrics = this.getMetricsInRange(startTime, now);

    if (recentMetrics.length === 0) {
      return {
        totalMetrics: 0,
        averageResponseTime: 0,
        threshold_violations: [],
        categoryBreakdown: {},
        recommendations: ['No metrics available for the specified time range']
      };
    }

    // Calculate averages and violations
    const totalTime = recentMetrics.reduce((sum, metric) => sum + metric.value, 0);
    const averageResponseTime = totalTime / recentMetrics.length;

    const violations = recentMetrics
      .map(metric => this.checkThresholdViolation(metric))
      .filter(violation => violation !== null) as Array<{
        metric: string;
        threshold: number;
        actual: number;
        severity: 'warning' | 'critical';
      }>;

    // Category breakdown
    const categoryBreakdown: Record<string, { count: number; averageTime: number; violations: number }> = {};
    const categories = [...new Set(recentMetrics.map(m => m.category))];

    categories.forEach(category => {
      const categoryMetrics = recentMetrics.filter(m => m.category === category);
      const categoryTime = categoryMetrics.reduce((sum, m) => sum + m.value, 0);
      const categoryViolations = violations.filter(v => 
        recentMetrics.find(m => m.name === v.metric)?.category === category
      ).length;

      categoryBreakdown[category] = {
        count: categoryMetrics.length,
        averageTime: categoryTime / categoryMetrics.length,
        violations: categoryViolations
      };
    });

    // Generate recommendations
    const recommendations = this.generateRecommendations(recentMetrics, violations);

    return {
      totalMetrics: recentMetrics.length,
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
   * Get current thresholds
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
   * Export metrics as JSON string
   */
  exportMetrics(): string {
    return JSON.stringify(this.metrics, null, 2);
  }

  /**
   * Check if a metric violates thresholds
   */
  private checkThresholds(metric: PerformanceMetric): void {
    const violation = this.checkThresholdViolation(metric);
    if (violation) {
      console.warn(`Performance threshold violation: ${violation.metric} took ${violation.actual}ms (threshold: ${violation.threshold}ms)`);
    }
  }

  /**
   * Check for threshold violations
   */
  private checkThresholdViolation(metric: PerformanceMetric): {
    metric: string;
    threshold: number;
    actual: number;
    severity: 'warning' | 'critical';
  } | null {
    let threshold: number;
    let severity: 'warning' | 'critical';

    // Map metric names to thresholds
    switch (metric.name) {
      case 'leaderboard-load':
        threshold = this.thresholds.leaderboardLoad;
        break;
      case 'friend-request':
      case 'friend-action':
        threshold = this.thresholds.friendRequestResponse;
        break;
      case 'multiplayer-latency':
        threshold = this.thresholds.multiplayerLatency;
        break;
      case 'social-action':
        threshold = this.thresholds.socialActionResponse;
        break;
      case 'realtime-update':
        threshold = this.thresholds.realtimeUpdate;
        break;
      case 'auth-operation':
        threshold = this.thresholds.authOperation;
        break;
      case 'quiz-operation':
        threshold = this.thresholds.quizOperation;
        break;
      case 'user-operation':
        threshold = this.thresholds.userOperation;
        break;
      default:
        return null;
    }

    // Determine severity
    if (metric.value > threshold * 2) {
      severity = 'critical';
    } else if (metric.value > threshold) {
      severity = 'warning';
    } else {
      return null;
    }

    return {
      metric: metric.name,
      threshold,
      actual: metric.value,
      severity
    };
  }

  /**
   * Generate performance recommendations
   */
  private generateRecommendations(
    metrics: PerformanceMetric[], 
    violations: Array<{ metric: string; threshold: number; actual: number; severity: 'warning' | 'critical' }>
  ): string[] {
    const recommendations: string[] = [];

    // Check for critical violations
    const criticalViolations = violations.filter(v => v.severity === 'critical');
    if (criticalViolations.length > 0) {
      recommendations.push(`Critical performance issues detected: ${criticalViolations.length} operations exceeded thresholds by 2x`);
    }

    // Check for warning violations
    const warningViolations = violations.filter(v => v.severity === 'warning');
    if (warningViolations.length > 0) {
      recommendations.push(`Performance warnings: ${warningViolations.length} operations exceeded thresholds`);
    }

    // Check for slow categories
    const categoryAverages = Object.entries(
      metrics.reduce((acc, metric) => {
        if (!acc[metric.category]) {
          acc[metric.category] = { total: 0, count: 0 };
        }
        acc[metric.category].total += metric.value;
        acc[metric.category].count += 1;
        return acc;
      }, {} as Record<string, { total: number; count: number }>)
    ).map(([category, { total, count }]) => ({
      category,
      average: total / count
    }));

    const slowCategories = categoryAverages.filter(cat => cat.average > 1000);
    if (slowCategories.length > 0) {
      recommendations.push(`Slow categories detected: ${slowCategories.map(cat => `${cat.category} (${cat.average.toFixed(0)}ms avg)`).join(', ')}`);
    }

    // Check for high error rates
    const errorMetrics = metrics.filter(m => m.metadata?.error);
    const errorRate = errorMetrics.length / metrics.length;
    if (errorRate > 0.1) {
      recommendations.push(`High error rate detected: ${(errorRate * 100).toFixed(1)}% of operations failed`);
    }

    // General recommendations
    if (metrics.length < 10) {
      recommendations.push('Limited performance data available - consider running more operations to gather metrics');
    }

    if (recommendations.length === 0) {
      recommendations.push('Performance is within acceptable ranges');
    }

    return recommendations;
  }
}

// Export singleton instance
export const performanceMonitor = PerformanceMonitor.getInstance();

// Convenience functions for specific categories
export const measureLeaderboardLoad = (operation: () => Promise<any>, metadata?: Record<string, any>) => 
  performanceMonitor.measureAsync('leaderboard-load', 'leaderboard', operation, metadata);

export const measureFriendAction = (operation: () => Promise<any>, metadata?: Record<string, any>) => 
  performanceMonitor.measureAsync('friend-action', 'friends', operation, metadata);

export const measureMultiplayerAction = (operation: () => Promise<any>, metadata?: Record<string, any>) => 
  performanceMonitor.measureAsync('multiplayer-action', 'multiplayer', operation, metadata);

export const measureSocialAction = (operation: () => Promise<any>, metadata?: Record<string, any>) => 
  performanceMonitor.measureAsync('social-action', 'social', operation, metadata);

export const measureAuthOperation = (operation: () => Promise<any>, metadata?: Record<string, any>) => 
  performanceMonitor.measureAsync('auth-operation', 'auth', operation, metadata);

export const measureQuizOperation = (operation: () => Promise<any>, metadata?: Record<string, any>) => 
  performanceMonitor.measureAsync('quiz-operation', 'quiz', operation, metadata);

export const measureUserOperation = (operation: () => Promise<any>, metadata?: Record<string, any>) => 
  performanceMonitor.measureAsync('user-operation', 'user', operation, metadata);

export const recordRealtimeLatency = (latency: number, metadata?: Record<string, any>) => 
  performanceMonitor.recordMetric('realtime-latency', latency, 'multiplayer', metadata); 
