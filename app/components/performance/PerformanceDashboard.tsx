"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Badge } from '@/app/components/ui/badge';
import { Progress } from '@/app/components/ui/progress';
import { 
  Activity, 
  Cpu, 
  HardDrive, 
  Network, 
  Zap,
  AlertTriangle,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { cn } from '@/app/lib/utils';

interface PerformanceMetrics {
  fps: number;
  memoryUsage: number;
  cpuUsage: number;
  networkLatency: number;
  bundleSize: number;
  renderTime: number;
  frameDrops: number;
}

interface PerformanceDashboardProps {
  className?: string;
  showDetails?: boolean;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

export function PerformanceDashboard({
  className,
  showDetails = false,
  autoRefresh = true,
  refreshInterval = 1000
}: PerformanceDashboardProps) {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    fps: 60,
    memoryUsage: 0,
    cpuUsage: 0,
    networkLatency: 0,
    bundleSize: 0,
    renderTime: 0,
    frameDrops: 0
  });
  const [isVisible, setIsVisible] = useState(false);
  const [alerts, setAlerts] = useState<string[]>([]);
  const [detailsOpen, setDetailsOpen] = useState(showDetails);

  // Performance monitoring
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      updateMetrics();
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval]);

  const updateMetrics = () => {
    // Simulate performance metrics (in real app, these would come from actual monitoring)
    const newMetrics: PerformanceMetrics = {
      fps: Math.random() * 30 + 30, // 30-60 FPS
      memoryUsage: Math.random() * 100,
      cpuUsage: Math.random() * 50,
      networkLatency: Math.random() * 200,
      bundleSize: Math.random() * 2000 + 500,
      renderTime: Math.random() * 50,
      frameDrops: Math.random() * 10
    };

    setMetrics(newMetrics);
    checkAlerts(newMetrics);
  };

  const checkAlerts = (newMetrics: PerformanceMetrics) => {
    const newAlerts: string[] = [];
    
    if (newMetrics.fps < 30) {
      newAlerts.push('Low FPS detected');
    }
    if (newMetrics.memoryUsage > 80) {
      newAlerts.push('High memory usage');
    }
    if (newMetrics.frameDrops > 5) {
      newAlerts.push('Frame drops detected');
    }
    if (newMetrics.renderTime > 16) {
      newAlerts.push('Slow render time');
    }

    setAlerts(newAlerts);
  };

  const getPerformanceStatus = () => {
    const issues = alerts.length;
    if (issues === 0) return { status: 'excellent', color: 'bg-green-500', icon: CheckCircle };
    if (issues <= 2) return { status: 'good', color: 'bg-yellow-500', icon: AlertTriangle };
    return { status: 'poor', color: 'bg-red-500', icon: XCircle };
  };

  const performanceStatus = getPerformanceStatus();

  if (!isVisible && process.env.NODE_ENV === 'development') {
    return (
      <Button
        onClick={() => setIsVisible(true)}
        variant="outline"
        size="sm"
        className="fixed bottom-4 right-4 z-50"
      >
        <Activity className="w-4 h-4 mr-2" />
        Performance
      </Button>
    );
  }

  if (!isVisible) return null;

  return (
    <div className={cn("fixed bottom-4 right-4 z-50", className)}>
      <Card className="w-80 shadow-lg">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm flex items-center gap-2">
              <Activity className="w-4 h-4" />
              Performance Monitor
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsVisible(false)}
              className="h-6 w-6 p-0"
            >
              <XCircle className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Performance Status */}
          <div className="flex items-center gap-2">
            <Badge 
              variant="secondary" 
              className={cn("flex items-center gap-1", performanceStatus.color)}
            >
              <performanceStatus.icon className="w-3 h-3" />
              {performanceStatus.status}
            </Badge>
            {alerts.length > 0 && (
              <Badge variant="destructive" className="text-xs">
                {alerts.length} alerts
              </Badge>
            )}
          </div>

          {/* Key Metrics */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Zap className="w-3 h-3" />
                FPS
              </div>
              <div className="text-lg font-semibold">
                {Math.round(metrics.fps)}
              </div>
              <Progress value={(metrics.fps / 60) * 100} className="h-1" />
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <HardDrive className="w-3 h-3" />
                Memory
              </div>
              <div className="text-lg font-semibold">
                {Math.round(metrics.memoryUsage)}%
              </div>
              <Progress value={metrics.memoryUsage} className="h-1" />
            </div>
          </div>

          {detailsOpen && (
            <div className="space-y-3 pt-2 border-t">
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-muted-foreground">CPU:</span>
                  <span className="ml-1 font-medium">{Math.round(metrics.cpuUsage)}%</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Network:</span>
                  <span className="ml-1 font-medium">{Math.round(metrics.networkLatency)}ms</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Bundle:</span>
                  <span className="ml-1 font-medium">{Math.round(metrics.bundleSize)}KB</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Render:</span>
                  <span className="ml-1 font-medium">{Math.round(metrics.renderTime)}ms</span>
                </div>
              </div>

              {alerts.length > 0 && (
                <div className="space-y-1">
                  <div className="text-xs font-medium text-destructive">Alerts:</div>
                  {alerts.map((alert, index) => (
                    <div key={index} className="text-xs text-destructive flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" />
                      {alert}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 pt-2 border-t">
            <Button
              variant="outline"
              size="sm"
              onClick={updateMetrics}
              className="flex-1"
            >
              Refresh
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDetailsOpen((prev) => !prev)}
              className="flex-1"
            >
              {detailsOpen ? 'Hide' : 'Details'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 
