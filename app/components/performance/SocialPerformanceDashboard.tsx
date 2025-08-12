'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Badge } from '@/app/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/components/ui/tabs';
import { 
  Activity, 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  CheckCircle,
  Clock,
  Users,
  Gamepad2,
  Zap,
  RefreshCw,
  Download,
  Settings,
  BarChart3,
  PieChart
} from 'lucide-react';
import { cn } from '@/app/lib/utils';
import { 
  socialPerformanceMonitor, 
  PerformanceReport, 
  PerformanceMetric,
  PerformanceThresholds 
} from '@/app/lib/services/socialPerformanceMonitor';

interface SocialPerformanceDashboardProps {
  className?: string;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

export function SocialPerformanceDashboard({ 
  className, 
  autoRefresh = true, 
  refreshInterval = 30000 // 30 seconds
}: SocialPerformanceDashboardProps) {
  const [report, setReport] = useState<PerformanceReport | null>(null);
  const [metrics, setMetrics] = useState<PerformanceMetric[]>([]);
  const [thresholds, setThresholds] = useState<PerformanceThresholds>();
  const [selectedTimeRange, setSelectedTimeRange] = useState(300000); // 5 minutes
  const [isLoading, setIsLoading] = useState(false);

  // Refresh data
  const refreshData = async () => {
    setIsLoading(true);
    try {
      const newReport = socialPerformanceMonitor.generateReport(selectedTimeRange);
      const recentMetrics = socialPerformanceMonitor.getMetricsInRange(
        Date.now() - selectedTimeRange,
        Date.now()
      );
      const currentThresholds = socialPerformanceMonitor.getThresholds();
      
      setReport(newReport);
      setMetrics(recentMetrics);
      setThresholds(currentThresholds);
    } finally {
      setIsLoading(false);
    }
  };

  // Auto-refresh functionality
  useEffect(() => {
    refreshData();
    
    if (autoRefresh) {
      const interval = setInterval(refreshData, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [selectedTimeRange, autoRefresh, refreshInterval]);

  // Export metrics
  const handleExportMetrics = () => {
    const data = socialPerformanceMonitor.exportMetrics();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `social-performance-metrics-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Clear all metrics
  const handleClearMetrics = () => {
    socialPerformanceMonitor.clearMetrics();
    refreshData();
  };

  // Get status color based on violations
  const getStatusColor = (violations: number): string => {
    if (violations === 0) return 'text-green-600';
    if (violations <= 2) return 'text-yellow-600';
    return 'text-red-600';
  };

  // Get performance grade
  const getPerformanceGrade = (): { grade: string; color: string } => {
    if (!report) return { grade: 'N/A', color: 'text-gray-500' };
    
    const violationRatio = report.threshold_violations.length / Math.max(report.totalMetrics, 1);
    const avgTime = report.averageResponseTime;
    
    if (violationRatio === 0 && avgTime < 200) {
      return { grade: 'A+', color: 'text-green-600' };
    } else if (violationRatio < 0.1 && avgTime < 400) {
      return { grade: 'A', color: 'text-green-600' };
    } else if (violationRatio < 0.2 && avgTime < 600) {
      return { grade: 'B', color: 'text-blue-600' };
    } else if (violationRatio < 0.3 && avgTime < 800) {
      return { grade: 'C', color: 'text-yellow-600' };
    } else {
      return { grade: 'D', color: 'text-red-600' };
    }
  };

  const performanceGrade = getPerformanceGrade();

  if (!report) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center h-64">
          <div className="text-center">
            <Activity className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">Loading performance data...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Social Features Performance
          </CardTitle>
          
          <div className="flex items-center gap-2">
            {/* Time Range Selector */}
            <select
              value={selectedTimeRange}
              onChange={(e) => setSelectedTimeRange(Number(e.target.value))}
              className="text-sm border border-input rounded px-2 py-1"
            >
              <option value={60000}>Last 1 minute</option>
              <option value={300000}>Last 5 minutes</option>
              <option value={900000}>Last 15 minutes</option>
              <option value={3600000}>Last 1 hour</option>
            </select>
            
            <Button
              variant="outline"
              size="sm"
              onClick={refreshData}
              disabled={isLoading}
            >
              {isLoading ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportMetrics}
            >
              <Download className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="metrics">Metrics</TabsTrigger>
            <TabsTrigger value="violations">Issues</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Performance Summary */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4 text-center">
                  <div className={cn('text-3xl font-bold', performanceGrade.color)}>
                    {performanceGrade.grade}
                  </div>
                  <div className="text-sm text-muted-foreground">Overall Grade</div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold">{Math.round(report.averageResponseTime)}ms</div>
                  <div className="text-sm text-muted-foreground">Avg Response</div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold">{report.totalMetrics}</div>
                  <div className="text-sm text-muted-foreground">Total Metrics</div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4 text-center">
                  <div className={cn('text-2xl font-bold', getStatusColor(report.threshold_violations.length))}>
                    {report.threshold_violations.length}
                  </div>
                  <div className="text-sm text-muted-foreground">Violations</div>
                </CardContent>
              </Card>
            </div>

            {/* Category Breakdown */}
            <div>
              <h3 className="font-medium mb-4">Performance by Category</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {Object.entries(report.categoryBreakdown).map(([category, data]) => (
                  <Card key={category}>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2 mb-2">
                        {category === 'leaderboard' && <TrendingUp className="h-4 w-4 text-blue-500" />}
                        {category === 'friends' && <Users className="h-4 w-4 text-green-500" />}
                        {category === 'multiplayer' && <Gamepad2 className="h-4 w-4 text-purple-500" />}
                        {category === 'social' && <Activity className="h-4 w-4 text-orange-500" />}
                        <span className="font-medium capitalize">{category}</span>
                      </div>
                      
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span>Count:</span>
                          <span>{data.count}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Avg Time:</span>
                          <span>{Math.round(data.averageTime)}ms</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Issues:</span>
                          <span className={getStatusColor(data.violations)}>
                            {data.violations}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* Recommendations */}
            <div>
              <h3 className="font-medium mb-4">Recommendations</h3>
              <div className="space-y-2">
                {report.recommendations.map((recommendation, index) => (
                  <div
                    key={index}
                    className="flex items-start gap-3 p-3 border rounded-lg"
                  >
                    {recommendation.includes('🚨') ? (
                      <AlertTriangle className="h-4 w-4 text-red-500 mt-0.5" />
                    ) : recommendation.includes('⚠️') ? (
                      <AlertTriangle className="h-4 w-4 text-yellow-500 mt-0.5" />
                    ) : (
                      <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                    )}
                    <span className="text-sm">{recommendation}</span>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="metrics" className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-medium">Recent Metrics</h3>
              <div className="text-sm text-muted-foreground">
                Showing last {metrics.length} metrics
              </div>
            </div>
            
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {metrics.slice(-50).reverse().map((metric, index) => (
                <div
                  key={`${metric.timestamp}-${index}`}
                  className="flex items-center justify-between p-3 border rounded-lg text-sm"
                >
                  <div className="flex items-center gap-3">
                    <Badge variant="outline" className="text-xs">
                      {metric.category}
                    </Badge>
                    <span className="font-medium">{metric.name}</span>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <span className={cn(
                      'font-mono',
                      metric.value > 1000 ? 'text-red-600' : 
                      metric.value > 500 ? 'text-yellow-600' : 'text-green-600'
                    )}>
                      {Math.round(metric.value)}ms
                    </span>
                    <span className="text-muted-foreground">
                      {new Date(metric.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="violations" className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-medium">Performance Issues</h3>
              <Badge variant={report.threshold_violations.length > 0 ? "destructive" : "default"}>
                {report.threshold_violations.length} issues
              </Badge>
            </div>
            
            {report.threshold_violations.length > 0 ? (
              <div className="space-y-3">
                {report.threshold_violations.map((violation, index) => (
                  <Card key={index} className={cn(
                    'border-l-4',
                    violation.severity === 'critical' ? 'border-l-red-500' : 'border-l-yellow-500'
                  )}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <AlertTriangle className={cn(
                            'h-4 w-4',
                            violation.severity === 'critical' ? 'text-red-500' : 'text-yellow-500'
                          )} />
                          <span className="font-medium">{violation.metric}</span>
                          <Badge variant={violation.severity === 'critical' ? "destructive" : "secondary"}>
                            {violation.severity}
                          </Badge>
                        </div>
                      </div>
                      
                      <div className="text-sm text-muted-foreground">
                        Response time: <span className="font-mono">{violation.actual}ms</span>
                        {' '}(threshold: <span className="font-mono">{violation.threshold}ms</span>)
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">All Systems Performing Well</h3>
                <p className="text-muted-foreground">
                  No performance threshold violations detected
                </p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="settings" className="space-y-6">
            <div>
              <h3 className="font-medium mb-4">Performance Thresholds</h3>
              {thresholds && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Object.entries(thresholds).map(([key, value]) => (
                    <div key={key} className="flex items-center justify-between p-3 border rounded-lg">
                      <span className="capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm">{value}ms</span>
                        <Button variant="outline" size="sm">
                          <Settings className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={handleClearMetrics}
                className="flex-1"
              >
                Clear All Metrics
              </Button>
              <Button
                variant="outline"
                onClick={handleExportMetrics}
                className="flex-1"
              >
                <Download className="h-4 w-4 mr-2" />
                Export Data
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}