import React from 'react';
import { render, screen } from '@testing-library/react';
import { memoWithPerf, withPerformanceProfile, MeasureRenders } from '@/app/lib/componentUtils';

// Mock the usePerformanceMonitor hook
jest.mock('@/app/hooks/performance/usePerformanceMonitor', () => ({
  usePerformanceMonitor: jest.fn(),
}));

// Simple test component
const TestComponent = ({ text }: { text: string }) => {
  return <div data-testid="test-component">{text}</div>;
};

describe('Component Utils', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  describe('memoWithPerf', () => {
    it('should create a memoized component', () => {
      // Get the mocked hook
      const { usePerformanceMonitor } = require('@/app/hooks/performance/usePerformanceMonitor');
      
      // Create a memoized component
      const MemoizedComponent = memoWithPerf(TestComponent, {
        name: 'TestComponent',
        trackRenders: true,
        warnAfterRenders: 3
      });
      
      // Render the component
      render(<MemoizedComponent text="Hello" />);
      
      // Check that the performance monitor was called
      expect(usePerformanceMonitor).toHaveBeenCalledWith(
        expect.objectContaining({
          componentName: 'memo(TestComponent)',
          trackRenders: true,
          logWarningAfterRenders: 3,
          enabled: true
        })
      );
      
      // Check that the component rendered correctly
      expect(screen.getByTestId('test-component')).toHaveTextContent('Hello');
    });
    
    it('should use default options when not provided', () => {
      // Get the mocked hook
      const { usePerformanceMonitor } = require('@/app/hooks/performance/usePerformanceMonitor');
      
      // Create a memoized component with no options
      const MemoizedComponent = memoWithPerf(TestComponent);
      
      // Render the component
      render(<MemoizedComponent text="Default Options" />);
      
      // Check that the performance monitor was called with default options
      expect(usePerformanceMonitor).toHaveBeenCalledWith(
        expect.objectContaining({
          componentName: 'memo(Component)',
          trackRenders: true,
          logWarningAfterRenders: 5,
          enabled: true
        })
      );
    });
    
    it('should use component name when provided', () => {
      // Get the mocked hook
      const { usePerformanceMonitor } = require('@/app/hooks/performance/usePerformanceMonitor');
      
      // Create a component with displayName
      const NamedComponent = ({ text }: { text: string }) => <div>{text}</div>;
      NamedComponent.displayName = 'CustomName';
      
      // Create a memoized component
      const MemoizedComponent = memoWithPerf(NamedComponent);
      
      // Render the component
      render(<MemoizedComponent text="Named Component" />);
      
      // Check that the performance monitor used the component's display name
      expect(usePerformanceMonitor).toHaveBeenCalledWith(
        expect.objectContaining({
          componentName: 'memo(CustomName)'
        })
      );
    });
    
    it('should add development props in dev mode', () => {
      // Store the original NODE_ENV
      const originalNodeEnv = process.env.NODE_ENV;
      
      try {
        // Set to development mode
        process.env.NODE_ENV = 'development';
        
        // Create a memoized component
        const MemoizedComponent = memoWithPerf(TestComponent, {
          name: 'TestComponent'
        });
        
        // Render the component
        render(<MemoizedComponent text="Dev Mode" />);
        
        // Check that the component has the render count data attribute
        const component = screen.getByTestId('test-component');
        expect(component.parentElement).toHaveAttribute('data-render-count', '1');
      } finally {
        // Restore the original NODE_ENV
        process.env.NODE_ENV = originalNodeEnv;
      }
    });
  });
  
  describe('withPerformanceProfile', () => {
    it('should wrap a component with performance monitoring', () => {
      // Get the mocked hook
      const { usePerformanceMonitor } = require('@/app/hooks/performance/usePerformanceMonitor');
      
      // Create a profiled component
      const ProfiledComponent = withPerformanceProfile(TestComponent, 'ProfiledTest');
      
      // Render the component
      render(<ProfiledComponent text="Profiled" />);
      
      // Check that the performance monitor was called
      expect(usePerformanceMonitor).toHaveBeenCalledWith({
        componentName: 'ProfiledTest',
        trackRenders: true,
        trackTimeOnScreen: true
      });
      
      // Check that the component rendered correctly
      expect(screen.getByTestId('test-component')).toHaveTextContent('Profiled');
    });
  });
  
  describe('MeasureRenders', () => {
    it('should render children inside a Profiler', () => {
      // Mock React.Profiler
      const originalProfiler = React.Profiler;
      const mockProfilerOnRender = jest.fn();
      
      // Replace React.Profiler temporarily
      jest.spyOn(React, 'Profiler').mockImplementation(({ id, onRender, children }) => {
        if (onRender) {
          mockProfilerOnRender(id);
        }
        return <>{children}</>;
      });
      
      try {
        // Render with the MeasureRenders component
        render(
          <MeasureRenders id="TestMeasure" onRender={jest.fn()}>
            <TestComponent text="Measured" />
          </MeasureRenders>
        );
        
        // Check that the Profiler was called with the correct ID
        expect(mockProfilerOnRender).toHaveBeenCalledWith('TestMeasure');
        
        // Check that the children rendered correctly
        expect(screen.getByTestId('test-component')).toHaveTextContent('Measured');
      } finally {
        // Restore React.Profiler
        (React.Profiler as any).mockRestore();
      }
    });
    
    it('should call onRender when provided', () => {
      // Mock console.debug to verify logging
      const originalDebug = console.debug;
      console.debug = jest.fn();
      
      // Store the original NODE_ENV
      const originalNodeEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';
      
      try {
        // Create a mock onRender callback
        const mockOnRender = jest.fn();
        
        // Get the handleRender function by rendering and calling it directly
        render(
          <MeasureRenders id="TestRenders" onRender={mockOnRender}>
            <div>Test</div>
          </MeasureRenders>
        );
        
        // Simulate a render callback
        const handleRender = (React.Profiler as any).mock.calls[0][0].onRender;
        handleRender('TestRenders', 'mount', 5.5, 10.2, 100, 120);
        
        // Check that onRender was called with the right parameters
        expect(mockOnRender).toHaveBeenCalledWith(
          'TestRenders', 
          'mount', 
          5.5, 
          10.2, 
          100, 
          120
        );
        
        // Check that console.debug was called in development mode
        expect(console.debug).toHaveBeenCalled();
      } finally {
        // Restore console.debug
        console.debug = originalDebug;
        
        // Restore NODE_ENV
        process.env.NODE_ENV = originalNodeEnv;
        
        // Restore React.Profiler
        (React.Profiler as any).mockRestore();
      }
    });
  });
}); 