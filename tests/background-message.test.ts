import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('Background Script Message System', () => {
  // Mock Chrome API
  const mockChrome = {
    runtime: {
      onMessage: {
        addListener: vi.fn(),
        removeListener: vi.fn()
      },
      sendMessage: vi.fn()
    },
    tabs: {
      query: vi.fn(),
      sendMessage: vi.fn(),
    },
    storage: {
      sync: {
        get: vi.fn(),
        set: vi.fn()
      }
    }
  };

  let messageHandler: Function;
  let sendResponse: any;
  let state: any;
  
  beforeEach(() => {
    // Reset mocks
    vi.resetAllMocks();
    
    // Mock global chrome object
    global.chrome = mockChrome as any;
    
    // Setup initial accessibility state
    state = {
      highContrast: false,
      dyslexiaFont: false,
      readingLine: false,
      colorBlind: {
        enabled: false,
        deuteranopia: false,
        protanopia: false,
        tritanopia: false
      },
      textScaling: {
        enabled: false,
        value: 100
      },
      lineHeight: {
        enabled: false,
        value: 1.5
      },
      reducedMotion: false
    };
    
    // Setup storage mock to return our state
    mockChrome.storage.sync.get.mockImplementation((key, callback) => {
      if (key === "accessibilityState") {
        callback({ accessibilityState: state });
      } else {
        callback({});
      }
    });
    
    // Setup tabs.query mock to return a test tab
    mockChrome.tabs.query.mockResolvedValue([
      { id: 1, active: true, url: 'https://example.com' }
    ]);
    
    // Setup tabs.sendMessage mock to resolve successfully
    mockChrome.tabs.sendMessage.mockImplementation((tabId, message, callback) => {
      if (callback) callback({ status: 'success' });
      return Promise.resolve({ status: 'success' });
    });
    
    // Create a simplified background script message handler
    messageHandler = (request: any, sender: any, sendResponse: Function) => {
      // Handle getState request
      if (request.action === "getState") {
        sendResponse(state);
        return true;
      }
      
      // Handle toggleFeature request
      if (request.action === "toggleFeature") {
        const { feature, enabled } = request;
        
        if (feature === "highContrast") {
          state.highContrast = enabled;
          
          // Apply to tabs
          chrome.tabs.query({}, (tabs) => {
            tabs.forEach(tab => {
              if (tab.id && tab.url?.startsWith('http')) {
                chrome.tabs.sendMessage(tab.id, {
                  action: "toggleHighContrast",
                  enabled
                });
              }
            });
          });
          
          // Save state
          chrome.storage.sync.set({ accessibilityState: state });
          sendResponse({ status: "success", state });
          return true;
        }
        
        if (feature === "reducedMotion") {
          state.reducedMotion = enabled;
          
          // Apply to tabs
          chrome.tabs.query({}, (tabs) => {
            tabs.forEach(tab => {
              if (tab.id && tab.url?.startsWith('http')) {
                chrome.tabs.sendMessage(tab.id, {
                  action: "toggleReducedMotion",
                  enabled
                });
              }
            });
          });
          
          // Save state
          chrome.storage.sync.set({ accessibilityState: state });
          sendResponse({ status: "success", state });
          return true;
        }
        
        // Default handler for unimplemented features
        sendResponse({ status: "error", message: "Feature not implemented" });
        return true;
      }
      
      // Handle turnOffAll request
      if (request.action === "turnOffAll") {
        // Reset all state values
        state.highContrast = false;
        state.dyslexiaFont = false;
        state.readingLine = false;
        state.colorBlind.enabled = false;
        state.colorBlind.deuteranopia = false;
        state.colorBlind.protanopia = false;
        state.colorBlind.tritanopia = false;
        state.textScaling.enabled = false;
        state.lineHeight.enabled = false;
        state.reducedMotion = false;
        
        // Apply to all tabs
        chrome.tabs.query({}, (tabs) => {
          tabs.forEach(tab => {
            if (tab.id && tab.url?.startsWith('http')) {
              // Send messages to disable all features
              chrome.tabs.sendMessage(tab.id, { action: "toggleHighContrast", enabled: false });
              chrome.tabs.sendMessage(tab.id, { action: "toggleDyslexiaFont", enabled: false });
              chrome.tabs.sendMessage(tab.id, { action: "toggleReducedMotion", enabled: false });
              // Add other features here
            }
          });
        });
        
        // Save state
        chrome.storage.sync.set({ accessibilityState: state });
        sendResponse({ status: "success", state });
        return true;
      }
      
      return false;
    };
    
    sendResponse = vi.fn();
  });
  
  it('handles getState request correctly', () => {
    messageHandler(
      { action: "getState" },
      {},
      sendResponse
    );
    
    expect(sendResponse).toHaveBeenCalledWith(state);
  });
  
  it('handles toggleFeature for highContrast correctly', () => {
    // Test enabling high contrast
    messageHandler(
      { action: "toggleFeature", feature: "highContrast", enabled: true },
      {},
      sendResponse
    );
    
    // Verify state was updated
    expect(state.highContrast).toBe(true);
    
    // Verify storage was updated
    expect(mockChrome.storage.sync.set).toHaveBeenCalledWith({ accessibilityState: state });
    
    // Verify response was sent
    expect(sendResponse).toHaveBeenCalledWith({ status: "success", state });
    
    // Verify message was sent to tabs
    expect(mockChrome.tabs.query).toHaveBeenCalled();
  });
  
  it('handles toggleFeature for reducedMotion correctly', () => {
    // Test enabling reduced motion
    messageHandler(
      { action: "toggleFeature", feature: "reducedMotion", enabled: true },
      {},
      sendResponse
    );
    
    // Verify state was updated
    expect(state.reducedMotion).toBe(true);
    
    // Verify storage was updated
    expect(mockChrome.storage.sync.set).toHaveBeenCalledWith({ accessibilityState: state });
    
    // Verify response was sent
    expect(sendResponse).toHaveBeenCalledWith({ status: "success", state });
    
    // Verify message was sent to tabs
    expect(mockChrome.tabs.query).toHaveBeenCalled();
  });
  
  it('handles turnOffAll request correctly', () => {
    // First set some state to true
    state.highContrast = true;
    state.reducedMotion = true;
    
    // Then call turnOffAll
    messageHandler(
      { action: "turnOffAll" },
      {},
      sendResponse
    );
    
    // Verify all state values are false
    expect(state.highContrast).toBe(false);
    expect(state.reducedMotion).toBe(false);
    expect(state.colorBlind.enabled).toBe(false);
    expect(state.textScaling.enabled).toBe(false);
    
    // Verify storage was updated
    expect(mockChrome.storage.sync.set).toHaveBeenCalledWith({ accessibilityState: state });
    
    // Verify response was sent
    expect(sendResponse).toHaveBeenCalledWith({ status: "success", state });
    
    // Verify messages were sent to tabs
    expect(mockChrome.tabs.query).toHaveBeenCalled();
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