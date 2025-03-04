"use client";

import React from 'react';
import { render, screen } from '@testing-library/react';
import { AppLayout } from '@/app/components/layouts/app-layout';
import { ResponsiveUIProvider } from '@/app/contexts/responsive-ui-context';

// Mock the responsive UI context
jest.mock('@/app/contexts/responsive-ui-context', () => ({
  useResponsiveUI: () => ({
    deviceInfo: {
      isMobile: false,
      isTablet: false,
      isDesktop: true,
      screenSize: 'large',
    },
  }),
  ResponsiveUIProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

describe('AppLayout Component', () => {
  it('renders children correctly', () => {
    render(
      <ResponsiveUIProvider>
        <AppLayout>
          <div data-testid="content">Content</div>
        </AppLayout>
      </ResponsiveUIProvider>
    );
    
    expect(screen.getByTestId('content')).toBeInTheDocument();
    expect(screen.getByText('Content')).toBeInTheDocument();
  });
  
  it('renders header when provided', () => {
    render(
      <ResponsiveUIProvider>
        <AppLayout
          header={<div data-testid="header">Header</div>}
        >
          <div>Content</div>
        </AppLayout>
      </ResponsiveUIProvider>
    );
    
    expect(screen.getByTestId('header')).toBeInTheDocument();
    expect(screen.getByText('Header')).toBeInTheDocument();
  });
  
  it('renders footer when provided', () => {
    render(
      <ResponsiveUIProvider>
        <AppLayout
          footer={<div data-testid="footer">Footer</div>}
        >
          <div>Content</div>
        </AppLayout>
      </ResponsiveUIProvider>
    );
    
    expect(screen.getByTestId('footer')).toBeInTheDocument();
    expect(screen.getByText('Footer')).toBeInTheDocument();
  });
  
  it('renders sidebar when provided and showSidebar is true', () => {
    render(
      <ResponsiveUIProvider>
        <AppLayout
          sidebar={<div data-testid="sidebar">Sidebar</div>}
          showSidebar={true}
        >
          <div>Content</div>
        </AppLayout>
      </ResponsiveUIProvider>
    );
    
    expect(screen.getByTestId('sidebar')).toBeInTheDocument();
    expect(screen.getByText('Sidebar')).toBeInTheDocument();
  });
  
  it('does not render sidebar when showSidebar is false', () => {
    render(
      <ResponsiveUIProvider>
        <AppLayout
          sidebar={<div data-testid="sidebar">Sidebar</div>}
          showSidebar={false}
        >
          <div>Content</div>
        </AppLayout>
      </ResponsiveUIProvider>
    );
    
    expect(screen.queryByTestId('sidebar')).not.toBeInTheDocument();
    expect(screen.queryByText('Sidebar')).not.toBeInTheDocument();
  });
  
  it('applies custom className', () => {
    const { container } = render(
      <ResponsiveUIProvider>
        <AppLayout
          className="custom-class"
        >
          <div>Content</div>
        </AppLayout>
      </ResponsiveUIProvider>
    );
    
    const layout = container.firstChild as HTMLElement;
    expect(layout).toHaveClass('custom-class');
  });
  
  it('applies custom contentClassName', () => {
    render(
      <ResponsiveUIProvider>
        <AppLayout
          contentClassName="custom-content-class"
        >
          <div>Content</div>
        </AppLayout>
      </ResponsiveUIProvider>
    );
    
    // Find the main element which should have the contentClassName
    const main = document.querySelector('main');
    expect(main).toHaveClass('custom-content-class');
  });
}); 