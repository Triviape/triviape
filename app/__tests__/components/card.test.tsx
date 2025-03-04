import React from 'react';
import { render, screen } from '@testing-library/react';
import { 
  Card, 
  CardHeader, 
  CardFooter, 
  CardTitle, 
  CardDescription, 
  CardContent 
} from '@/app/components/ui/card';

describe('Card Component', () => {
  it('renders a basic card correctly', () => {
    render(
      <Card data-testid="card">
        <CardContent>Card Content</CardContent>
      </Card>
    );
    
    const card = screen.getByTestId('card');
    expect(card).toBeInTheDocument();
    expect(card).toHaveClass('rounded-lg');
    expect(card).toHaveClass('border');
    expect(card).toHaveClass('bg-card');
    expect(screen.getByText('Card Content')).toBeInTheDocument();
  });
  
  it('renders a complete card with all subcomponents', () => {
    render(
      <Card data-testid="card">
        <CardHeader data-testid="card-header">
          <CardTitle data-testid="card-title">Card Title</CardTitle>
          <CardDescription data-testid="card-description">Card Description</CardDescription>
        </CardHeader>
        <CardContent data-testid="card-content">Card Content</CardContent>
        <CardFooter data-testid="card-footer">Card Footer</CardFooter>
      </Card>
    );
    
    // Check all components are rendered
    expect(screen.getByTestId('card')).toBeInTheDocument();
    expect(screen.getByTestId('card-header')).toBeInTheDocument();
    expect(screen.getByTestId('card-title')).toBeInTheDocument();
    expect(screen.getByTestId('card-description')).toBeInTheDocument();
    expect(screen.getByTestId('card-content')).toBeInTheDocument();
    expect(screen.getByTestId('card-footer')).toBeInTheDocument();
    
    // Check text content
    expect(screen.getByText('Card Title')).toBeInTheDocument();
    expect(screen.getByText('Card Description')).toBeInTheDocument();
    expect(screen.getByText('Card Content')).toBeInTheDocument();
    expect(screen.getByText('Card Footer')).toBeInTheDocument();
  });
  
  it('applies custom className to Card', () => {
    render(
      <Card data-testid="card" className="custom-class">
        <CardContent>Content</CardContent>
      </Card>
    );
    
    expect(screen.getByTestId('card')).toHaveClass('custom-class');
  });
  
  it('applies custom className to CardHeader', () => {
    render(
      <Card>
        <CardHeader data-testid="header" className="custom-header">
          Header
        </CardHeader>
      </Card>
    );
    
    expect(screen.getByTestId('header')).toHaveClass('custom-header');
  });
  
  it('applies custom className to CardContent', () => {
    render(
      <Card>
        <CardContent data-testid="content" className="custom-content">
          Content
        </CardContent>
      </Card>
    );
    
    expect(screen.getByTestId('content')).toHaveClass('custom-content');
  });
  
  it('applies custom className to CardFooter', () => {
    render(
      <Card>
        <CardFooter data-testid="footer" className="custom-footer">
          Footer
        </CardFooter>
      </Card>
    );
    
    expect(screen.getByTestId('footer')).toHaveClass('custom-footer');
  });
});