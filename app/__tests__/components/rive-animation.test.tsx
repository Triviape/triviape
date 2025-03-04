import React from 'react';
import { render, screen, act } from '@testing-library/react';
import { RiveAnimation } from '@/app/components/animation/rive-animation';
import { ResponsiveUIProvider } from '@/app/contexts/responsive-ui-context';

// Mock the Rive library
jest.mock('@rive-app/react-canvas', () => {
  return {
    useRive: jest.fn().mockImplementation(({ onLoad }) => {
      // Call onLoad callback to simulate successful animation loading
      if (onLoad) {
        setTimeout(() => onLoad(), 0);
      }
      
      return {
        rive: {
          on: jest.fn(),
          off: jest.fn(),
        },
        RiveComponent: () => <div data-testid="rive-component">Rive Animation Mock</div>,
      };
    }),
    useStateMachineInput: jest.fn().mockImplementation(() => ({
      value: false,
      fire: jest.fn(),
    })),
    Layout: jest.fn().mockImplementation(() => ({})),
    Fit: {
      Contain: 'Contain',
      Cover: 'Cover',
      Fill: 'Fill',
      FitWidth: 'FitWidth',
      FitHeight: 'FitHeight',
      None: 'None',
      ScaleDown: 'ScaleDown',
    },
    Alignment: {
      Center: 'Center',
      TopLeft: 'TopLeft',
      TopCenter: 'TopCenter',
      TopRight: 'TopRight',
      CenterLeft: 'CenterLeft',
      CenterRight: 'CenterRight',
      BottomLeft: 'BottomLeft',
      BottomCenter: 'BottomCenter',
      BottomRight: 'BottomRight',
    },
  };
});

// Mock the useBenchmark hook
jest.mock('@/app/hooks/performance/useBenchmark', () => ({
  useBenchmark: jest.fn().mockReturnValue({
    renderTimeMs: 0,
    frameDrops: 0,
    renderCount: 0,
    isPerformant: true
  })
}));

// Mock the responsive UI context
jest.mock('@/app/contexts/responsive-ui-context', () => {
  const original = jest.requireActual('@/app/contexts/responsive-ui-context');
  return {
    ...original,
    useResponsiveUI: jest.fn().mockReturnValue({
      deviceInfo: {
        isMobile: false,
        isTablet: false,
        isDesktop: true,
        screenSize: 'medium',
        supportsTouch: false,
        devicePerformance: 'high',
      },
      isTouch: false,
      uiScale: 'regular',
      animationLevel: 'full',
      setAnimationLevel: jest.fn(),
      setUIScale: jest.fn(),
    }),
  };
});

// We need a proper testing wrapper with the responsive UI context
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <ResponsiveUIProvider>
      {children}
    </ResponsiveUIProvider>
  );
};

describe('RiveAnimation Component', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.spyOn(console, 'error').mockImplementation(() => {}); // Suppress expected console errors
    jest.spyOn(console, 'log').mockImplementation(() => {}); // Suppress logs
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.clearAllMocks();
    (console.error as jest.Mock).mockRestore();
    (console.log as jest.Mock).mockRestore();
  });

  test('renders rive animation correctly', () => {
    render(
      <TestWrapper>
        <RiveAnimation 
          src="/test-animation.riv"
          width={200}
          height={200}
        />
      </TestWrapper>
    );
    
    // Advance timers to trigger the onLoad callback
    act(() => {
      jest.advanceTimersByTime(100);
    });
    
    const riveComponent = screen.getByTestId('rive-component');
    expect(riveComponent).toBeInTheDocument();
    expect(riveComponent).toHaveTextContent('Rive Animation Mock');
  });
  
  test('renders fallback image when loading fails', () => {
    // Mock useRive to return null rive instance
    const useRiveMock = require('@rive-app/react-canvas').useRive;
    useRiveMock.mockReturnValueOnce({
      rive: null,
      RiveComponent: () => null,
    });
    
    render(
      <TestWrapper>
        <RiveAnimation 
          src="/test-animation.riv"
          fallbackImageSrc="/fallback.png"
          width={200}
          height={200}
        />
      </TestWrapper>
    );
    
    // Advance timers to trigger the error detection timeout
    act(() => {
      jest.advanceTimersByTime(6000);
    });
    
    // Force a re-render to reflect the state change after the timeout
    render(
      <TestWrapper>
        <RiveAnimation 
          src="/test-animation.riv"
          fallbackImageSrc="/fallback.png"
          width={200}
          height={200}
        />
      </TestWrapper>
    );
    
    // Check for the fallback image
    const fallbackImg = screen.getByAltText('Animation fallback');
    expect(fallbackImg).toBeInTheDocument();
    expect(fallbackImg).toHaveAttribute('src', '/fallback.png');
  });
  
  test('applies correct dimensions based on props', () => {
    render(
      <TestWrapper>
        <RiveAnimation 
          src="/test-animation.riv"
          width={300}
          height={200}
        />
      </TestWrapper>
    );
    
    const container = screen.getByTestId('rive-component').parentElement;
    expect(container).toHaveStyle('width: 300px');
    expect(container).toHaveStyle('height: 200px');
  });
}); 