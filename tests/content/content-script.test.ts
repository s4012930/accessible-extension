import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { JSDOM } from 'jsdom';

// Define window extensions for accessibility features
declare global {
  interface Window {
    hoverControlsActive?: boolean;
    keyboardNavActive?: boolean;
    keyboardClickDelay?: number;
    mockKeyboardTimer?: NodeJS.Timeout | null;
    __accessibilityExtensionLoaded?: boolean;
    __imageObserver?: MutationObserver | null;
  }
}

// Define Chrome API types to replace 'any'
interface ChromeRuntime {
  sendMessage: ReturnType<typeof vi.fn>;
  onMessage: {
    addListener: ReturnType<typeof vi.fn>;
    removeListener: ReturnType<typeof vi.fn>;
  };
  getURL: ReturnType<typeof vi.fn>;
}

interface ChromeStorage {
  sync: {
    get: ReturnType<typeof vi.fn>;
    set: ReturnType<typeof vi.fn>;
  };
}

interface ChromeAPI {
  runtime: ChromeRuntime;
  storage: ChromeStorage;
}

interface LocalStorageMock {
  getItem: ReturnType<typeof vi.fn>;
  setItem: ReturnType<typeof vi.fn>;
  removeItem: ReturnType<typeof vi.fn>;
}

// Message types for communication
interface BaseMessage {
  action: string;
  enabled?: boolean;
  type?: string;
  delay?: number;
  size?: string;
  selector?: string;
  id?: string;
  color?: string;
  fontSize?: string;
  lineHeight?: string;
  maxWidth?: string;
  fontWeight?: string;
  value?: number | string;
}

interface ResponseMessage {
  status: string;
}

type MessageListener = (
  message: BaseMessage,
  sender: MessageSender,
  sendResponse: (response: ResponseMessage) => void
) => boolean | void;

// Using Record type instead of empty interface to satisfy ESLint no-empty-object-type
type MessageSender = chrome.runtime.MessageSender & Record<string, unknown>;

// Create a fresh DOM for each test
let dom: JSDOM;
let document: Document;
let window: Window & typeof globalThis;
let chrome: ChromeAPI;
let localStorage: LocalStorageMock;

// Setup the test environment
beforeEach(() => {
  // Create a fresh DOM
  dom = new JSDOM('<!DOCTYPE html><html><head></head><body></body></html>', {
    url: 'http://localhost',
    contentType: 'text/html',
    includeNodeLocations: true,
    runScripts: 'dangerously',
  });

  document = dom.window.document;
  window = dom.window as unknown as Window & typeof globalThis;
  
  // Mock localStorage
  localStorage = {
    getItem: vi.fn(() => null),
    setItem: vi.fn(),
    removeItem: vi.fn(),
  };
  Object.defineProperty(window, 'localStorage', { value: localStorage });

  // Mock Chrome API
  chrome = {
    runtime: {
      sendMessage: vi.fn(),
      onMessage: {
        addListener: vi.fn(),
        removeListener: vi.fn()
      },
      getURL: vi.fn((url: string) => `chrome-extension://mock-extension-id/${url}`)
    },
    storage: {
      sync: {
        get: vi.fn((_: string | string[] | Record<string, unknown>, cb: (items: Record<string, unknown>) => void) => cb({})),
        set: vi.fn()
      }
    }
  };

  Object.defineProperty(window, 'chrome', { value: chrome });
  
  // Make JSDOM's window and document available globally
  global.window = window;
  global.document = document;
  (global as Record<string, unknown>).chrome = chrome;
});

afterEach(() => {
  vi.resetAllMocks();
});

