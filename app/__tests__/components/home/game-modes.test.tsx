import React from 'react';
import { render, screen } from '@testing-library/react';
import { GameModes } from '@/app/components/home/game-modes';
import { ResponsiveUIProvider } from '@/app/contexts/responsive-ui-context';

// Mock next/link (external dependency)
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

describe('GameModes', () => {
  it('renders the game mode buttons', () => {
    renderWithProviders(<GameModes />);

    expect(screen.getByText('Daily Quiz')).toBeInTheDocument();
    expect(screen.getByText('Team Play')).toBeInTheDocument();
    expect(screen.getByText('Challenge')).toBeInTheDocument();
  });
  
  it('applies custom class names', () => {
    const customClass = 'custom-class';
    const { container } = renderWithProviders(<GameModes className={customClass} />);
    
    // Check if the custom class is applied
    const divElement = container.firstChild as HTMLElement;
    expect(divElement).toHaveClass(customClass);
  });
  
  it('links to the correct routes', () => {
    renderWithProviders(<GameModes />);
    
    // Get all links
    const links = screen.getAllByRole('link');
    
    // Verify the hrefs of the links
    expect(links[0]).toHaveAttribute('href', '/daily');
    expect(links[1]).toHaveAttribute('href', '/team');
    expect(links[2]).toHaveAttribute('href', '/challenge');
  });
}); 
