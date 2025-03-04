import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from '@/app/components/ui/button';
import { ResponsiveUIProvider } from '@/app/contexts/responsive-ui-context';

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

// Wrapper to provide necessary context
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <ResponsiveUIProvider>
      {children}
    </ResponsiveUIProvider>
  );
};

describe('Button Component', () => {
  test('renders correctly with default props', () => {
    render(
      <TestWrapper>
        <Button>Click me</Button>
      </TestWrapper>
    );
    
    const button = screen.getByRole('button', { name: /click me/i });
    expect(button).toBeInTheDocument();
    expect(button).toHaveClass('bg-primary'); // Check for default variant styling
  });
  
  test('applies different variants correctly', () => {
    render(
      <TestWrapper>
        <Button variant="destructive">Destructive</Button>
      </TestWrapper>
    );
    
    const button = screen.getByRole('button', { name: /destructive/i });
    expect(button).toHaveClass('bg-destructive');
  });
  
  test('applies different sizes correctly', () => {
    render(
      <TestWrapper>
        <Button size="sm">Small</Button>
      </TestWrapper>
    );
    
    const button = screen.getByRole('button', { name: /small/i });
    expect(button).toHaveClass('h-9'); // Updated to match the actual class in the component
  });
  
  test('shows loading state when isLoading is true', () => {
    render(
      <TestWrapper>
        <Button isLoading>Loading</Button>
      </TestWrapper>
    );
    
    // Check that some loading indicator is present
    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
    // Check for loading spinner text instead of SVG
    expect(button).toHaveTextContent('⧗');
  });
  
  test('handles click events', () => {
    const handleClick = jest.fn();
    
    render(
      <TestWrapper>
        <Button onClick={handleClick}>Click Me</Button>
      </TestWrapper>
    );
    
    const button = screen.getByRole('button', { name: /click me/i });
    fireEvent.click(button);
    
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
  
  test('does not trigger onClick when disabled', () => {
    const handleClick = jest.fn();
    
    render(
      <TestWrapper>
        <Button onClick={handleClick} disabled>Disabled</Button>
      </TestWrapper>
    );
    
    const button = screen.getByRole('button', { name: /disabled/i });
    fireEvent.click(button);
    
    expect(handleClick).not.toHaveBeenCalled();
    expect(button).toBeDisabled();
  });
  
  test('renders with left and right icons', () => {
    render(
      <TestWrapper>
        <Button 
          leftIcon={<span data-testid="left-icon">L</span>}
          rightIcon={<span data-testid="right-icon">R</span>}
        >
          With Icons
        </Button>
      </TestWrapper>
    );
    
    expect(screen.getByTestId('left-icon')).toBeInTheDocument();
    expect(screen.getByTestId('right-icon')).toBeInTheDocument();
  });
}); 