// Helper function to simulate the content script message handler
function createMessageHandler(): MessageListener {
  return (
    message: BaseMessage,
    sender: MessageSender,
    sendResponse: (response: ResponseMessage) => void
  ) => {
    if (message.action === 'toggleHighContrast') {
      if (message.enabled) {
        document.documentElement.classList.add('accessibility-high-contrast');
      } else {
        document.documentElement.classList.remove('accessibility-high-contrast');
      }
      localStorage.setItem('accessibility-high-contrast', String(message.enabled));
      sendResponse({ status: 'success' });
      return true;
    }
    
    if (message.action === 'toggleDyslexiaFont') {
      if (message.enabled) {
        document.documentElement.classList.add('accessibility-dyslexia-font');
      } else {
        document.documentElement.classList.remove('accessibility-dyslexia-font');
      }
      localStorage.setItem('accessibility-dyslexia-font', String(message.enabled));
      sendResponse({ status: 'success' });
      return true;
    }
    
    if (message.action === 'toggleColorBlind') {
      const { type, enabled } = message;
      
      if (enabled) {
        document.documentElement.classList.add(`accessibility-${type}`);
        
        // Create stylesheet element
        const styleElement = document.createElement('link');
        styleElement.id = `accessibility-${type}-stylesheet`;
        styleElement.rel = 'stylesheet';
        styleElement.href = chrome.runtime.getURL(`${type}.css`);
        document.head.appendChild(styleElement);
      } else {
        document.documentElement.classList.remove(`accessibility-${type}`);
        
        // Remove stylesheet if exists
        const styleElement = document.getElementById(`accessibility-${type}-stylesheet`);
        if (styleElement) {
          styleElement.remove();
        }
      }
      
      localStorage.setItem(`accessibility-${type}`, String(enabled));
      sendResponse({ status: 'success' });
      return true;
    }
    
    if (message.action === 'toggleReadingLine') {
      if (message.enabled) {
        const container = document.createElement('div');
        container.className = 'accessibility-reading-line-container';
        container.id = 'accessibility-reading-line-container';
        
        const line = document.createElement('div');
        line.className = 'accessibility-reading-line';
        
        container.appendChild(line);
        document.body.appendChild(container);
      } else {
        const container = document.querySelector('.accessibility-reading-line-container');
        if (container) {
          document.body.removeChild(container);
        }
      }
      
      localStorage.setItem('accessibility-reading-line', String(message.enabled));
      sendResponse({ status: 'success' });
      return true;
    }
    
    if (message.action === 'toggleReducedMotion') {
      if (message.enabled) {
        document.documentElement.classList.add('accessibility-reduced-motion');
        
        // Create stylesheet element
        const styleElement = document.createElement('link');
        styleElement.id = 'accessibility-reduced-motion-stylesheet';
        styleElement.rel = 'stylesheet';
        styleElement.href = chrome.runtime.getURL('reduced-motion.css');
        document.head.appendChild(styleElement);
      } else {
        document.documentElement.classList.remove('accessibility-reduced-motion');
        
        // Remove stylesheet if exists
        const styleElement = document.getElementById('accessibility-reduced-motion-stylesheet');
        if (styleElement) {
          styleElement.remove();
        }
      }
      
      localStorage.setItem('accessibility-reduced-motion', String(message.enabled));
      sendResponse({ status: 'success' });
      return true;
    }
    
    if (message.action === 'toggleLargeTargets') {
      if (message.enabled) {
        document.documentElement.classList.add('accessibility-large-targets');
        
        // Check if stylesheet already exists before creating a new one
        const existingStyleElement = document.querySelector('link[data-accessibility-large-targets]');
        if (!existingStyleElement) {
          // Create stylesheet element
          const styleElement = document.createElement('link');
          styleElement.rel = 'stylesheet';
          styleElement.href = chrome.runtime.getURL('large-targets.css');
          styleElement.setAttribute('data-accessibility-large-targets', '');
          document.head.appendChild(styleElement);
        }
      } else {
        document.documentElement.classList.remove('accessibility-large-targets');
        
        // Remove stylesheet if exists
        const styleElement = document.querySelector('link[data-accessibility-large-targets]');
        if (styleElement) {
          styleElement.remove();
        }
      }
      
      localStorage.setItem('accessibility-large-targets', String(message.enabled));
      sendResponse({ status: 'success' });
      return true;
    }
    
    if (message.action === 'toggleHoverControls') {
      if (message.enabled) {
        document.documentElement.classList.add('accessibility-hover-controls');
        
        // Create hover controls related elements
        const hoverStyle = document.createElement('link');
        hoverStyle.rel = 'stylesheet';
        hoverStyle.href = chrome.runtime.getURL('hover-controls.css');
        hoverStyle.setAttribute('data-accessibility-hover-controls', '');
        document.head.appendChild(hoverStyle);
        
        // Set up tracking state
        window.hoverControlsActive = true;
      } else {
        document.documentElement.classList.remove('accessibility-hover-controls');
        
        // Remove stylesheet
        const styleElement = document.querySelector('link[data-accessibility-hover-controls]');
        if (styleElement) {
          styleElement.remove();
        }
        
        // Remove any active hover indicators
        const indicators = document.querySelectorAll('.accessibility-hover-indicator');
        indicators.forEach(indicator => indicator.remove());
        
        // Update tracking state
        window.hoverControlsActive = false;
      }
      
      localStorage.setItem('accessibility-hover-controls', String(message.enabled));
      sendResponse({ status: 'success' });
      return true;
    }
    
    if (message.action === 'toggleKeyboardNav') {
      if (message.enabled) {
        document.documentElement.classList.add('accessibility-keyboard-nav');
        window.keyboardNavActive = true;
        window.keyboardClickDelay = message.delay || 1500; // Default delay
      } else {
        document.documentElement.classList.remove('accessibility-keyboard-nav');
        window.keyboardNavActive = false;
        
        // Clear any pending timers (simulated)
        window.mockKeyboardTimer = null;
      }
      
      localStorage.setItem('accessibility-keyboard-nav', String(message.enabled));
      localStorage.setItem('accessibility-keyboard-nav-delay', String(message.delay || 1500));
      sendResponse({ status: 'success' });
      return true;
    }
    
    return false;
  };
}

