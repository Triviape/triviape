import React from 'react';
import { render, screen } from '@testing-library/react';
import { ResponsiveContainer } from '@/app/components/layouts/responsive-container';
import { ResponsiveUIProvider } from '@/app/contexts/responsive-ui-context';

// Mock the responsive UI hook
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

// We still need the provider for context consistency
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <ResponsiveUIProvider>
      {children}
    </ResponsiveUIProvider>
  );
};

describe('ResponsiveContainer Component', () => {
  test('renders children correctly', () => {
    render(
      <TestWrapper>
        <ResponsiveContainer>
          <div data-testid="test-child">Child Content</div>
        </ResponsiveContainer>
      </TestWrapper>
    );
    
    const child = screen.getByTestId('test-child');
    expect(child).toBeInTheDocument();
    expect(child).toHaveTextContent('Child Content');
  });
  
  test('applies correct padding based on prop', () => {
    const { container, rerender } = render(
      <TestWrapper>
        <ResponsiveContainer padding="lg" data-testid="container">
          <div>Content</div>
        </ResponsiveContainer>
      </TestWrapper>
    );
    
    // Get the root container div (the actual ResponsiveContainer component)
    const rootDiv = container.firstChild as HTMLElement;
    expect(rootDiv).toHaveClass('px-5');
    expect(rootDiv).toHaveClass('py-6');
    
    rerender(
      <TestWrapper>
        <ResponsiveContainer padding="sm" data-testid="container">
          <div>Content</div>
        </ResponsiveContainer>
      </TestWrapper>
    );
    
    expect(rootDiv).toHaveClass('px-2');
    expect(rootDiv).toHaveClass('py-2');
  });
  
  test('applies correct max width based on prop', () => {
    const { container } = render(
      <TestWrapper>
        <ResponsiveContainer maxWidth="xs">
          <div>Content</div>
        </ResponsiveContainer>
      </TestWrapper>
    );
    
    // Get the root container div
    const rootDiv = container.firstChild as HTMLElement;
    expect(rootDiv).toHaveClass('max-w-[320px]');
  });
  
  test('centers content when centerContent is true', () => {
    const { container } = render(
      <TestWrapper>
        <ResponsiveContainer centerContent>
          <div>Content</div>
        </ResponsiveContainer>
      </TestWrapper>
    );
    
    // Get the root container div
    const rootDiv = container.firstChild as HTMLElement;
    expect(rootDiv).toHaveClass('items-center');
    expect(rootDiv).toHaveClass('flex');
    expect(rootDiv).toHaveClass('flex-col');
  });
  
  test('renders with custom element type', () => {
    const { container } = render(
      <TestWrapper>
        <ResponsiveContainer as="section">
          <div>Content</div>
        </ResponsiveContainer>
      </TestWrapper>
    );
    
    // Check that the root element is a section
    const rootElement = container.firstChild as HTMLElement;
    expect(rootElement.tagName.toLowerCase()).toBe('section');
  });
  
  test('applies touch optimizations for touch devices', () => {
    // Override the mock to simulate a touch device
    const useResponsiveUI = require('@/app/contexts/responsive-ui-context').useResponsiveUI;
    useResponsiveUI.mockReturnValueOnce({
      deviceInfo: {
        isMobile: true,
        isTablet: false,
        isDesktop: false,
        screenSize: 'small',
        supportsTouch: true,
        devicePerformance: 'medium',
      },
      isTouch: true,
      uiScale: 'compact',
      animationLevel: 'reduced',
      setAnimationLevel: jest.fn(),
      setUIScale: jest.fn(),
    });
    
    const { container } = render(
      <TestWrapper>
        <ResponsiveContainer>
          <div>Content</div>
        </ResponsiveContainer>
      </TestWrapper>
    );
    
    // Get the root container div
    const rootDiv = container.firstChild as HTMLElement;
    expect(rootDiv).toHaveClass('touch-manipulation');
  });
}); 