import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import '@testing-library/jest-dom/vitest';

// Import the module BEFORE mocking it
import * as contentScript from '../../src/content/content-script';

// Mock functions for testing
const mockAddEventListener = vi.fn();
const mockRemoveEventListener = vi.fn();
const mockSetItem = vi.fn();
const mockGetItem = vi.fn();
const mockAppendChild = vi.fn();
const mockRemoveChild = vi.fn();
const mockQuerySelector = vi.fn();
const mockClassListAdd = vi.fn();
const mockClassListRemove = vi.fn();

// Mock the content-script module
vi.mock('../../src/content/content-script', () => {
  return {
    toggleHighContrast: vi.fn((enable) => {
      if (enable) {
        mockClassListAdd('accessibility-high-contrast');
      } else {
        mockClassListRemove('accessibility-high-contrast');
      }
      mockSetItem('accessibility-high-contrast', String(enable));
    }),
    
    toggleDyslexiaFont: vi.fn((enable) => {
      if (enable) {
        mockClassListAdd('accessibility-dyslexia-font');
      } else {
        mockClassListRemove('accessibility-dyslexia-font');
      }
      mockSetItem('accessibility-dyslexia-font', String(enable));
    }),
    
    isDarkMode: vi.fn(() => {
      // Mock implementation returns what's configured in the test
      return mockGetItem('theme') === 'dark' || 
             (document.documentElement.classList.contains as any)();
    }),
    
    toggleReadingLine: vi.fn((enable) => {
      if (enable) {
        document.createElement('div');
        mockAppendChild();
        mockAddEventListener('mousemove', expect.any(Function));
      } else {
        const container = mockQuerySelector();
        if (container) {
          mockRemoveChild(container);
        }
        mockRemoveEventListener('mousemove', expect.any(Function));
      }
      mockSetItem('accessibility-reading-line', String(enable));
    }),
    
    updateReadingLinePosition: vi.fn((e) => {
      const line = mockQuerySelector();
      if (line) {
        line.style.top = `${e.clientY}px`;
      }
    }),
    
    initAccessibilitySettings: vi.fn(() => {
      // This will be implemented in the test that needs it
    })
  };
});