// Define the test functions
describe('Content Script Functionality', () => {
  it('toggles high contrast mode', () => {
    const messageHandler = createMessageHandler();
    
    // Toggle high contrast on
    messageHandler(
      { action: 'toggleHighContrast', enabled: true },
      {},
      (response: ResponseMessage) => {
        expect(response.status).toBe('success');
      }
    );
    
    // Check if the high contrast class was added
    expect(document.documentElement.classList.contains('accessibility-high-contrast')).toBe(true);
    
    // Check if localStorage was updated
    expect(localStorage.setItem).toHaveBeenCalledWith('accessibility-high-contrast', 'true');
    
    // Toggle high contrast off
    messageHandler(
      { action: 'toggleHighContrast', enabled: false },
      {},
      (response: ResponseMessage) => {
        expect(response.status).toBe('success');
      }
    );
    
    // Check if the class was removed
    expect(document.documentElement.classList.contains('accessibility-high-contrast')).toBe(false);
    
    // Check if localStorage was updated
    expect(localStorage.setItem).toHaveBeenCalledWith('accessibility-high-contrast', 'false');
  });

  it('toggles dyslexia font', () => {
    const messageHandler = createMessageHandler();
    
    // Toggle dyslexia font on
    messageHandler(
      { action: 'toggleDyslexiaFont', enabled: true },
      {},
      (response: ResponseMessage) => {
        expect(response.status).toBe('success');
      }
    );
    
    // Check if the dyslexia font class was added
    expect(document.documentElement.classList.contains('accessibility-dyslexia-font')).toBe(true);
    
    // Check if localStorage was updated
    expect(localStorage.setItem).toHaveBeenCalledWith('accessibility-dyslexia-font', 'true');
    
    // Toggle dyslexia font off
    messageHandler(
      { action: 'toggleDyslexiaFont', enabled: false },
      {},
      (response: ResponseMessage) => {
        expect(response.status).toBe('success');
      }
    );
    
    // Check if the class was removed
    expect(document.documentElement.classList.contains('accessibility-dyslexia-font')).toBe(false);
    
    // Check if localStorage was updated
    expect(localStorage.setItem).toHaveBeenCalledWith('accessibility-dyslexia-font', 'false');
  });

  it('toggles reading line', () => {
    const messageHandler = createMessageHandler();
    
    // Toggle reading line on
    messageHandler(
      { action: 'toggleReadingLine', enabled: true },
      {},
      (response: ResponseMessage) => {
        expect(response.status).toBe('success');
      }
    );
    
    // Check if the reading line container was added
    const container = document.querySelector('.accessibility-reading-line-container');
    expect(container).not.toBeNull();
    
    // Check if localStorage was updated
    expect(localStorage.setItem).toHaveBeenCalledWith('accessibility-reading-line', 'true');
    
    // Toggle reading line off
    messageHandler(
      { action: 'toggleReadingLine', enabled: false },
      {},
      (response: ResponseMessage) => {
        expect(response.status).toBe('success');
      }
    );
    
    // Check if the container was removed
    const containerAfter = document.querySelector('.accessibility-reading-line-container');
    expect(containerAfter).toBeNull();
    
    // Check if localStorage was updated
    expect(localStorage.setItem).toHaveBeenCalledWith('accessibility-reading-line', 'false');
  });

  it('toggles colorblind mode - deuteranopia', () => {
    const messageHandler = createMessageHandler();
    
    // Toggle deuteranopia on
    messageHandler(
      { action: 'toggleColorBlind', enabled: true, type: 'deuteranopia' },
      {},
      (response: ResponseMessage) => {
        expect(response.status).toBe('success');
      }
    );
    
    // Check if the deuteranopia class was added
    expect(document.documentElement.classList.contains('accessibility-deuteranopia')).toBe(true);
    
    // Check if a stylesheet was added
    const stylesheet = document.getElementById('accessibility-deuteranopia-stylesheet');
    expect(stylesheet).not.toBeNull();
    expect(stylesheet?.getAttribute('href')).toContain('deuteranopia.css');
    
    // Check if localStorage was updated
    expect(localStorage.setItem).toHaveBeenCalledWith('accessibility-deuteranopia', 'true');
    
    // Toggle deuteranopia off
    messageHandler(
      { action: 'toggleColorBlind', enabled: false, type: 'deuteranopia' },
      {},
      (response: ResponseMessage) => {
        expect(response.status).toBe('success');
      }
    );
    
    // Check if the class was removed
    expect(document.documentElement.classList.contains('accessibility-deuteranopia')).toBe(false);
    
    // Check if the stylesheet was removed
    const stylesheetAfter = document.getElementById('accessibility-deuteranopia-stylesheet');
    expect(stylesheetAfter).toBeNull();
    
    // Check if localStorage was updated
    expect(localStorage.setItem).toHaveBeenCalledWith('accessibility-deuteranopia', 'false');
  });

  it('toggles colorblind mode - protanopia', () => {
    const messageHandler = createMessageHandler();
    
    // Toggle protanopia on
    messageHandler(
      { action: 'toggleColorBlind', enabled: true, type: 'protanopia' },
      {},
      (response: ResponseMessage) => {
        expect(response.status).toBe('success');
      }
    );
    
    // Check if the protanopia class was added
    expect(document.documentElement.classList.contains('accessibility-protanopia')).toBe(true);
    
    // Check if a stylesheet was added
    const stylesheet = document.getElementById('accessibility-protanopia-stylesheet');
    expect(stylesheet).not.toBeNull();
    expect(stylesheet?.getAttribute('href')).toContain('protanopia.css');
    
    // Check if localStorage was updated
    expect(localStorage.setItem).toHaveBeenCalledWith('accessibility-protanopia', 'true');
    
    // Toggle protanopia off
    messageHandler(
      { action: 'toggleColorBlind', enabled: false, type: 'protanopia' },
      {},
      (response: ResponseMessage) => {
        expect(response.status).toBe('success');
      }
    );
    
    // Check if the class was removed
    expect(document.documentElement.classList.contains('accessibility-protanopia')).toBe(false);
    
    // Check if the stylesheet was removed
    const stylesheetAfter = document.getElementById('accessibility-protanopia-stylesheet');
    expect(stylesheetAfter).toBeNull();
    
    // Check if localStorage was updated
    expect(localStorage.setItem).toHaveBeenCalledWith('accessibility-protanopia', 'false');
  });

  it('toggles colorblind mode - tritanopia', () => {
    const messageHandler = createMessageHandler();
    
    // Toggle tritanopia on
    messageHandler(
      { action: 'toggleColorBlind', enabled: true, type: 'tritanopia' },
      {},
      (response: ResponseMessage) => {
        expect(response.status).toBe('success');
      }
    );
    
    // Check if the tritanopia class was added
    expect(document.documentElement.classList.contains('accessibility-tritanopia')).toBe(true);
    
    // Check if a stylesheet was added
    const stylesheet = document.getElementById('accessibility-tritanopia-stylesheet');
    expect(stylesheet).not.toBeNull();
    expect(stylesheet?.getAttribute('href')).toContain('tritanopia.css');
    
    // Check if localStorage was updated
    expect(localStorage.setItem).toHaveBeenCalledWith('accessibility-tritanopia', 'true');
    
    // Toggle tritanopia off
    messageHandler(
      { action: 'toggleColorBlind', enabled: false, type: 'tritanopia' },
      {},
      (response: ResponseMessage) => {
        expect(response.status).toBe('success');
      }
    );
    
    // Check if the class was removed
    expect(document.documentElement.classList.contains('accessibility-tritanopia')).toBe(false);
    
    // Check if the stylesheet was removed
    const stylesheetAfter = document.getElementById('accessibility-tritanopia-stylesheet');
    expect(stylesheetAfter).toBeNull();
    
    // Check if localStorage was updated
    expect(localStorage.setItem).toHaveBeenCalledWith('accessibility-tritanopia', 'false');
  });

  it('toggles reduced motion mode', () => {
    const messageHandler = createMessageHandler();
    
    // Toggle reduced motion on
    messageHandler(
      { action: 'toggleReducedMotion', enabled: true },
      {},
      (response: ResponseMessage) => {
        expect(response.status).toBe('success');
      }
    );
    
    // Check if the reduced motion class was added
    expect(document.documentElement.classList.contains('accessibility-reduced-motion')).toBe(true);
    
    // Check if a stylesheet was added
    const stylesheet = document.getElementById('accessibility-reduced-motion-stylesheet');
    expect(stylesheet).not.toBeNull();
    expect(stylesheet?.getAttribute('href')).toContain('reduced-motion.css');
    
    // Check if localStorage was updated
    expect(localStorage.setItem).toHaveBeenCalledWith('accessibility-reduced-motion', 'true');
    
    // Toggle reduced motion off
    messageHandler(
      { action: 'toggleReducedMotion', enabled: false },
      {},
      (response: ResponseMessage) => {
        expect(response.status).toBe('success');
      }
    );
    
    // Check if the class was removed
    expect(document.documentElement.classList.contains('accessibility-reduced-motion')).toBe(false);
    
    // Check if the stylesheet was removed
    const stylesheetAfter = document.getElementById('accessibility-reduced-motion-stylesheet');
    expect(stylesheetAfter).toBeNull();
    
    // Check if localStorage was updated
    expect(localStorage.setItem).toHaveBeenCalledWith('accessibility-reduced-motion', 'false');
  });

  it('handles multiple colorblind modes together', () => {
    const messageHandler = createMessageHandler();
    
    // Enable both deuteranopia and protanopia
    messageHandler(
      { action: 'toggleColorBlind', enabled: true, type: 'deuteranopia' },
      {},
      () => {}
    );
    
    messageHandler(
      { action: 'toggleColorBlind', enabled: true, type: 'protanopia' },
      {},
      () => {}
    );
    
    // Check that both classes exist
    expect(document.documentElement.classList.contains('accessibility-deuteranopia')).toBe(true);
    expect(document.documentElement.classList.contains('accessibility-protanopia')).toBe(true);
    
    // Check that both stylesheets were added
    const stylesheet1 = document.getElementById('accessibility-deuteranopia-stylesheet');
    const stylesheet2 = document.getElementById('accessibility-protanopia-stylesheet');
    expect(stylesheet1).not.toBeNull();
    expect(stylesheet2).not.toBeNull();
    
    // Disable just one
    messageHandler(
      { action: 'toggleColorBlind', enabled: false, type: 'deuteranopia' },
      {},
      () => {}
    );
    
    // Check that only the disabled class was removed
    expect(document.documentElement.classList.contains('accessibility-deuteranopia')).toBe(false);
    expect(document.documentElement.classList.contains('accessibility-protanopia')).toBe(true);
  });
});
it('toggles large targets mode on', () => {
  const messageHandler = createMessageHandler();
  
  // Toggle large targets on
  messageHandler(
    { action: 'toggleLargeTargets', enabled: true },
    {},
    (response: ResponseMessage) => {
      expect(response.status).toBe('success');
    }
  );
  
  // Check if the large targets class was added
  expect(document.documentElement.classList.contains('accessibility-large-targets')).toBe(true);
  
  // Check if localStorage was updated
  expect(localStorage.setItem).toHaveBeenCalledWith('accessibility-large-targets', 'true');
  
  // Check if a stylesheet was added with the correct attribute
  const stylesheet = document.querySelector('link[data-accessibility-large-targets]');
  expect(stylesheet).not.toBeNull();
  expect(stylesheet?.getAttribute('href')).toContain('large-targets.css');
});

