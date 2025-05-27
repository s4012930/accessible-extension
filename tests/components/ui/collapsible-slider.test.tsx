import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { CollapsibleSlider } from '../../../src/components/ui/collapsible-slider';

// Mock the Switch component to make testing easier
vi.mock('../../../src/components/ui/switch', () => ({
  Switch: ({ checked, onCheckedChange }) => (
    <button
      role="switch"
      data-state={checked ? 'checked' : 'unchecked'}
      aria-checked={checked}
      onClick={() => onCheckedChange(!checked)}
      data-testid="mock-switch"
    >
      Toggle
    </button>
  )
}));

// Mock Slider component
vi.mock('../../../src/components/ui/slider', () => ({
  Slider: ({ value, onValueChange, min, max }) => (
    <input
      type="range"
      role="slider"
      min={min}
      max={max}
      value={value[0]}
      onChange={(e) => onValueChange([parseInt(e.target.value)])}
      data-testid="mock-slider"
    />
  )
}));

// Mock icons
vi.mock('lucide-react', () => ({
  ChevronUp: () => <span data-testid="chevron-up">▲</span>,
  ChevronDown: () => <span data-testid="chevron-down">▼</span>
}));

describe('CollapsibleSlider Component', () => {
  const mockOnCheckedChange = vi.fn();
  const mockOnSliderChange = vi.fn();
  
  beforeEach(() => {
    mockOnCheckedChange.mockClear();
    mockOnSliderChange.mockClear();
  });

  it('renders with switch but hides slider when not expanded', () => {
    render(
      <CollapsibleSlider
        icon={<span>📏</span>}
        label="Test Slider"
        checked={true}
        sliderValue={50}
        min={0}
        max={100}
        step={1}
        onCheckedChange={mockOnCheckedChange}
        onSliderChange={mockOnSliderChange}
      />
    );

    // Label should be visible
    expect(screen.getByText('Test Slider')).toBeInTheDocument();
    
    // Switch should be visible and checked
    const switchElement = screen.getByTestId('mock-switch');
    expect(switchElement).toBeInTheDocument();
    expect(switchElement.getAttribute('data-state')).toBe('checked');
    
    // Slider should be hidden initially
    expect(screen.queryByTestId('mock-slider')).not.toBeInTheDocument();
    
    // Expand button should be visible
    expect(screen.getByTestId('chevron-down')).toBeInTheDocument();
  });

  it('shows slider when expanded', async () => {
    render(
      <CollapsibleSlider
        icon={<span>📏</span>}
        label="Test Slider"
        checked={true}
        sliderValue={50}
        min={0}
        max={100}
        step={1}
        onCheckedChange={mockOnCheckedChange}
        onSliderChange={mockOnSliderChange}
      />
    );

    // Click expand button
    const expandButton = screen.getByTestId('chevron-down').closest('button');
    if (expandButton) {
      fireEvent.click(expandButton);
    } else {
      throw new Error('Expand button not found');
    }
    
    // Slider should now be visible
    await waitFor(() => {
      expect(screen.getByTestId('mock-slider')).toBeInTheDocument();
    });
    
    // Chevron should now point up
    expect(screen.getByTestId('chevron-up')).toBeInTheDocument();
  });

  it('calls onCheckedChange when switch is clicked', () => {
    render(
      <CollapsibleSlider
        icon={<span>📏</span>}
        label="Test Slider"
        checked={true}
        sliderValue={50}
        min={0}
        max={100}
        step={1}
        onCheckedChange={mockOnCheckedChange}
        onSliderChange={mockOnSliderChange}
      />
    );

    // Click switch
    const switchElement = screen.getByTestId('mock-switch');
    fireEvent.click(switchElement);
    
    expect(mockOnCheckedChange).toHaveBeenCalledWith(false);
  });

  it('hides expand button and slider when unchecked', () => {
    render(
      <CollapsibleSlider
        icon={<span>📏</span>}
        label="Test Slider"
        checked={false}
        sliderValue={50}
        min={0}
        max={100}
        step={1}
        onCheckedChange={mockOnCheckedChange}
        onSliderChange={mockOnSliderChange}
      />
    );

    // Slider should be hidden
    expect(screen.queryByTestId('mock-slider')).not.toBeInTheDocument();
    
    // Expand button should be hidden
    expect(screen.queryByTestId('chevron-down')).not.toBeInTheDocument();
  });

  it('updates slider value and calls onSliderChange', async () => {
    render(
      <CollapsibleSlider
        icon={<span>📏</span>}
        label="Test Slider"
        checked={true}
        sliderValue={50}
        min={0}
        max={100}
        step={1}
        onCheckedChange={mockOnCheckedChange}
        onSliderChange={mockOnSliderChange}
      />
    );

    // Click expand button to show slider
    const expandButton = screen.getByTestId('chevron-down').closest('button');
    if (expandButton) {
      fireEvent.click(expandButton);
    } else {
      throw new Error('Expand button not found');
    }
    
    // Wait for slider to appear
    await waitFor(() => {
      expect(screen.getByTestId('mock-slider')).toBeInTheDocument();
    });
    
    // Change slider value
    const slider = screen.getByTestId('mock-slider');
    fireEvent.change(slider, { target: { value: '75' } });
    
    // Allow debounce to complete 
    await waitFor(() => {
      expect(mockOnSliderChange).toHaveBeenCalledWith(75);
    }, { timeout: 400 });
  });
});