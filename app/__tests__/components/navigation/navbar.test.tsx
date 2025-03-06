import React from 'react';
import { render, screen } from '@testing-library/react';
import { Navbar } from '@/app/components/navigation/navbar';
import { ResponsiveUIProvider } from '@/app/contexts/responsive-ui-context';

// Mock the button component to avoid ResponsiveUI dependency
jest.mock('@/app/components/ui/button', () => {
  return {
    Button: ({ children, className, ...props }: any) => (
      <button className={className} {...props}>{children}</button>
    ),
  };
});

// Mock the useAuth hook
jest.mock('@/app/hooks/useAuth', () => ({
  useAuth: () => ({
    currentUser: null,
    signOut: {
      mutate: jest.fn(),
      isLoading: false,
      isSuccess: false,
      isError: false,
      error: null,
    },
  }),
}));

// Mock next/link since it causes issues in tests
jest.mock('next/link', () => {
  return ({ children, href }: { children: React.ReactNode; href: string }) => {
    return <a href={href}>{children}</a>;
  };
});

const renderWithProviders = (ui: React.ReactElement) => {
  return render(
    <ResponsiveUIProvider>
      {ui}
    </ResponsiveUIProvider>
  );
};

describe('Navbar', () => {
  it('renders the logo and navigation buttons', () => {
    renderWithProviders(<Navbar />);
    
    // Check for the brand name
    expect(screen.getByText('Triviape')).toBeInTheDocument();
    
    // Check for the share button
    expect(screen.getByText('Share')).toBeInTheDocument();
    
    // Check for the sign in/up button
    expect(screen.getByText('Sign In/Up')).toBeInTheDocument();
  });
  
  it('applies custom class names', () => {
    const customClass = 'custom-class';
    const { container } = renderWithProviders(<Navbar className={customClass} />);
    
    // Check if the custom class is applied
    const navElement = container.querySelector('nav');
    expect(navElement).toHaveClass(customClass);
  });
}); 