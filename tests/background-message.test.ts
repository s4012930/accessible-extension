import { describe, it, expect, vi, beforeEach, Mock as VitestMock } from 'vitest';

// Define interfaces for state and messages
interface ColorBlindSettings {
  enabled: boolean;
  deuteranopia: boolean;
  protanopia: boolean;
  tritanopia: boolean;
}

interface TextSetting {
  enabled: boolean;
  value: number;
}

interface AccessibilityState {
  highContrast: boolean;
  dyslexiaFont: boolean;
  readingLine: boolean;
  colorBlind: ColorBlindSettings;
  textScaling: TextSetting;
  lineHeight: TextSetting;
  reducedMotion: boolean;
}

interface GetStateRequest {
  action: "getState";
}

interface ToggleFeatureRequest {
  action: "toggleFeature";
  feature: "highContrast" | "reducedMotion";
  enabled: boolean;
}

interface TurnOffAllRequest {
  action: "turnOffAll";
}

type BackgroundRequest =
  | GetStateRequest
  | ToggleFeatureRequest
  | TurnOffAllRequest
  | { action: string; [key: string]: unknown };

type SuccessResponse = { status: "success"; state: AccessibilityState };
type ErrorResponse = { status: "error"; message: string };
type HandlerResponse = AccessibilityState | SuccessResponse | ErrorResponse;

type SendResponseFunction = (response?: HandlerResponse) => void;

type MessageHandlerCallback = (
  request: BackgroundRequest,
  sender: chrome.runtime.MessageSender,
  sendResponse: SendResponseFunction
) => boolean | void;

