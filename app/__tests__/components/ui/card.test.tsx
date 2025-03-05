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
  it('renders Card with className', () => {
    render(<Card className="test-class" data-testid="card">Card Content</Card>);
    
    const card = screen.getByTestId('card');
    expect(card).toBeInTheDocument();
    expect(card).toHaveClass('test-class');
    expect(card).toHaveClass('rounded-lg');
    expect(card).toHaveClass('border');
    expect(card).toHaveClass('bg-card');
    expect(card).toHaveTextContent('Card Content');
  });
  
  it('renders CardHeader with className', () => {
    render(<CardHeader className="test-class" data-testid="card-header">Header Content</CardHeader>);
    
    const header = screen.getByTestId('card-header');
    expect(header).toBeInTheDocument();
    expect(header).toHaveClass('test-class');
    expect(header).toHaveClass('flex');
    expect(header).toHaveClass('flex-col');
    expect(header).toHaveClass('space-y-1.5');
    expect(header).toHaveClass('p-6');
    expect(header).toHaveTextContent('Header Content');
  });
  
  it('renders CardTitle with className', () => {
    render(<CardTitle className="test-class" data-testid="card-title">Title Content</CardTitle>);
    
    const title = screen.getByTestId('card-title');
    expect(title).toBeInTheDocument();
    expect(title).toHaveClass('test-class');
    expect(title).toHaveClass('text-2xl');
    expect(title).toHaveClass('font-semibold');
    expect(title).toHaveTextContent('Title Content');
  });
  
  it('renders CardDescription with className', () => {
    render(<CardDescription className="test-class" data-testid="card-description">Description Content</CardDescription>);
    
    const description = screen.getByTestId('card-description');
    expect(description).toBeInTheDocument();
    expect(description).toHaveClass('test-class');
    expect(description).toHaveClass('text-sm');
    expect(description).toHaveClass('text-muted-foreground');
    expect(description).toHaveTextContent('Description Content');
  });
  
  it('renders CardContent with className', () => {
    render(<CardContent className="test-class" data-testid="card-content">Content</CardContent>);
    
    const content = screen.getByTestId('card-content');
    expect(content).toBeInTheDocument();
    expect(content).toHaveClass('test-class');
    expect(content).toHaveClass('p-6');
    expect(content).toHaveClass('pt-0');
    expect(content).toHaveTextContent('Content');
  });
  
  it('renders CardFooter with className', () => {
    render(<CardFooter className="test-class" data-testid="card-footer">Footer Content</CardFooter>);
    
    const footer = screen.getByTestId('card-footer');
    expect(footer).toBeInTheDocument();
    expect(footer).toHaveClass('test-class');
    expect(footer).toHaveClass('flex');
    expect(footer).toHaveClass('items-center');
    expect(footer).toHaveClass('p-6');
    expect(footer).toHaveClass('pt-0');
    expect(footer).toHaveTextContent('Footer Content');
  });
  
  it('renders a complete card with all subcomponents', () => {
    render(
      <Card data-testid="complete-card">
        <CardHeader>
          <CardTitle>Card Title</CardTitle>
          <CardDescription>Card Description</CardDescription>
        </CardHeader>
        <CardContent>Card Content</CardContent>
        <CardFooter>Card Footer</CardFooter>
      </Card>
    );
    
    const card = screen.getByTestId('complete-card');
    expect(card).toBeInTheDocument();
    expect(card).toHaveTextContent('Card Title');
    expect(card).toHaveTextContent('Card Description');
    expect(card).toHaveTextContent('Card Content');
    expect(card).toHaveTextContent('Card Footer');
  });
  
  it('passes additional props to Card', () => {
    render(<Card data-testid="card" aria-label="Test Card" role="region">Card Content</Card>);
    
    const card = screen.getByTestId('card');
    expect(card).toHaveAttribute('aria-label', 'Test Card');
    expect(card).toHaveAttribute('role', 'region');
  });
}); 