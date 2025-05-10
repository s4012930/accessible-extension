import { describe, it, expect, vi, beforeEach } from 'vitest';
import { JSDOM } from 'jsdom';

describe('Content Script Message Handler', () => {
  let mockDocument: Document;
  let localStorage: Storage;
  let messageHandler: Function;
  let sendResponse: any;
  
  beforeEach(() => {
    // Setup DOM environment
    const dom = new JSDOM('<!DOCTYPE html><html><head></head><body></body></html>');
    mockDocument = dom.window.document;
    global.document = mockDocument;
    global.window = dom.window as any;
    
    // Mock localStorage
    localStorage = {
      getItem: vi.fn(),
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn(),
      key: vi.fn(),
      length: 0
    };
    Object.defineProperty(window, 'localStorage', { value: localStorage });
    
    // Mock Chrome API
    global.chrome = {
      runtime: {
        getURL: vi.fn().mockImplementation((path) => `chrome-extension://fake-extension-id/${path}`),
        sendMessage: vi.fn().mockResolvedValue({ status: 'success' }),
        onMessage: {
          addListener: vi.fn()
        }
      }
    } as any;
    
    // Create a simplified version of a message handler that matches the structure of your content-script
    messageHandler = (request: any, _sender: any, sendResponse: Function) => {
      // Handle high contrast toggle
      if (request.action === "toggleHighContrast") {
        if (request.enabled) {
          document.documentElement.classList.add('accessibility-high-contrast');
          localStorage.setItem('accessibility-high-contrast', 'true');
        } else {
          document.documentElement.classList.remove('accessibility-high-contrast');
          localStorage.setItem('accessibility-high-contrast', 'false');
        }
        sendResponse({ status: "success" });
        return true;
      }
      
      // Handle reduced motion toggle
      if (request.action === "toggleReducedMotion") {
        if (request.enabled) {
          document.documentElement.classList.add('accessibility-reduced-motion');
          localStorage.setItem('accessibility-reduced-motion', 'true');
        } else {
          document.documentElement.classList.remove('accessibility-reduced-motion');
          localStorage.setItem('accessibility-reduced-motion', 'false');
        }
        sendResponse({ status: "success" });
        return true;
      }
      
      // Handle dyslexia font toggle
      if (request.action === "toggleDyslexiaFont") {
        if (request.enabled) {
          document.documentElement.classList.add('accessibility-dyslexia-font');
          localStorage.setItem('accessibility-dyslexia-font', 'true');
        } else {
          document.documentElement.classList.remove('accessibility-dyslexia-font');
          localStorage.setItem('accessibility-dyslexia-font', 'false');
        }
        sendResponse({ status: "success" });
        return true;
      }
      
      return false;
    };
    
    sendResponse = vi.fn();
  });
  
  it('handles toggleHighContrast message correctly', () => {
    // Test enabling high contrast
    messageHandler(
      { action: "toggleHighContrast", enabled: true },
      {},
      sendResponse
    );
    
    // Verify class was added and localStorage updated
    expect(mockDocument.documentElement.classList.contains('accessibility-high-contrast')).toBe(true);
    expect(localStorage.setItem).toHaveBeenCalledWith('accessibility-high-contrast', 'true');
    expect(sendResponse).toHaveBeenCalledWith({ status: "success" });
    
    // Reset mock call count
    sendResponse.mockClear();
    
    // Test disabling high contrast
    messageHandler(
      { action: "toggleHighContrast", enabled: false },
      {},
      sendResponse
    );
    
    // Verify class was removed and localStorage updated
    expect(mockDocument.documentElement.classList.contains('accessibility-high-contrast')).toBe(false);
    expect(localStorage.setItem).toHaveBeenCalledWith('accessibility-high-contrast', 'false');
    expect(sendResponse).toHaveBeenCalledWith({ status: "success" });
  });
  
  it('handles toggleReducedMotion message correctly', () => {
    // Test enabling reduced motion
    messageHandler(
      { action: "toggleReducedMotion", enabled: true },
      {},
      sendResponse
    );
    
    // Verify class was added and localStorage updated
    expect(mockDocument.documentElement.classList.contains('accessibility-reduced-motion')).toBe(true);
    expect(localStorage.setItem).toHaveBeenCalledWith('accessibility-reduced-motion', 'true');
    expect(sendResponse).toHaveBeenCalledWith({ status: "success" });
    
    // Reset mock call count
    sendResponse.mockClear();
    
    // Test disabling reduced motion
    messageHandler(
      { action: "toggleReducedMotion", enabled: false },
      {},
      sendResponse
    );
    
    // Verify class was removed and localStorage updated
    expect(mockDocument.documentElement.classList.contains('accessibility-reduced-motion')).toBe(false);
    expect(localStorage.setItem).toHaveBeenCalledWith('accessibility-reduced-motion', 'false');
    expect(sendResponse).toHaveBeenCalledWith({ status: "success" });
  });
  
  it('handles toggleDyslexiaFont message correctly', () => {
    // Test enabling dyslexia font
    messageHandler(
      { action: "toggleDyslexiaFont", enabled: true },
      {},
      sendResponse
    );
    
    // Verify class was added and localStorage updated
    expect(mockDocument.documentElement.classList.contains('accessibility-dyslexia-font')).toBe(true);
    expect(localStorage.setItem).toHaveBeenCalledWith('accessibility-dyslexia-font', 'true');
    expect(sendResponse).toHaveBeenCalledWith({ status: "success" });
    
    // Reset mock call count
    sendResponse.mockClear();
    
    // Test disabling dyslexia font
    messageHandler(
      { action: "toggleDyslexiaFont", enabled: false },
      {},
      sendResponse
    );
    
    // Verify class was removed and localStorage updated
    expect(mockDocument.documentElement.classList.contains('accessibility-dyslexia-font')).toBe(false);
    expect(localStorage.setItem).toHaveBeenCalledWith('accessibility-dyslexia-font', 'false');
    expect(sendResponse).toHaveBeenCalledWith({ status: "success" });
  });
  
  it('returns false for unhandled messages', () => {
    const result = messageHandler(
      { action: "unknownAction" },
      {},
      sendResponse
    );
    
    expect(result).toBe(false);
    expect(sendResponse).not.toHaveBeenCalled();
  });
});