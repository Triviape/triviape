/**
 * Performance Dashboard Component
 * 
 * This component displays performance metrics and analytics.
 * It's intended for development and debugging purposes.
 */

'use client';

import React, { useState, useEffect } from 'react';
import { 
  getPerformanceSummary, 
  getMetricsByType, 
  MetricType,
  PerformanceMetric,
  clearMetrics
} from '@/app/lib/performanceAnalyzer';

/**
 * Performance Dashboard Component
 */
export default function PerformanceDashboard() {
  const [summary, setSummary] = useState<Record<string, any>>({});
  const [selectedType, setSelectedType] = useState<MetricType | ''>('');
  const [metrics, setMetrics] = useState<PerformanceMetric[]>([]);
  const [isVisible, setIsVisible] = useState(false);
  const [refreshInterval, setRefreshInterval] = useState<number | null>(null);
  
  // Fetch performance summary
  const fetchSummary = () => {
    const newSummary = getPerformanceSummary();
    setSummary(newSummary);
    
    if (selectedType) {
      setMetrics(getMetricsByType(selectedType as MetricType));
    }
  };
  
  // Handle type selection
  const handleTypeSelect = (type: MetricType | '') => {
    setSelectedType(type);
    
    if (type) {
      setMetrics(getMetricsByType(type));
    } else {
      setMetrics([]);
    }
  };
  
  // Handle clear metrics
  const handleClearMetrics = () => {
    clearMetrics();
    fetchSummary();
    setMetrics([]);
  };
  
  // Handle refresh interval change
  const handleRefreshIntervalChange = (interval: number | null) => {
    if (refreshInterval) {
      clearInterval(refreshInterval);
      setRefreshInterval(null);
    }
    
    if (interval) {
      const id = window.setInterval(fetchSummary, interval);
      setRefreshInterval(id);
    }
  };
  
  // Toggle visibility
  const toggleVisibility = () => {
    setIsVisible(!isVisible);
  };
  
  // Initial fetch
  useEffect(() => {
    fetchSummary();
    
    // Cleanup
    return () => {
      if (refreshInterval) {
        clearInterval(refreshInterval);
      }
    };
  }, []);
  
  // Render toggle button only if not visible
  if (!isVisible) {
    return (
      <button
        onClick={toggleVisibility}
        className="fixed bottom-4 right-4 bg-blue-500 text-white p-2 rounded-full shadow-lg z-50"
        title="Show Performance Dashboard"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      </button>
    );
  }
  
  return (
    <div className="fixed inset-0 bg-gray-900 bg-opacity-75 z-50 overflow-auto p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-6xl mx-auto p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Performance Dashboard</h2>
          <div className="flex space-x-2">
            <select
              className="border rounded p-2"
              value={refreshInterval?.toString() || ''}
              onChange={(e) => handleRefreshIntervalChange(e.target.value ? parseInt(e.target.value) : null)}
            >
              <option value="">Manual Refresh</option>
              <option value="1000">1 second</option>
              <option value="5000">5 seconds</option>
              <option value="10000">10 seconds</option>
            </select>
            <button
              onClick={fetchSummary}
              className="bg-blue-500 text-white px-4 py-2 rounded"
            >
              Refresh
            </button>
            <button
              onClick={handleClearMetrics}
              className="bg-red-500 text-white px-4 py-2 rounded"
            >
              Clear Metrics
            </button>
            <button
              onClick={toggleVisibility}
              className="bg-gray-500 text-white px-4 py-2 rounded"
            >
              Close
            </button>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold mb-2">Total Metrics</h3>
            <p className="text-3xl font-bold">{summary.totalMetrics || 0}</p>
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold mb-2">Avg Query Time</h3>
            <p className="text-3xl font-bold">{summary.averageQueryTime?.toFixed(2) || 0} ms</p>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold mb-2">Avg Mutation Time</h3>
            <p className="text-3xl font-bold">{summary.averageMutationTime?.toFixed(2) || 0} ms</p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-xl font-semibold mb-4">Metrics by Type</h3>
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="grid grid-cols-2 gap-4">
                {Object.entries(summary.byType || {}).map(([type, data]: [string, any]) => (
                  <div 
                    key={type}
                    className="bg-white p-3 rounded border cursor-pointer hover:bg-blue-50"
                    onClick={() => handleTypeSelect(type as MetricType)}
                  >
                    <h4 className="font-medium text-gray-700">{type}</h4>
                    <div className="flex justify-between text-sm">
                      <span>Count: {data.count}</span>
                      <span>Avg: {data.average.toFixed(2)} ms</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Min: {data.min.toFixed(2)} ms</span>
                      <span>Max: {data.max.toFixed(2)} ms</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <h3 className="text-xl font-semibold mt-6 mb-4">Slowest Components</h3>
            <div className="bg-gray-50 p-4 rounded-lg">
              <table className="min-w-full">
                <thead>
                  <tr>
                    <th className="text-left py-2">Component</th>
                    <th className="text-right py-2">Avg Time (ms)</th>
                    <th className="text-right py-2">P95 Time (ms)</th>
                    <th className="text-right py-2">Renders</th>
                  </tr>
                </thead>
                <tbody>
                  {(summary.slowestComponents || []).map((component: any) => (
                    <tr key={component.name} className="border-t">
                      <td className="py-2">{component.name}</td>
                      <td className="text-right py-2">{component.averageRenderTime.toFixed(2)}</td>
                      <td className="text-right py-2">{component.p95RenderTime.toFixed(2)}</td>
                      <td className="text-right py-2">{component.renderCount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          
          <div>
            <h3 className="text-xl font-semibold mb-4">
              {selectedType ? `${selectedType} Metrics` : 'Select a metric type'}
            </h3>
            <div className="bg-gray-50 p-4 rounded-lg h-[500px] overflow-auto">
              {selectedType ? (
                metrics.length > 0 ? (
                  <table className="min-w-full">
                    <thead>
                      <tr>
                        <th className="text-left py-2">Name</th>
                        <th className="text-right py-2">Value (ms)</th>
                        <th className="text-right py-2">Timestamp</th>
                      </tr>
                    </thead>
                    <tbody>
                      {metrics.map((metric, index) => (
                        <tr key={index} className="border-t">
                          <td className="py-2">{metric.name}</td>
                          <td className="text-right py-2">{metric.value.toFixed(2)}</td>
                          <td className="text-right py-2">{new Date(metric.timestamp).toLocaleTimeString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <p className="text-gray-500 text-center py-8">No metrics available for this type</p>
                )
              ) : (
                <p className="text-gray-500 text-center py-8">Select a metric type from the left panel</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 