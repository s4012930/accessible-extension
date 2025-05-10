import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { JSDOM } from 'jsdom';

// Create a fresh DOM for each test
let dom: JSDOM;
let document: Document;
let window: Window & typeof globalThis;
let chrome: any;
let localStorage: any;

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
  window = dom.window as any;

  // Mock localStorage
  localStorage = {
    getItem: vi.fn((key) => null),
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
        removeListener: vi.fn(),
      },
      getURL: vi.fn((url) => `chrome-extension://mock-extension-id/${url}`),
    },
    storage: {
      sync: {
        get: vi.fn((key, cb) => cb({})),
        set: vi.fn(),
      },
    },
  };

  Object.defineProperty(window, 'chrome', { value: chrome });
  
  // Make JSDOM's window and document available globally
  global.window = window;
  global.document = document;
  global.chrome = chrome;
});

afterEach(() => {
  vi.resetAllMocks();
});

// Helper function to simulate the content script message handler
function createMessageHandler() {
  return (
    message: any,
    sender: any,
    sendResponse: (response: any) => void
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
      (response: any) => {
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
      (response: any) => {
        expect(response.status).toBe('success');
      }
    );
    
    // Check if the class was removed
    expect(document.documentElement.classList.contains('accessibility-high-contrast')). toBe(false);
    
    // Check if localStorage was updated
    expect(localStorage.setItem).toHaveBeenCalledWith('accessibility-high-contrast', 'false');
  });

  it('toggles dyslexia font', () => {
    const messageHandler = createMessageHandler();
    
    // Toggle dyslexia font on
    messageHandler(
      { action: 'toggleDyslexiaFont', enabled: true },
      {},
      (response: any) => {
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
      (response: any) => {
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
      (response: any) => {
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
      (response: any) => {
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
      (response: any) => {
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
      (response: any) => {
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
      (response: any) => {
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
      (response: any) => {
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
      (response: any) => {
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
      (response: any) => {
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
      (response: any) => {
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
      (response: any) => {
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