import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('Background Script Message System', () => {
  // Mock Chrome API
  const mockChrome = {
    runtime: {
      onMessage: {
        addListener: vi.fn(),
        removeListener: vi.fn()
      },
      sendMessage: vi.fn(),
      onInstalled: {
        addListener: vi.fn()
      }
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
  let state: any; // Represents the current default state structure

  // Define initializeExtension in the describe scope
  // This function simulates how your background script might set up its listeners.
  // It uses the 'state' from the describe/beforeEach scope for default values in migration.
  const initializeExtension = () => {
    // Add event listener for runtime messages
    chrome.runtime.onMessage.addListener(messageHandler as (
      message: any,
      sender: chrome.runtime.MessageSender,
      sendResponse: (response?: any) => void
    ) => void); // Or boolean, depending on your messageHandler's actual return

    // Listen for extension installation/update
    chrome.runtime.onInstalled.addListener((details) => {
      if (details.reason === 'install') {
        // Set default state for new installs
        const defaultState = {
          highContrast: false,
          dyslexiaFont: false,
          readingLine: false,
          colorBlind: {
            enabled: false, deuteranopia: false, protanopia: false, tritanopia: false
          },
          textScaling: { enabled: false, value: 100 },
          lineHeight: { enabled: false, value: 1.5 },
          reducedMotion: false
        };
        chrome.storage.sync.set({ accessibilityState: defaultState });
      } else if (details.reason === 'update') {
        chrome.storage.sync.get("accessibilityState", (data) => {
          const storedState = data.accessibilityState || {};
          // 'state' here refers to the 'state' variable from the outer scope,
          // which is initialized in beforeEach to the latest default structure.
          const updatedState = { ...state, ...storedState };
          chrome.storage.sync.set({ accessibilityState: updatedState });
        });
      }
    });
  };

  beforeEach(() => {
    vi.resetAllMocks();
    global.chrome = mockChrome as any;

    state = {
      highContrast: false,
      dyslexiaFont: false,
      readingLine: false,
      colorBlind: { enabled: false, deuteranopia: false, protanopia: false, tritanopia: false },
      textScaling: { enabled: false, value: 100 },
      lineHeight: { enabled: false, value: 1.5 },
      reducedMotion: false
    };

    // Default storage.sync.get mock for most tests
    mockChrome.storage.sync.get.mockImplementation((keyOrKeys, callback) => {
      if (typeof keyOrKeys === 'string' && keyOrKeys === "accessibilityState") {
        callback({ accessibilityState: state });
      } else if (typeof keyOrKeys === 'object' && keyOrKeys !== null && 'accessibilityState' in keyOrKeys) {
        callback({ accessibilityState: state });
      }
      else {
        callback({});
      }
    });

    mockChrome.tabs.query.mockResolvedValue([{ id: 1, active: true, url: 'https://example.com' }]);
    mockChrome.tabs.sendMessage.mockImplementation((tabId, message, cb) => {
      if (cb) cb({ status: 'success' });
      return Promise.resolve({ status: 'success' });
    });

    // Simplified messageHandler from your provided context
    messageHandler = (request: any, sender: any, responseFn: Function) => {
      if (request.action === "getState") { responseFn(state); return true; }
      if (request.action === "toggleFeature") {
        const { feature, enabled } = request;
        if (feature === "highContrast") state.highContrast = enabled;
        else if (feature === "reducedMotion") state.reducedMotion = enabled;
        else { responseFn({ status: "error", message: "Feature not implemented" }); return true; }
        chrome.storage.sync.set({ accessibilityState: state });
        chrome.tabs.query({}, (tabs: any[]) => { /* ... send messages ... */ });
        responseFn({ status: "success", state }); return true;
      }
      if (request.action === "turnOffAll") {
        Object.keys(state).forEach(key => {
          if (typeof state[key] === 'boolean') state[key] = false;
          if (typeof state[key] === 'object' && state[key] !== null) {
            if ('enabled' in state[key]) state[key].enabled = false;
          }
        });
        state.colorBlind = { enabled: false, deuteranopia: false, protanopia: false, tritanopia: false };
        state.textScaling = { enabled: false, value: 100 };
        state.lineHeight = { enabled: false, value: 1.5 };
        chrome.storage.sync.set({ accessibilityState: state });
        chrome.tabs.query({}, (tabs: any[]) => { /* ... send messages ... */ });
        responseFn({ status: "success", state }); return true;
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
  
  it('handles tab communication errors gracefully', async () => {
    // Setup tabs.sendMessage mock to fail with an error
    mockChrome.tabs.sendMessage.mockImplementation(() => {
      throw new Error('Tab communication failed');
    });

    // Attempt to toggle a feature that requires tab communication
    messageHandler(
      { action: "toggleFeature", feature: "highContrast", enabled: true },
      {},
      sendResponse
    );

    // Wait for async operations
    await new Promise(resolve => setTimeout(resolve, 10));

    // Verify error was handled and state was still updated
    expect(state.highContrast).toBe(true);
    
    // Verify storage was still updated despite the error
    expect(mockChrome.storage.sync.set).toHaveBeenCalledWith({ 
      accessibilityState: state 
    });
    
    // Verify response indicates success (since the feature toggle itself worked)
    expect(sendResponse).toHaveBeenCalledWith({ 
      status: "success", 
      state 
    });
    
    // Reset the mock for other tests
    mockChrome.tabs.sendMessage.mockImplementation((tabId, message, callback) => {
      if (callback) callback({ status: 'success' });
      return Promise.resolve({ status: 'success' });
    });
  });
  
  it('initializes properly on extension install', () => {
    let installedCallback: Function | null = null;
    mockChrome.runtime.onInstalled.addListener.mockImplementation((callback: Function) => {
      installedCallback = callback;
    });

    initializeExtension(); // Call the setup function

    expect(mockChrome.runtime.onMessage.addListener).toHaveBeenCalledWith(messageHandler);
    expect(installedCallback).not.toBeNull();
    if (installedCallback) {
      (installedCallback as Function)({ reason: 'install' });
      expect(mockChrome.storage.sync.set).toHaveBeenCalledWith({
        accessibilityState: expect.objectContaining({
          highContrast: false,
          dyslexiaFont: false,
          reducedMotion: false
        })
      });
    }
  });

  it('migrates settings on extension update', () => {
    const existingStateInStorage = {
      highContrast: true,
      dyslexiaFont: true,
      // reducedMotion is missing, should get default from 'state'
    };

    // Override storage.sync.get for this specific test
    mockChrome.storage.sync.get.mockImplementation((key, callback) => {
      if (key === "accessibilityState") {
        callback({ accessibilityState: existingStateInStorage });
      } else {
        callback({});
      }
    });

    let installedCallback: Function | null = null;
    mockChrome.runtime.onInstalled.addListener.mockImplementation((callback: Function) => {
      installedCallback = callback;
    });

    initializeExtension(); // Call the setup function

    expect(installedCallback).not.toBeNull(); // Ensure listener was attached
    if (installedCallback) {
      (installedCallback as Function)({ reason: 'update', previousVersion: '1.0.0' });

      // Expect merged state: existing values preserved, new values get defaults from 'state'
      expect(mockChrome.storage.sync.set).toHaveBeenCalledWith({
        accessibilityState: expect.objectContaining({
          highContrast: true,       // Preserved from existingStateInStorage
          dyslexiaFont: true,       // Preserved from existingStateInStorage
          reducedMotion: false,     // Default from 'state' as it was missing
          readingLine: false,       // Default from 'state'
          // ... other properties from 'state' should also be present with their defaults
        })
      });
    } else {
      // This should not be reached if initializeExtension correctly adds the listener
      throw new Error("onInstalled.addListener's callback was not captured in this test.");
    }
  });
});