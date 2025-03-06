import React from 'react';
import { render, screen } from '@testing-library/react';
import { DashboardSidebar } from '@/app/components/navigation/dashboard-sidebar';
import { usePathname } from 'next/navigation';

// Mock the next/navigation module
jest.mock('next/navigation', () => ({
  usePathname: jest.fn(),
}));

describe('DashboardSidebar', () => {
  beforeEach(() => {
    // Reset mocks before each test
    (usePathname as jest.Mock).mockReset();
  });

  it('renders the sidebar with title and description', () => {
    // Mock the current path
    (usePathname as jest.Mock).mockReturnValue('/dashboard');
    
    render(<DashboardSidebar />);
    
    // Check for title and description
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Manage your trivia journey')).toBeInTheDocument();
  });

  it('renders all navigation items', () => {
    // Mock the current path
    (usePathname as jest.Mock).mockReturnValue('/dashboard');
    
    render(<DashboardSidebar />);
    
    // Check for all navigation items
    expect(screen.getByText('Overview')).toBeInTheDocument();
    expect(screen.getByText('Statistics')).toBeInTheDocument();
    expect(screen.getByText('Achievements')).toBeInTheDocument();
    expect(screen.getByText('Teams')).toBeInTheDocument();
    expect(screen.getByText('Daily Challenges')).toBeInTheDocument();
    expect(screen.getByText('Settings')).toBeInTheDocument();
    expect(screen.getByText('Help & Support')).toBeInTheDocument();
  });

  it('highlights the active navigation item', () => {
    // Mock the current path to be the dashboard
    (usePathname as jest.Mock).mockReturnValue('/dashboard');
    
    const { rerender } = render(<DashboardSidebar />);
    
    // Get all navigation links
    const overviewLink = screen.getByText('Overview').closest('a');
    const statsLink = screen.getByText('Statistics').closest('a');
    
    // Check that the Overview link has the active class
    expect(overviewLink).toHaveClass('bg-primary/10');
    expect(statsLink).not.toHaveClass('bg-primary/10');
    
    // Change the active path and rerender
    (usePathname as jest.Mock).mockReturnValue('/dashboard/stats');
    rerender(<DashboardSidebar />);
    
    // Check that the Stats link now has the active class
    expect(overviewLink).not.toHaveClass('bg-primary/10');
    expect(statsLink).toHaveClass('bg-primary/10');
  });

  it('renders correct links for each navigation item', () => {
    // Mock the current path
    (usePathname as jest.Mock).mockReturnValue('/dashboard');
    
    render(<DashboardSidebar />);
    
    // Check that each navigation item has the correct href
    expect(screen.getByText('Overview').closest('a')).toHaveAttribute('href', '/dashboard');
    expect(screen.getByText('Statistics').closest('a')).toHaveAttribute('href', '/dashboard/stats');
    expect(screen.getByText('Achievements').closest('a')).toHaveAttribute('href', '/dashboard/achievements');
    expect(screen.getByText('Teams').closest('a')).toHaveAttribute('href', '/team');
    expect(screen.getByText('Daily Challenges').closest('a')).toHaveAttribute('href', '/daily');
    expect(screen.getByText('Settings').closest('a')).toHaveAttribute('href', '/settings');
    expect(screen.getByText('Help & Support').closest('a')).toHaveAttribute('href', '/help');
  });
}); 