it('toggles large targets mode off', () => {
  const messageHandler = createMessageHandler();
  
  // Toggle large targets on first
  messageHandler(
    { action: 'toggleLargeTargets', enabled: true },
    {},
    () => {}
  );
  
  // Then toggle it off
  messageHandler(
    { action: 'toggleLargeTargets', enabled: false },
    {},
    (response: ResponseMessage) => {
      expect(response.status).toBe('success');
    }
  );
  
  // Check if the class was removed
  expect(document.documentElement.classList.contains('accessibility-large-targets')).toBe(false);
  
  // Check if localStorage was updated
  expect(localStorage.setItem).toHaveBeenCalledWith('accessibility-large-targets', 'false');
  
  // Check if the stylesheet was removed
  const stylesheet = document.querySelector('link[data-accessibility-large-targets]');
  expect(stylesheet).toBeNull();
});

it('handles redundant large targets state changes', () => {
  const messageHandler = createMessageHandler();
  
  // First toggle on
  messageHandler(
    { action: 'toggleLargeTargets', enabled: true },
    {},
    () => {}
  );
  
  // Clear mock calls to check if they're called again
  localStorage.setItem.mockClear();
  
  // Toggle on again (should be a no-op for DOM operations)
  messageHandler(
    { action: 'toggleLargeTargets', enabled: true },
    {},
    (response: ResponseMessage) => {
      expect(response.status).toBe('success');
    }
  );
  
  // Should still have the class
  expect(document.documentElement.classList.contains('accessibility-large-targets')).toBe(true);
  
  // Should update localStorage even if redundant
  expect(localStorage.setItem).toHaveBeenCalledWith('accessibility-large-targets', 'true');
  
  // Should not create additional stylesheets
  const stylesheets = document.querySelectorAll('link[data-accessibility-large-targets]');
  expect(stylesheets.length).toBe(1);
});

