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
          componentName: 'memo(TestComponent)',
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
    
    it('should not add development props outside development mode', () => {
      // Store the original NODE_ENV
      const originalNodeEnv = process.env.NODE_ENV;
      
      try {
        // NODE_ENV is "test" in Jest runtime; this should not add dev attributes.
        (process.env as any).NODE_ENV = 'test';
        
        // Create a memoized component
        const MemoizedComponent = memoWithPerf(TestComponent, {
          name: 'TestComponent'
        });
        
        // Render the component
        render(<MemoizedComponent text="Dev Mode" />);
        
        // Render-count attribute should not be injected in test mode.
        const component = screen.getByTestId('test-component');
        expect(component).not.toHaveAttribute('data-render-count');
      } finally {
        // Restore the original NODE_ENV
        (process.env as any).NODE_ENV = originalNodeEnv;
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
      render(
        <MeasureRenders id="TestMeasure" onRender={jest.fn()}>
          <TestComponent text="Measured" />
        </MeasureRenders>
      );

      expect(screen.getByTestId('test-component')).toHaveTextContent('Measured');
    });
    
    it('should call onRender when provided', () => {
      const mockOnRender = jest.fn();
      render(
        <MeasureRenders id="TestRenders" onRender={mockOnRender}>
          <div>Test</div>
        </MeasureRenders>
      );

      expect(mockOnRender).toHaveBeenCalled();
      expect(mockOnRender.mock.calls[0][0]).toBe('TestRenders');
    });
  });
});
