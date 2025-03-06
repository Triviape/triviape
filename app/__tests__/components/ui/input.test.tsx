import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { Input } from '@/app/components/ui/input';
import { ResponsiveUIProvider } from '@/app/contexts/responsive-ui-context';

// Wrap component with necessary providers
const renderWithProviders = (ui: React.ReactElement) => {
  return render(
    <ResponsiveUIProvider>
      {ui}
    </ResponsiveUIProvider>
  );
};

describe('Input Component', () => {
  it('renders correctly with default props', () => {
    renderWithProviders(<Input placeholder="Enter text" data-testid="input" />);
    
    const input = screen.getByTestId('input');
    expect(input).toBeInTheDocument();
    expect(input).toHaveAttribute('placeholder', 'Enter text');
    expect(input).toHaveClass('border');
    expect(input).toHaveClass('rounded-md');
  });
  
  it('applies custom className', () => {
    renderWithProviders(<Input className="custom-class" data-testid="input" />);
    
    const input = screen.getByTestId('input');
    expect(input).toHaveClass('custom-class');
  });
  
  it('handles different input types', () => {
    const { rerender } = renderWithProviders(<Input type="text" data-testid="input" />);
    expect(screen.getByTestId('input')).toHaveAttribute('type', 'text');
    
    rerender(<Input type="password" data-testid="input" />);
    expect(screen.getByTestId('input')).toHaveAttribute('type', 'password');
    
    rerender(<Input type="email" data-testid="input" />);
    expect(screen.getByTestId('input')).toHaveAttribute('type', 'email');
    
    rerender(<Input type="number" data-testid="input" />);
    expect(screen.getByTestId('input')).toHaveAttribute('type', 'number');
  });
  
  it('displays error message when error prop is provided', () => {
    renderWithProviders(<Input error="This field is required" data-testid="input" />);
    
    const input = screen.getByTestId('input');
    expect(input).toHaveClass('border-destructive');
    
    const errorMessage = screen.getByText('This field is required');
    expect(errorMessage).toBeInTheDocument();
    expect(errorMessage).toHaveClass('text-destructive');
  });
  
  it('renders with left icon', () => {
    renderWithProviders(
      <Input 
        leftIcon={<span data-testid="left-icon">🔍</span>} 
        data-testid="input" 
      />
    );
    
    const input = screen.getByTestId('input');
    const leftIcon = screen.getByTestId('left-icon');
    
    expect(leftIcon).toBeInTheDocument();
    expect(input).toHaveClass('pl-10');
  });
  
  it('renders with right icon', () => {
    renderWithProviders(
      <Input 
        rightIcon={<span data-testid="right-icon">✓</span>} 
        data-testid="input" 
      />
    );
    
    const input = screen.getByTestId('input');
    const rightIcon = screen.getByTestId('right-icon');
    
    expect(rightIcon).toBeInTheDocument();
    expect(input).toHaveClass('pr-10');
  });
  
  it('renders with both left and right icons', () => {
    renderWithProviders(
      <Input 
        leftIcon={<span data-testid="left-icon">🔍</span>}
        rightIcon={<span data-testid="right-icon">✓</span>} 
        data-testid="input" 
      />
    );
    
    const input = screen.getByTestId('input');
    const leftIcon = screen.getByTestId('left-icon');
    const rightIcon = screen.getByTestId('right-icon');
    
    expect(leftIcon).toBeInTheDocument();
    expect(rightIcon).toBeInTheDocument();
    expect(input).toHaveClass('pl-10');
    expect(input).toHaveClass('pr-10');
  });
  
  it('handles disabled state', () => {
    renderWithProviders(<Input disabled data-testid="input" />);
    
    const input = screen.getByTestId('input');
    expect(input).toBeDisabled();
    expect(input).toHaveClass('disabled:opacity-50');
  });
  
  it('handles value changes', () => {
    renderWithProviders(<Input data-testid="input" />);
    
    const input = screen.getByTestId('input');
    fireEvent.change(input, { target: { value: 'test value' } });
    
    expect(input).toHaveValue('test value');
  });
  
  it('calls onChange handler when value changes', () => {
    const handleChange = jest.fn();
    renderWithProviders(<Input onChange={handleChange} data-testid="input" />);
    
    const input = screen.getByTestId('input');
    fireEvent.change(input, { target: { value: 'test value' } });
    
    expect(handleChange).toHaveBeenCalledTimes(1);
  });
  
  it('forwards ref to the input element', () => {
    const ref = React.createRef<HTMLInputElement>();
    renderWithProviders(<Input ref={ref} data-testid="input" />);
    
    expect(ref.current).not.toBeNull();
    expect(ref.current).toEqual(screen.getByTestId('input'));
  });
}); 