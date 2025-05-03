import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Switch } from '../../../src/components/ui/switch';

describe('Switch Component', () => {
  it('renders correctly', () => {
    render(<Switch aria-label="Test switch" />);
    const switchElement = screen.getByRole('switch', { name: 'Test switch' });
    expect(switchElement).toBeInTheDocument();
  });

  it('has unchecked state by default', () => {
    render(<Switch aria-label="Test switch" />);
    const switchElement = screen.getByRole('switch');
    expect(switchElement.getAttribute('data-state')).toBe('unchecked');
  });

  it('changes state when clicked', () => {
    render(<Switch aria-label="Test switch" />);
    const switchElement = screen.getByRole('switch');
    
    // Initially unchecked
    expect(switchElement.getAttribute('data-state')).toBe('unchecked');
    
    // Click the switch
    fireEvent.click(switchElement);
    
    // Now checked
    expect(switchElement.getAttribute('data-state')).toBe('checked');
  });

  it('calls onCheckedChange handler when toggled', () => {
    const handleChange = vi.fn();
    render(<Switch aria-label="Test switch" onCheckedChange={handleChange} />);
    
    const switchElement = screen.getByRole('switch');
    fireEvent.click(switchElement);
    
    expect(handleChange).toHaveBeenCalledTimes(1);
    expect(handleChange).toHaveBeenCalledWith(true);
  });

  it('respects checked prop', () => {
    render(<Switch aria-label="Test switch" checked />);
    const switchElement = screen.getByRole('switch');
    expect(switchElement.getAttribute('data-state')).toBe('checked');
  });

  it('applies custom className', () => {
    render(<Switch aria-label="Test switch" className="custom-class" />);
    const switchElement = screen.getByRole('switch');
    expect(switchElement).toHaveClass('custom-class');
  });
});