"use client";

import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Input } from '@/app/components/ui/input';
import { ResponsiveUIProvider } from '@/app/contexts/responsive-ui-context';

// Mock the responsive UI context
jest.mock('@/app/contexts/responsive-ui-context', () => ({
  useResponsiveUI: () => ({
    isTouch: false,
    deviceInfo: {
      devicePerformance: 'high',
    },
  }),
  ResponsiveUIProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

describe('Input Component', () => {
  it('renders a basic input correctly', () => {
    render(
      <ResponsiveUIProvider>
        <Input data-testid="input" placeholder="Enter text" />
      </ResponsiveUIProvider>
    );
    
    const input = screen.getByTestId('input');
    expect(input).toBeInTheDocument();
    expect(input).toHaveAttribute('placeholder', 'Enter text');
  });
  
  it('applies custom className', () => {
    render(
      <ResponsiveUIProvider>
        <Input data-testid="input" className="custom-class" />
      </ResponsiveUIProvider>
    );
    
    expect(screen.getByTestId('input')).toHaveClass('custom-class');
  });
  
  it('handles user input correctly', async () => {
    render(
      <ResponsiveUIProvider>
        <Input data-testid="input" />
      </ResponsiveUIProvider>
    );
    
    const input = screen.getByTestId('input');
    await userEvent.type(input, 'Hello World');
    
    expect(input).toHaveValue('Hello World');
  });
  
  it('displays error message when provided', () => {
    render(
      <ResponsiveUIProvider>
        <Input data-testid="input" error="This field is required" />
      </ResponsiveUIProvider>
    );
    
    expect(screen.getByText('This field is required')).toBeInTheDocument();
    expect(screen.getByTestId('input')).toHaveClass('border-destructive');
  });
  
  it('renders with left icon', () => {
    render(
      <ResponsiveUIProvider>
        <Input 
          data-testid="input" 
          leftIcon={<span data-testid="left-icon">🔍</span>} 
        />
      </ResponsiveUIProvider>
    );
    
    expect(screen.getByTestId('left-icon')).toBeInTheDocument();
    expect(screen.getByTestId('input')).toHaveClass('pl-10');
  });
  
  it('renders with right icon', () => {
    render(
      <ResponsiveUIProvider>
        <Input 
          data-testid="input" 
          rightIcon={<span data-testid="right-icon">✓</span>} 
        />
      </ResponsiveUIProvider>
    );
    
    expect(screen.getByTestId('right-icon')).toBeInTheDocument();
    expect(screen.getByTestId('input')).toHaveClass('pr-10');
  });
  
  it('passes through HTML attributes', () => {
    render(
      <ResponsiveUIProvider>
        <Input 
          data-testid="input" 
          type="password"
          disabled
          required
          maxLength={10}
        />
      </ResponsiveUIProvider>
    );
    
    const input = screen.getByTestId('input');
    expect(input).toHaveAttribute('type', 'password');
    expect(input).toBeDisabled();
    expect(input).toBeRequired();
    expect(input).toHaveAttribute('maxLength', '10');
  });
}); 