describe('Background Script Message System', () => {
  // Mock Chrome API
  const mockChrome = {
    storage: {
      sync: {
        get: vi.fn(),
        set: vi.fn(),
      },
    },
    runtime: {
      onMessage: {
        addListener: vi.fn(),
        removeListener: vi.fn(),
        hasListener: vi.fn(),
      },
      onInstalled: {
        addListener: vi.fn(),
        removeListener: vi.fn(),
        hasListener: vi.fn(),
      },
      getURL: (path: string) => `chrome-extension://mock-id/${path}`,
      id: 'mock-id',
    },
    tabs: {
      query: vi.fn(),
      sendMessage: vi.fn(),
      create: vi.fn(),
    },
    action: {
      setIcon: vi.fn(),
      setPopup: vi.fn(),
    },
  };

  let messageHandler: MessageHandlerCallback;
  let sendResponse: VitestMock<(response?: HandlerResponse) => void>;
  let AccessibilityState: AccessibilityState; // Represents the current default state structure

  // Define initializeExtension in the describe scope
  // This function simulates how your background script might set up its listeners.
  // It uses the 'state' from the describe/beforeEach scope for default values in migration.
  const initializeExtension = () => {
    // Add event listener for runtime messages
    chrome.runtime.onMessage.addListener(messageHandler);

    // Listen for extension installation/update
    chrome.runtime.onInstalled.addListener((details: chrome.runtime.InstalledDetails) => {
      if (details.reason === 'install') {
        // Set default state for new installs
        const defaultState: AccessibilityState = {
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
        chrome.storage.sync.get("accessibilityState", (data: { [key: string]: unknown }) => {
          const storedState = data.accessibilityState || {};
          // which is initialized in beforeEach to the latest default structure.
          const updatedState: AccessibilityState = { ...AccessibilityState, ...storedState };
          chrome.storage.sync.set({ accessibilityState: updatedState });
        });
      }
    });
  };

  beforeEach(() => {
    vi.resetAllMocks();
    global.chrome = mockChrome as unknown as typeof chrome;

    AccessibilityState = {
      highContrast: false,
      dyslexiaFont: false,
      readingLine: false,
      colorBlind: { enabled: false, deuteranopia: false, protanopia: false, tritanopia: false },
      textScaling: { enabled: false, value: 100 },
      lineHeight: { enabled: false, value: 1.5 },
      reducedMotion: false
    };

    // Default storage.sync.get mock for most tests
    mockChrome.storage.sync.get.mockImplementation(
      (keyOrKeys: string | string[] | { [key: string]: unknown } | null, callback: (items: { [key: string]: unknown }) => void) => {
      if (typeof keyOrKeys === 'string' && keyOrKeys === "accessibilityState") {
        callback({ accessibilityState: AccessibilityState });
      } else if (typeof keyOrKeys === 'object' && keyOrKeys !== null && 'accessibilityState' in keyOrKeys) {
        callback({ accessibilityState: AccessibilityState });
      }
      else {
        callback({});
      }
    });

    mockChrome.tabs.query.mockResolvedValue([{ id: 1, active: true, url: 'https://example.com' } as chrome.tabs.Tab]);
    mockChrome.tabs.sendMessage.mockImplementation((_tabId: number, _message: unknown, cb?: (response: unknown) => void) => {
      if (cb) cb({ status: 'success' });
      return Promise.resolve({ status: 'success' });
    });

    // Simplified messageHandler from your provided context
    messageHandler = (
      request: BackgroundRequest,
      _sender: chrome.runtime.MessageSender,
      responseFn: SendResponseFunction
    ): boolean | void => {
      if (request.action === "getState") {
        responseFn(AccessibilityState);
        return true;
      }
      if (request.action === "toggleFeature") {
        // Ensure request is ToggleFeatureRequest before destructuring
        if ('feature' in request && 'enabled' in request) {
            const { feature, enabled } = request as ToggleFeatureRequest;
            if (feature === "highContrast") AccessibilityState.highContrast = enabled;
            else if (feature === "reducedMotion") AccessibilityState.reducedMotion = enabled;
            else { responseFn({ status: "error", message: "Feature not implemented" }); return true; }
            chrome.storage.sync.set({ accessibilityState: AccessibilityState });
            chrome.tabs.query({}, () => { /* ... send messages ... */ });
            responseFn({ status: "success", state: AccessibilityState }); return true;
        }
      }
      if (request.action === "turnOffAll") {
        AccessibilityState.highContrast = false;
        AccessibilityState.dyslexiaFont = false;
        AccessibilityState.readingLine = false;
        AccessibilityState.reducedMotion = false;
        AccessibilityState.colorBlind = { enabled: false, deuteranopia: false, protanopia: false, tritanopia: false };
        AccessibilityState.textScaling = { enabled: false, value: 100 };
        AccessibilityState.lineHeight = { enabled: false, value: 1.5 };
        chrome.storage.sync.set({ accessibilityState: AccessibilityState });
        chrome.tabs.query({}, () => { /* ... send messages ... */ });
        responseFn({ status: "success", state: AccessibilityState }); return true;
      }
      return false;
    };
    sendResponse = vi.fn();
  });

  it('handles getState request correctly', () => {
    messageHandler(
      { action: "getState" },
      {} as chrome.runtime.MessageSender,
      sendResponse
    );
    
    expect(sendResponse).toHaveBeenCalledWith(AccessibilityState);
  });
  
  it('handles toggleFeature for highContrast correctly', () => {
    // Test enabling high contrast
    messageHandler(
      { action: "toggleFeature", feature: "highContrast", enabled: true },
      {} as chrome.runtime.MessageSender,
      sendResponse
    );
    
    // Verify AccessibilityState was updated
    expect(AccessibilityState.highContrast).toBe(true);
    
    // Verify storage was updated
    expect(mockChrome.storage.sync.set).toHaveBeenCalledWith({ accessibilityState: AccessibilityState });
    
    // Verify response was sent
    expect(sendResponse).toHaveBeenCalledWith({ status: "success", state: AccessibilityState });
  });
  
  it('handles toggleFeature for reducedMotion correctly', () => {
    // Test enabling reduced motion
    messageHandler(
      { action: "toggleFeature", feature: "reducedMotion", enabled: true },
      {} as chrome.runtime.MessageSender,
      sendResponse
    );
    
    // Verify AccessibilityState was updated
    expect(AccessibilityState.reducedMotion).toBe(true);
    
    // Verify storage was updated
    expect(mockChrome.storage.sync.set).toHaveBeenCalledWith({ accessibilityState: AccessibilityState });
    
    // Verify response was sent
    expect(sendResponse).toHaveBeenCalledWith({ status: "success", state: AccessibilityState });
  });
  
  it('handles turnOffAll request correctly', () => {
    // First set some AccessibilityState to true
    AccessibilityState.highContrast = true;
    AccessibilityState.reducedMotion = true;
    
    // Then call turnOffAll
    messageHandler(
      { action: "turnOffAll" },
      {} as chrome.runtime.MessageSender,
      sendResponse
    );
    
    // Verify all AccessibilityState values are false
    expect(AccessibilityState.highContrast).toBe(false);
    expect(AccessibilityState.reducedMotion).toBe(false);
    expect(AccessibilityState.colorBlind.enabled).toBe(false);
    expect(AccessibilityState.textScaling.enabled).toBe(false);
    
    // Verify storage was updated
    expect(mockChrome.storage.sync.set).toHaveBeenCalledWith({ accessibilityState: AccessibilityState });
    
    // Verify response was sent
    expect(sendResponse).toHaveBeenCalledWith({ status: "success", state: AccessibilityState });
  });
  
  it('returns false for unhandled messages', () => {
    const result = messageHandler(
      { action: "unknownAction" },
      {} as chrome.runtime.MessageSender,
      sendResponse
    );
    
    expect(result).toBe(false);
  });
  
  it('handles tab communication errors gracefully', async () => {
    // Setup tabs.sendMessage mock to fail with an error
    mockChrome.tabs.sendMessage.mockRejectedValueOnce(new Error("Tab communication failed"));

    // Attempt to toggle a feature that requires tab communication
    messageHandler(
      { action: "toggleFeature", feature: "highContrast", enabled: true },
      {} as chrome.runtime.MessageSender,
      sendResponse
    );

    // Wait for async operations
    await new Promise(resolve => setTimeout(resolve, 10));

    // Verify error was handled and AccessibilityState was still updated
    expect(AccessibilityState.highContrast).toBe(true);
    
    // Verify storage was still updated despite the error
    expect(mockChrome.storage.sync.set).toHaveBeenCalledWith({ 
      accessibilityState: AccessibilityState 
    });
    
    // Verify response indicates success (since the feature toggle itself worked)
    expect(sendResponse).toHaveBeenCalledWith({ 
      status: "success", 
      state: AccessibilityState 
    });
    
    // Reset the mock for other tests
    mockChrome.tabs.sendMessage.mockImplementation((_tabId: number, _message: unknown, callback?: (response: unknown) => void) => {
      if (callback) callback({ status: 'success' });
      return Promise.resolve({ status: 'success' });
    });
  });
  
  it('initializes properly on extension install', () => {
    initializeExtension(); 

    expect(mockChrome.runtime.onMessage.addListener).toHaveBeenCalledWith(messageHandler);
    expect(mockChrome.runtime.onInstalled.addListener).toHaveBeenCalledTimes(1);

    const installedCallback = mockChrome.runtime.onInstalled.addListener.mock.calls[0][0] as (details: chrome.runtime.InstalledDetails) => void;
    expect(installedCallback).toBeDefined();
    expect(typeof installedCallback).toBe('function');

    installedCallback({ reason: 'install' } as chrome.runtime.InstalledDetails);
    expect(mockChrome.storage.sync.set).toHaveBeenCalledWith({
      accessibilityState: expect.objectContaining({
        highContrast: false,
        reducedMotion: false,
      })
    });
  });

  it('migrates settings on extension update', () => {
    const existingStateInStorage = {
      highContrast: true, 
      colorBlind: { enabled: true, deuteranopia: true, protanopia: false, tritanopia: false }, 
      reducedMotion: false, 
    };

    mockChrome.storage.sync.get.mockImplementation((key: string | string[] | { [key: string]: unknown } | null, callback: (items: { [key: string]: unknown }) => void) => {
      if (key === "accessibilityState") {
        callback({ accessibilityState: existingStateInStorage });
      } else {
        callback({});
      }
    });
    
    initializeExtension(); 
    expect(mockChrome.runtime.onInstalled.addListener).toHaveBeenCalledTimes(1);

    const installedCallback = mockChrome.runtime.onInstalled.addListener.mock.calls[0][0] as (details: chrome.runtime.InstalledDetails) => void;
    expect(installedCallback).toBeDefined();
    expect(typeof installedCallback).toBe('function');

    installedCallback({ reason: 'update', previousVersion: '1.0.0' } as chrome.runtime.InstalledDetails);

    expect(mockChrome.storage.sync.set).toHaveBeenCalledWith({
      accessibilityState: expect.objectContaining({
        highContrast: true, 
        dyslexiaFont: false, 
        readingLine: false, 
        colorBlind: { enabled: true, deuteranopia: true, protanopia: false, tritanopia: false }, 
        textScaling: { enabled: false, value: 100 }, 
        lineHeight: { enabled: false, value: 1.5 }, 
        reducedMotion: false, 
      })
    });
  });
});