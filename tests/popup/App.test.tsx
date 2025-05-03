import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import App from '../../src/popup/App'; // Use relative path
import { toast } from 'sonner';

// Mock the toast function
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
  },
  Toaster: vi.fn(() => <div data-testid="mock-toaster" />),
}));

describe('Popup Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the popup with all accessibility options', () => {
    render(<App />);
    
    // Check the title
    expect(screen.getByText('Accessibility Booster')).toBeInTheDocument();
    
    // Check all the toggle options are present
    expect(screen.getByText('High Contrast')).toBeInTheDocument();
    expect(screen.getByText('Dyslexia Font')).toBeInTheDocument();
    expect(screen.getByText('Keyboard-Only Nav')).toBeInTheDocument();
    expect(screen.getByText('Reduced Motion')).toBeInTheDocument();
    expect(screen.getByText('Ai Alt-text')).toBeInTheDocument();
    
    // Check the note at the bottom - UPDATED TEXT HERE
    expect(screen.getByText('High Contrast is now functional. Other toggles coming soon.')).toBeInTheDocument();
    
    // Check all switches are rendered
    const switches = screen.getAllByRole('switch');
    expect(switches.length).toBe(5);
  });

  it('toggles High Contrast mode and shows toast', () => {
    // Mock the Chrome API to return success
    (chrome.runtime.sendMessage as unknown as ReturnType<typeof vi.fn>).mockImplementation(
      (message, callback) => {
        if (callback && typeof callback === 'function') {
          callback({ status: "success" });
        }
        return true;
      }
    );

    render(<App />);
    
    // Find the High Contrast switch
    const switches = screen.getAllByRole('switch');
    const highContrastSwitch = switches[0];
    
    // Initially unchecked
    expect(highContrastSwitch.getAttribute('data-state')).toBe('unchecked');
    
    // Click the switch
    fireEvent.click(highContrastSwitch);
    
    // Should now be checked
    expect(highContrastSwitch.getAttribute('data-state')).toBe('checked');
    
    // Check if the toast was shown
    expect(toast.success).toHaveBeenCalledWith('High Contrast mode enabled!');
  });

  it('toggles Dyslexia Font and shows toast', () => {
    render(<App />);
    
    const switches = screen.getAllByRole('switch');
    const dyslexiaSwitch = switches[1];
    
    fireEvent.click(dyslexiaSwitch);
    
    expect(dyslexiaSwitch.getAttribute('data-state')).toBe('checked');
    expect(toast.success).toHaveBeenCalledWith('Dyslexia Font toggled!');
  });

  it('toggles Keyboard-Only Nav and shows toast', () => {
    render(<App />);
    
    const switches = screen.getAllByRole('switch');
    const keyboardSwitch = switches[2];
    
    fireEvent.click(keyboardSwitch);
    
    expect(keyboardSwitch.getAttribute('data-state')).toBe('checked');
    expect(toast.success).toHaveBeenCalledWith('Keyboard-Only Nav toggled!');
  });

  it('toggles Reduced Motion and shows toast', () => {
    render(<App />);
    
    const switches = screen.getAllByRole('switch');
    const motionSwitch = switches[3];
    
    fireEvent.click(motionSwitch);
    
    expect(motionSwitch.getAttribute('data-state')).toBe('checked');
    expect(toast.success).toHaveBeenCalledWith('Reduced Motion toggled!');
  });

  it('toggles AI Alt-text and shows toast', () => {
    render(<App />);
    
    const switches = screen.getAllByRole('switch');
    const altTextSwitch = switches[4];
    
    fireEvent.click(altTextSwitch);
    
    expect(altTextSwitch.getAttribute('data-state')).toBe('checked');
    expect(toast.success).toHaveBeenCalledWith('Ai Alt-text toggled!');
  });

  it('can toggle all switches on and off', () => {
    render(<App />);
    
    const switches = screen.getAllByRole('switch');
    
    // Turn all on
    switches.forEach(switchEl => {
      fireEvent.click(switchEl);
      expect(switchEl.getAttribute('data-state')).toBe('checked');
    });
    
    // Turn all off
    switches.forEach(switchEl => {
      fireEvent.click(switchEl);
      expect(switchEl.getAttribute('data-state')).toBe('unchecked');
    });
  });
});