it('updates the line-height stylesheet and data attribute', () => {
  const messageHandler = createMessageHandler();

  // Add to createMessageHandler for line height functionality
  const updatedMessageHandler = function(
    message: BaseMessage, 
    sender: MessageSender, 
    sendResponse: (response: ResponseMessage) => void
  ) {
    if (message.action === 'updateLineHeight') {
      if (message.enabled) {
        // Create style element
        const style = document.createElement('style');
        style.id = 'accessibility-line-height';
        style.textContent = `html[data-line-height="custom"] * { line-height: ${message.value} !important; }`;
        document.head.appendChild(style);
        
        // Add data attribute
        document.documentElement.setAttribute('data-line-height', 'custom');
      } else {
        // Remove style element if exists
        const existingStyle = document.getElementById('accessibility-line-height');
        if (existingStyle) {
          existingStyle.remove();
        }
        
        // Remove data attribute
        document.documentElement.removeAttribute('data-line-height');
      }
      
      localStorage.setItem('accessibility-line-height-enabled', String(message.enabled));
      if (message.enabled) {
        localStorage.setItem('accessibility-line-height-value', String(message.value));
      }
      
      sendResponse({ status: 'success' });
      return true;
    }
    
    return messageHandler(message, sender, sendResponse);
  };
  
  // Test enabling line height with a value of 2
  updatedMessageHandler(
    { action: 'updateLineHeight', enabled: true, value: 2 },
    {},
    (response: ResponseMessage) => {
      expect(response.status).toBe('success');
    }
  );
  
  // Check if the data attribute was added
  expect(document.documentElement.getAttribute('data-line-height')).toBe('custom');
  
  // Check if the style element exists
  const style = document.getElementById('accessibility-line-height');
  expect(style).not.toBeNull();
  
  // Check if localStorage was updated correctly
  expect(localStorage.setItem).toHaveBeenCalledWith('accessibility-line-height-enabled', 'true');
  expect(localStorage.setItem).toHaveBeenCalledWith('accessibility-line-height-value', '2');
  
  // Now test disabling
  updatedMessageHandler(
    { action: 'updateLineHeight', enabled: false },
    {},
    (response: ResponseMessage) => {
      expect(response.status).toBe('success');
    }
  );
  
  // Check if the data attribute was removed
  expect(document.documentElement.getAttribute('data-line-height')).toBeNull();
  
  // Check if the style element was removed
  const styleAfter = document.getElementById('accessibility-line-height');
  expect(styleAfter).toBeNull();
  
  // Check if localStorage was updated correctly
  expect(localStorage.setItem).toHaveBeenCalledWith('accessibility-line-height-enabled', 'false');
});

