// Global state for accessibility features
interface AccessibilityState {
  highContrast: boolean;
  // Add other accessibility features as needed
}

const state: AccessibilityState = {
  highContrast: false,
};

// Listen for messages from the popup
chrome.runtime.onMessage.addListener((request, _sender, sendResponse) => {
  console.log("Background script received message:", request);
  
  if (request.action === "getState") {
    // Return current state to the popup
    sendResponse(state);
    return true;
  }
  
  if (request.action === "toggleFeature") {
    // Update the state 
    const { feature, enabled } = request;
    if (feature === "highContrast") {
      state.highContrast = enabled;
      
      // Apply to current tab
      applyHighContrast(enabled);
      
      // Save state to storage for persistence
      chrome.storage.sync.set({ accessibilityState: state });
      sendResponse({ status: "success", state });
      return true;
    }
    // Add other features here in the future
  }
  
  // Listen for state updates from content scripts 
  if (request.action === "updateState" && request.feature === "highContrast") {
    state.highContrast = request.enabled;
    chrome.storage.sync.set({ accessibilityState: state });
    return true;
  }

  return false;
});

// Function to apply high contrast to the current tab
async function applyHighContrast(enable: boolean): Promise<void> {
  try {
    // Get the active tab
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tabs[0]?.id) return;
    
    const tabId = tabs[0].id;
    
    // Inject CSS file if needed
    if (enable) {
      await chrome.scripting.insertCSS({
        target: { tabId },
        files: ["/high-contrast.css"]  // Added leading slash to fix path
      });
    }
    
    // Send message to content script with error handling
    chrome.tabs.sendMessage(tabId, {
      action: "toggleHighContrast",
      enabled: enable
    }, (_response) => {
      if (chrome.runtime.lastError) {
        console.error("Error sending message:", chrome.runtime.lastError);
        // Content script might not be ready, try injecting it first
        chrome.scripting.executeScript({
          target: { tabId },
          files: ['content-script.js']
        }).then(() => {
          // Retry sending message after script is injected
          setTimeout(() => {
            chrome.tabs.sendMessage(tabId, {
              action: "toggleHighContrast",
              enabled: enable
            });
          }, 100);
        }).catch(err => console.error("Error injecting content script:", err));
      }
    });
  } catch (error) {
    console.error("Error applying high contrast:", error);
  }
}

// Initialize by loading state from storage
chrome.storage.sync.get("accessibilityState", (result) => {
  if (result.accessibilityState) {
    Object.assign(state, result.accessibilityState);
  }
});

// When a new tab is activated, check if we need to apply settings
chrome.tabs.onActivated.addListener(async (_activeInfo) => {
  if (state.highContrast) {
    applyHighContrast(true);
  }
});

// When a page is loaded, inject the content script if it hasn't been injected yet
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url && tab.url.startsWith('http')) {
    chrome.scripting.executeScript({
      target: { tabId },
      files: ['content-script.js']  // Updated path to match build output
    }).catch(err => console.error("Error injecting content script:", err));
  }
});