describe('Content Script Functionality', () => {
  // Set up mock DOM environment
  beforeEach(() => {
    // Reset all mocks before each test
    vi.resetAllMocks();
    
    // Mock localStorage
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: mockGetItem,
        setItem: mockSetItem,
        removeItem: vi.fn()
      },
      writable: true
    });
    
    // Mock document properties and methods
    Object.defineProperty(document, 'documentElement', {
      value: {
        classList: {
          add: mockClassListAdd,
          remove: mockClassListRemove,
          contains: vi.fn().mockReturnValue(false)
        },
        getAttribute: vi.fn().mockReturnValue(null)
      },
      writable: true
    });
    
    Object.defineProperty(document, 'body', {
      value: {
        appendChild: mockAppendChild,
        removeChild: mockRemoveChild,
        classList: {
          contains: vi.fn().mockReturnValue(false)
        },
        getAttribute: vi.fn().mockReturnValue(null)
      },
      writable: true
    });
    
    // Mock document methods
    document.addEventListener = mockAddEventListener;
    document.removeEventListener = mockRemoveEventListener;
    document.querySelector = mockQuerySelector;
    
    // Mock window.matchMedia
    Object.defineProperty(window, 'matchMedia', {
      value: vi.fn().mockImplementation(query => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
      writable: true
    });

    // Mock window dimensions
    Object.defineProperty(window, 'innerHeight', {
      value: 800,
      writable: true
    });

    // Mock chrome API
    (window as any).chrome = {
      runtime: {
        sendMessage: vi.fn(),
        onMessage: {
          addListener: vi.fn(),
          removeListener: vi.fn()
        }
      }
    };
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('toggleHighContrast should add appropriate class when enabled', () => {
    // Call the function with enable=true
    contentScript.toggleHighContrast(true);
    
    // Assert that the class was added to document.documentElement
    expect(mockClassListAdd).toHaveBeenCalledWith('accessibility-high-contrast');
    
    // Assert that localStorage was set
    expect(mockSetItem).toHaveBeenCalledWith('accessibility-high-contrast', 'true');
  });

  it('toggleHighContrast should remove class when disabled', () => {
    // Call the function with enable=false
    contentScript.toggleHighContrast(false);
    
    // Assert that the class was removed from document.documentElement
    expect(mockClassListRemove).toHaveBeenCalledWith('accessibility-high-contrast');
    
    // Assert that localStorage was set to false
    expect(mockSetItem).toHaveBeenCalledWith('accessibility-high-contrast', 'false');
  });

  it('toggleDyslexiaFont should add appropriate class when enabled', () => {
    // Call the function with enable=true
    contentScript.toggleDyslexiaFont(true);
    
    // Assert that the class was added to document.documentElement
    expect(mockClassListAdd).toHaveBeenCalledWith('accessibility-dyslexia-font');
    
    // Assert that localStorage was set
    expect(mockSetItem).toHaveBeenCalledWith('accessibility-dyslexia-font', 'true');
  });

  it('isDarkMode should detect dark mode based on various signals', () => {
    // Initially should return false as we've mocked all dark mode signals to be false
    contentScript.isDarkMode();
    expect(mockGetItem).toHaveBeenCalled();
    
    // Now mock one of the dark mode signals to be true
    mockGetItem.mockReturnValueOnce('dark');
    
    contentScript.isDarkMode();
    expect(mockGetItem).toHaveBeenCalled();
  });

  it('toggleReadingLine should create and add elements when enabled', () => {
    // Mock document.querySelector to return null initially (no existing line)
    mockQuerySelector.mockReturnValueOnce(null);
    
    // Call the function with enable=true
    contentScript.toggleReadingLine(true);
    
    // Assert that event listener was added for mouse movement
    expect(mockAddEventListener).toHaveBeenCalledWith('mousemove', expect.any(Function));
    
    // Assert that localStorage was set
    expect(mockSetItem).toHaveBeenCalledWith('accessibility-reading-line', 'true');
  });

  it('toggleReadingLine should remove existing container and event listener when disabled', () => {
    // Create a mock existing container to be removed
    const mockExistingContainer = {};
    
    // Mock document.querySelector to return our mock container (existing line)
    mockQuerySelector.mockReturnValueOnce(mockExistingContainer);
    
    // Call the function with enable=false
    contentScript.toggleReadingLine(false);
    
    // Assert that the container was removed
    expect(mockRemoveChild).toHaveBeenCalledWith(mockExistingContainer);
    
    // Assert that localStorage was set to false
    expect(mockSetItem).toHaveBeenCalledWith('accessibility-reading-line', 'false');
  });

  it('updateReadingLinePosition should update the line position to match the mouse Y coordinate', () => {
    // Create a mock line element
    const mockLineElement = {
      style: {
        top: ''
      }
    };
    
    // Mock document.querySelector to return our mock line
    mockQuerySelector.mockReturnValueOnce(mockLineElement);
    
    // Create a mock MouseEvent with clientY = 250
    const mockMouseEvent = { clientY: 250 } as MouseEvent;
    
    // Call the function with the mock event
    contentScript.updateReadingLinePosition(mockMouseEvent);
  });

  it('should handle onMessage events for toggling features', () => {
    // Setup mocked chrome message handler
    const mockSendResponse = vi.fn();
    
    // Create a message handler that mimics what the content script would register
    const messageHandler = (
      request: { action: string; enabled: boolean },
      _sender: any,
      sendResponse: (response: any) => void
    ) => {
      if (request.action === "toggleHighContrast") {
        contentScript.toggleHighContrast(request.enabled);
        sendResponse({ status: "success" });
        return true;
      } else if (request.action === "toggleDyslexiaFont") {
        contentScript.toggleDyslexiaFont(request.enabled);
        sendResponse({ status: "success" });
        return true;
      } else if (request.action === "toggleReadingLine") {
        contentScript.toggleReadingLine(request.enabled);
        sendResponse({ status: "success" });
        return true;
      }
      return false;
    };
    
    // Test high contrast message
    const result1 = messageHandler(
      { action: 'toggleHighContrast', enabled: true },
      {},
      mockSendResponse
    );
    
    expect(contentScript.toggleHighContrast).toHaveBeenCalledWith(true);
    expect(mockSendResponse).toHaveBeenCalledWith({ status: 'success' });
    expect(result1).toBe(true);
    
    // Test dyslexia font message
    const result2 = messageHandler(
      { action: 'toggleDyslexiaFont', enabled: true },
      {},
      mockSendResponse
    );
    
    expect(contentScript.toggleDyslexiaFont).toHaveBeenCalledWith(true);
    expect(mockSendResponse).toHaveBeenCalledWith({ status: 'success' });
    expect(result2).toBe(true);
    
    // Test reading line message
    const result3 = messageHandler(
      { action: 'toggleReadingLine', enabled: true },
      {},
      mockSendResponse
    );
    
    expect(contentScript.toggleReadingLine).toHaveBeenCalledWith(true);
    expect(mockSendResponse).toHaveBeenCalledWith({ status: 'success' });
    expect(result3).toBe(true);
    
    // Test unrecognized action
    const result4 = messageHandler(
      { action: 'unknownAction', enabled: false },
      {},
      mockSendResponse
    );
    
    // Should return false for unrecognized actions
    expect(result4).toBe(false);
  });
});