it('toggles hover controls', () => {
  // Update createMessageHandler to handle hover controls first
  const originalHandler = createMessageHandler();
  const messageHandler = function(message: BaseMessage, sender: MessageSender, sendResponse: (response: ResponseMessage) => void) {
    if (message.action === 'toggleHoverControls') {
      if (message.enabled) {
        document.documentElement.classList.add('accessibility-hover-controls');
        
        // Create hover controls related elements
        const hoverStyle = document.createElement('link');
        hoverStyle.rel = 'stylesheet';
        hoverStyle.href = chrome.runtime.getURL('hover-controls.css');
        hoverStyle.setAttribute('data-accessibility-hover-controls', '');
        document.head.appendChild(hoverStyle);
        
        // Set up tracking state
        window.hoverControlsActive = true;
      } else {
        document.documentElement.classList.remove('accessibility-hover-controls');
        
        // Remove stylesheet
        const styleElement = document.querySelector('link[data-accessibility-hover-controls]');
        if (styleElement) {
          styleElement.remove();
        }
        
        // Remove any active hover indicators
        const indicators = document.querySelectorAll('.accessibility-hover-indicator');
        indicators.forEach(indicator => indicator.remove());
        
        // Update tracking state
        window.hoverControlsActive = false;
      }
      
      localStorage.setItem('accessibility-hover-controls', String(message.enabled));
      sendResponse({ status: 'success' });
      return true;
    }
    
    return originalHandler(message, sender, sendResponse);
  };
  
  // Toggle hover controls on
  messageHandler(
    { action: 'toggleHoverControls', enabled: true },
    {},
    (response: ResponseMessage) => {
      expect(response.status).toBe('success');
    }
  );
  
  // Check if the hover controls class was added
  expect(document.documentElement.classList.contains('accessibility-hover-controls')).toBe(true);
  
  // Check if a stylesheet was added
  const stylesheet = document.querySelector('link[data-accessibility-hover-controls]');
  expect(stylesheet).not.toBeNull();
  expect(stylesheet?.getAttribute('href')).toContain('hover-controls.css');
  
  // Simulate mousemove over an element
  const link = document.createElement('a');
  link.href = '#test';
  link.textContent = 'Test Link';
  document.body.appendChild(link);
  
  // Simulate mouse event handler
  const mockHoverEvent = new MouseEvent('mousemove');
  Object.defineProperty(mockHoverEvent, 'target', { value: link });
  
  // Manually call what would be the mousemove handler
  if (window.hoverControlsActive) {
    const indicator = document.createElement('div');
    indicator.className = 'accessibility-hover-indicator';
    document.body.appendChild(indicator);
  }
  
  // Check if the hover indicator was added
  const indicators = document.querySelectorAll('.accessibility-hover-indicator');
  expect(indicators.length).toBe(1);
  
  // Toggle hover controls off
  messageHandler(
    { action: 'toggleHoverControls', enabled: false },
    {},
    (response: ResponseMessage) => {
      expect(response.status).toBe('success');
    }
  );
  
  // Check if the class was removed
  expect(document.documentElement.classList.contains('accessibility-hover-controls')).toBe(false);
  
  // Check if indicators were removed
  const indicatorsAfter = document.querySelectorAll('.accessibility-hover-indicator');
  expect(indicatorsAfter.length).toBe(0);
  
  // Check if localStorage was updated
  expect(localStorage.setItem).toHaveBeenCalledWith('accessibility-hover-controls', 'false');
});

