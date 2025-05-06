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
    error: vi.fn(),
    info: vi.fn(),
    loading: vi.fn(),
  },
  Toaster: vi.fn(() => <div data-testid="mock-toaster" />),
}));

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value.toString();
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
  };
})();
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

// Mock Chrome API
const chromeMock = {
  runtime: {
    sendMessage: vi.fn().mockImplementation((message, callback) => {
      if (callback && typeof callback === 'function') {
        callback({ status: "success" });
      }
      return true;
    }),
    onMessage: {
      addListener: vi.fn(),
      removeListener: vi.fn()
    }
  },
};
Object.defineProperty(window, 'chrome', { value: chromeMock });

describe('Popup Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.clear();
  });

  it('renders the popup with all accessibility options', () => {
    render(<App />);
    
    // Check the title
    expect(screen.getByText('Accessibility Booster')).toBeInTheDocument();
    
    // Check section headers
    expect(screen.getByText('Vision Support')).toBeInTheDocument();
    expect(screen.getByText('Motor Support')).toBeInTheDocument();
    expect(screen.getByText('Cognitive Support')).toBeInTheDocument();
    expect(screen.getByText('Miscellaneous')).toBeInTheDocument();
    
    // Check some of the toggle options are present
    expect(screen.getByText('High Contrast')).toBeInTheDocument();
    expect(screen.getByText('Dyslexia Font')).toBeInTheDocument();
    expect(screen.getByText('Keyboard-Only Nav')).toBeInTheDocument();
    expect(screen.getByText('Reduced Motion')).toBeInTheDocument();
    expect(screen.getByText('AI Alt-text')).toBeInTheDocument();
    
    // Check all switches are rendered (14 in total)
    const switches = screen.getAllByRole('switch');
    expect(switches.length).toBe(14);
  });

  it('toggles High Contrast mode and shows toast', () => {
    render(<App />);
    
    // Find the High Contrast switch (first one in Vision Support)
    const highContrastSwitch = screen.getAllByRole('switch')[0];
    
    // Initially unchecked
    expect(highContrastSwitch.getAttribute('data-state')).toBe('unchecked');
    
    // Click the switch
    fireEvent.click(highContrastSwitch);
    
    // Should now be checked
    expect(highContrastSwitch.getAttribute('data-state')).toBe('checked');
    
    // Check if the toast was shown
    expect(toast.success).toHaveBeenCalledWith('High Contrast mode enabled!', { id: 'feature-toggle' });
    
    // It should have enabled dark mode
    expect(localStorageMock.setItem).toHaveBeenCalledWith('theme', 'dark');
    expect(localStorageMock.setItem).toHaveBeenCalledWith('darkModeByHighContrast', 'true');
  });

  it('toggles Dyslexia Font and shows toast', () => {
    render(<App />);
    
    // Find the Dyslexia Font switch (second one in Vision Support)
    const dyslexiaSwitch = screen.getAllByRole('switch')[1];
    
    fireEvent.click(dyslexiaSwitch);
    
    expect(dyslexiaSwitch.getAttribute('data-state')).toBe('checked');
    expect(toast.success).toHaveBeenCalledWith('Dyslexia Font enabled!', { id: 'feature-toggle' });
  });

  it('toggles Keyboard-Only Nav and shows toast', () => {
    render(<App />);
    
    // Find the Keyboard-Only Nav switch (first one in Motor Support)
    const keyboardSwitch = screen.getAllByRole('switch')[6]; 
    
    fireEvent.click(keyboardSwitch);
    
    expect(keyboardSwitch.getAttribute('data-state')).toBe('checked');
    expect(toast.success).toHaveBeenCalledWith('Keyboard-Only Nav enabled!', { id: 'feature-toggle' });
  });

  it('toggles Reduced Motion and shows toast', () => {
    render(<App />);
    
    // Find the Reduced Motion switch (third one in Vision Support)
    const motionSwitch = screen.getAllByRole('switch')[2];
    
    fireEvent.click(motionSwitch);
    
    expect(motionSwitch.getAttribute('data-state')).toBe('checked');
    expect(toast.success).toHaveBeenCalledWith('Reduced Motion enabled!', { id: 'feature-toggle' });
  });

  it('toggles AI Alt-text and shows toast', () => {
    render(<App />);
    
    // Find the AI Alt-text switch (only one in Miscellaneous)
    const altTextSwitch = screen.getAllByRole('switch')[13];
    
    fireEvent.click(altTextSwitch);
    
    expect(altTextSwitch.getAttribute('data-state')).toBe('checked');
    expect(toast.success).toHaveBeenCalledWith('AI Alt-text enabled!', { id: 'feature-toggle' });
  });

  it('dark mode toggle works correctly', () => {
    render(<App />);
    
    // Find the dark mode toggle button
    const darkModeButton = screen.getByRole('button', { name: 'Toggle dark mode' });
    
    // Click the dark mode button
    fireEvent.click(darkModeButton);
    
    // It should update localStorage
    expect(localStorageMock.setItem).toHaveBeenCalledWith('theme', 'dark');
    expect(localStorageMock.removeItem).toHaveBeenCalledWith('darkModeByHighContrast');
  });

  it('disabling high contrast reverts dark mode if it was enabled by high contrast', () => {
    // Set up initial conditions - high contrast is already enabled
    localStorageMock.setItem('darkModeByHighContrast', 'true');
    localStorageMock.setItem('theme', 'dark');
    
    // Mock the Chrome API to return that high contrast is enabled
    (chrome.runtime.sendMessage as unknown as ReturnType<typeof vi.fn>).mockImplementation(
      (message, callback) => {
        if (message && message.action === "getState") {
          callback({ highContrast: true });
        } else if (callback && typeof callback === 'function') {
          callback({ status: "success" });
        }
        return true;
      }
    );

    const { rerender } = render(<App />);
    
    // Clear previous mock calls from setup
    vi.clearAllMocks();
    
    // Find the High Contrast switch - it should be checked because of our localStorage setup
    const switches = screen.getAllByRole('switch');
    const highContrastSwitch = switches[0]; 
    
    // Simulate clicking to disable high contrast
    fireEvent.click(highContrastSwitch);
    
    // Check the message was sent to disable high contrast
    expect(chrome.runtime.sendMessage).toHaveBeenCalledWith(
      expect.objectContaining({ 
        action: "toggleFeature", 
        feature: "highContrast", 
        enabled: false 
      }), 
      expect.any(Function)
    );
    
    const lastCall = (chrome.runtime.sendMessage as unknown as ReturnType<typeof vi.fn>).mock.calls[0];
    const callback = lastCall[1];
    callback({ status: "success" });
    
    rerender(<App />);
    
    // Now check localStorage operations after the callback is processed
    expect(localStorageMock.setItem).toHaveBeenCalledWith('theme', 'light');
    expect(localStorageMock.removeItem).toHaveBeenCalledWith('darkModeByHighContrast');
    expect(toast.success).toHaveBeenCalledWith('High Contrast mode disabled!', { id: 'feature-toggle' });
  });
  
  it('renders the Turn All Off button', () => {
    render(<App />);
    
    // Check the button is in the document
    const turnOffButton = screen.getByRole('button', { name: /turn all off/i });
    expect(turnOffButton).toBeInTheDocument();
    expect(turnOffButton).toHaveTextContent('Turn All Off');
    expect(turnOffButton).toHaveClass('bg-red-600');
  });
  
  it('clicking Turn All Off button sends correct message and updates UI', () => {
    // Setup: mock state where some features are enabled
    (chrome.runtime.sendMessage as unknown as ReturnType<typeof vi.fn>).mockImplementation(
      (message, callback) => {
        if (message && message.action === "getState") {
          callback({ 
            highContrast: true, 
            dyslexiaFont: true,
            readingLine: true,
            textScaling: { enabled: true, value: 120 },
            lineHeight: { enabled: true, value: 2.0 } 
          });
        } else if (message && message.action === "turnOffAll") {
          callback({ 
            status: "success",
            state: {
              highContrast: false,
              dyslexiaFont: false,
              readingLine: false,
              textScaling: { enabled: false, value: 100 },
              lineHeight: { enabled: false, value: 1.5 }
            }
          });
        } else if (callback && typeof callback === 'function') {
          callback({ status: "success" });
        }
        return true;
      }
    );
    
    // Set dark mode as enabled by high contrast
    localStorageMock.setItem('darkModeByHighContrast', 'true');
    localStorageMock.setItem('theme', 'dark');
    
    const { rerender } = render(<App />);
    
    // Clear previous mock calls from setup
    vi.clearAllMocks();
    
    // Find and click the Turn All Off button
    const turnOffButton = screen.getByRole('button', { name: /turn all off/i });
    fireEvent.click(turnOffButton);
    
    // Verify the loading toast was shown
    expect(toast.loading).toHaveBeenCalledWith('Turning off all features...', { id: 'feature-toggle' });
    
    // Check the correct message was sent to the background script
    expect(chrome.runtime.sendMessage).toHaveBeenCalledWith(
      { action: "turnOffAll" }, 
      expect.any(Function)
    );
    
    // Simulate callback response
    rerender(<App />);
    
    // Check success toast was shown
    expect(toast.success).toHaveBeenCalledWith('All accessibility features turned off', { id: 'feature-toggle' });
    
    // Verify dark mode was reset if it was set by high contrast
    expect(localStorageMock.setItem).toHaveBeenCalledWith('theme', 'light');
    expect(localStorageMock.removeItem).toHaveBeenCalledWith('darkModeByHighContrast');
    
    // Check all switches are unchecked after turning everything off
    const switches = screen.getAllByRole('switch');
    for (const switchEl of switches) {
      expect(switchEl.getAttribute('data-state')).toBe('unchecked');
    }
  });
});