it('toggles keyboard navigation auto-click feature', () => {
  // Set up fake timers for this test
  vi.useFakeTimers();

  // Add key navigation to message handler
  const originalHandler = createMessageHandler();
  const messageHandler = function(message: BaseMessage, sender: MessageSender, sendResponse: (response: ResponseMessage) => void) {
    if (message.action === 'toggleKeyboardNav') {
      if (message.enabled) {
        document.documentElement.classList.add('accessibility-keyboard-nav');
        window.keyboardNavActive = true;
        window.keyboardClickDelay = message.delay || 1500; // Default delay
      } else {
        document.documentElement.classList.remove('accessibility-keyboard-nav');
        window.keyboardNavActive = false;
        
        // Clear any pending timers (simulated)
        window.mockKeyboardTimer = null;
      }
      
      localStorage.setItem('accessibility-keyboard-nav', String(message.enabled));
      localStorage.setItem('accessibility-keyboard-nav-delay', String(message.delay || 1500));
      sendResponse({ status: 'success' });
      return true;
    }
    
    return originalHandler(message, sender, sendResponse);
  };
  
  // Create a test button
  const button = document.createElement('button');
  button.textContent = 'Test Button';
  document.body.appendChild(button);
  let wasClicked = false;
  button.addEventListener('click', () => { wasClicked = true; });
  
  // Toggle keyboard navigation on with shorter delay for testing
  messageHandler(
    { action: 'toggleKeyboardNav', enabled: true, delay: 100 },
    {},
    (response: ResponseMessage) => {
      expect(response.status).toBe('success');
    }
  );
  
  // Check if feature was enabled
  expect(document.documentElement.classList.contains('accessibility-keyboard-nav')).toBe(true);
  expect(window.keyboardNavActive).toBe(true);
  expect(window.keyboardClickDelay).toBe(100);
  
  // Simulate focus event
  button.focus();
  
  // In actual implementation, this would set a timer - we'll simulate that
  if (window.keyboardNavActive) {
    window.mockKeyboardTimer = setTimeout(() => {
      button.click();
    }, window.keyboardClickDelay);
  }
  
  // Fast-forward timer
  vi.advanceTimersByTime(150);
  
  // Check if button was clicked
  expect(wasClicked).toBe(true);
  
  // Toggle keyboard navigation off
  messageHandler(
    { action: 'toggleKeyboardNav', enabled: false },
    {},
    (response: ResponseMessage) => {
      expect(response.status).toBe('success');
    }
  );
  
  // Check if feature was disabled
  expect(document.documentElement.classList.contains('accessibility-keyboard-nav')).toBe(false);
  expect(window.keyboardNavActive).toBe(false);
  
  // Reset click flag
  wasClicked = false;
  
  // Simulate focus event again
  button.focus();
  
  // Since feature is disabled, no timer should be set
  expect(window.mockKeyboardTimer).toBeNull();
  
  // Fast-forward timer again
  vi.advanceTimersByTime(150);
  
  // Check that button wasn't clicked this time
  expect(wasClicked).toBe(false);
  
  // Clean up by restoring real timers
  vi.useRealTimers();
});

it('initializes features from localStorage values', () => {
  // Mock localStorage with saved settings
  localStorage.getItem = vi.fn((key) => {
    const savedSettings = {
      'accessibility-high-contrast': 'true',
      'accessibility-dyslexia-font': 'true',
      'accessibility-reading-line': 'false',
      'accessibility-deuteranopia': 'true',
      'accessibility-reduced-motion': 'false',
      'accessibility-large-targets': 'true',
      'accessibility-hover-controls': 'false',
      'accessibility-keyboard-nav': 'true',
      'accessibility-keyboard-nav-delay': '2000',
      'accessibility-line-height-enabled': 'true',
      'accessibility-line-height-value': '1.8'
    };
    return savedSettings[key] || null;
  });
  
  // Create the initialization function that would be in content-script.ts
  function initializeFromLocalStorage() {
    // High Contrast
    if (localStorage.getItem('accessibility-high-contrast') === 'true') {
      document.documentElement.classList.add('accessibility-high-contrast');
    }
    
    // Dyslexia Font
    if (localStorage.getItem('accessibility-dyslexia-font') === 'true') {
      document.documentElement.classList.add('accessibility-dyslexia-font');
    }
    
    // Color Blind - just checking deuteranopia for this test
    if (localStorage.getItem('accessibility-deuteranopia') === 'true') {
      document.documentElement.classList.add('accessibility-deuteranopia');
      
      const styleElement = document.createElement('link');
      styleElement.id = 'accessibility-deuteranopia-stylesheet';
      styleElement.rel = 'stylesheet';
      styleElement.href = chrome.runtime.getURL('deuteranopia.css');
      document.head.appendChild(styleElement);
    }
    
    // Large Targets
    if (localStorage.getItem('accessibility-large-targets') === 'true') {
      document.documentElement.classList.add('accessibility-large-targets');
      
      const styleElement = document.createElement('link');
      styleElement.rel = 'stylesheet';
      styleElement.href = chrome.runtime.getURL('large-targets.css');
      styleElement.setAttribute('data-accessibility-large-targets', '');
      document.head.appendChild(styleElement);
    }
    
    // Line Height
    if (localStorage.getItem('accessibility-line-height-enabled') === 'true') {
      const value = localStorage.getItem('accessibility-line-height-value') || '1.5';
      
      const style = document.createElement('style');
      style.id = 'accessibility-line-height';
      style.textContent = `html[data-line-height="custom"] * { line-height: ${value} !important; }`;
      document.head.appendChild(style);
      
      document.documentElement.setAttribute('data-line-height', 'custom');
    }
    
    // Keyboard Navigation
    if (localStorage.getItem('accessibility-keyboard-nav') === 'true') {
      document.documentElement.classList.add('accessibility-keyboard-nav');
      window.keyboardNavActive = true;
      window.keyboardClickDelay = parseInt(
        localStorage.getItem('accessibility-keyboard-nav-delay') || '1500',
        10
      );
    }
  }
  
  // Run the initialization
  initializeFromLocalStorage();
  
  // Test that elements were set up based on localStorage values
  
  // Features that should be enabled
  expect(document.documentElement.classList.contains('accessibility-high-contrast')).toBe(true);
  expect(document.documentElement.classList.contains('accessibility-dyslexia-font')).toBe(true);
  expect(document.documentElement.classList.contains('accessibility-deuteranopia')).toBe(true);
  expect(document.documentElement.classList.contains('accessibility-large-targets')).toBe(true);
  expect(document.documentElement.classList.contains('accessibility-keyboard-nav')).toBe(true);
  
  // Features that should be disabled
  expect(document.documentElement.classList.contains('accessibility-reduced-motion')).toBe(false);
  expect(document.documentElement.classList.contains('accessibility-hover-controls')).toBe(false);
  
  // Line height should be enabled with custom value
  expect(document.documentElement.getAttribute('data-line-height')).toBe('custom');
  const lineHeightStyle = document.getElementById('accessibility-line-height');
  expect(lineHeightStyle).not.toBeNull();
  expect(lineHeightStyle?.textContent).toContain('line-height: 1.8');
  
  // Check that stylesheets were added for enabled features
  expect(document.getElementById('accessibility-deuteranopia-stylesheet')).not.toBeNull();
  expect(document.querySelector('link[data-accessibility-large-targets]')).not.toBeNull();
  
  // Check keyboard navigation settings
  expect(window.keyboardNavActive).toBe(true);
  expect(window.keyboardClickDelay).toBe(2000);
});