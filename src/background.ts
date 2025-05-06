// Global state for accessibility features
interface AccessibilityState {
  highContrast: boolean;
  dyslexiaFont: boolean;
  readingLine: boolean;
  textScaling: {
    enabled: boolean;
    value: number;  // 100 = default (middle), can be decreased or increased
  };
  lineHeight: {
    enabled: boolean;
    value: number;  // 1.5 = default (middle), can be decreased or increased
  };
  // Add other accessibility features as needed
}

const state: AccessibilityState = {
  highContrast: false,
  dyslexiaFont: false,
  readingLine: false,
  textScaling: {
    enabled: false,
    value: 100   // Default scale (100%)
  },
  lineHeight: {
    enabled: false,
    value: 1.5    // Default line height
  }
};

// Listen for messages from the popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log("Background script received message:", request);
  
  if (request.action === "getState") {
    // If this request is coming from a tab content script, include the sender tab ID
    if (sender && sender.tab && sender.tab.id) {
      // Return current state to the content script
      sendResponse(state);
    } else {
      // Return current state to the popup
      sendResponse(state);
    }
    return true;
  }
  
  if (request.action === "turnOffAll") {
    // Reset all state values to false
    state.highContrast = false;
    state.dyslexiaFont = false;
    state.readingLine = false;
    state.textScaling.enabled = false;
    state.lineHeight.enabled = false;
    
    // Save state to storage immediately
    chrome.storage.sync.set({ accessibilityState: state });
    
    // Use Promise.all to wait for all async operations to complete
    Promise.all([
      applyToAllTabs("highContrast", false),
      applyToAllTabs("dyslexiaFont", false),
      applyToAllTabs("readingLine", false),
      applyTextScalingToAllTabs(false, state.textScaling.value),
      applyLineHeightToAllTabs(false, state.lineHeight.value)
    ]).then(() => {
      // Send response only after all operations complete
      sendResponse({ status: "success", state });
    }).catch((error) => {
      console.error("Error turning off all features:", error);
      // Still send a success response to ensure popup gets updated
      sendResponse({ status: "success", state });
    });
    
    // Return true to indicate we'll send a response asynchronously
    return true;
  }
  
  if (request.action === "toggleFeature") {
    // Update the state 
    const { feature, enabled } = request;
    if (feature === "highContrast") {
      state.highContrast = enabled;
      
      // Apply to all tabs, not just the current one
      applyToAllTabs("highContrast", enabled);
      
      // Save state to storage for persistence
      chrome.storage.sync.set({ accessibilityState: state });
      sendResponse({ status: "success", state });
      return true;
    }
    
    if (feature === "dyslexiaFont") {
      state.dyslexiaFont = enabled;
      
      // Apply to all tabs, not just the current one
      applyToAllTabs("dyslexiaFont", enabled);
      
      // Save state to storage for persistence
      chrome.storage.sync.set({ accessibilityState: state });
      sendResponse({ status: "success", state });
      return true;
    }

    if (feature === "readingLine") {
      state.readingLine = enabled;
      
      // Apply to all tabs, not just the current one
      applyToAllTabs("readingLine", enabled);
      
      // Save state to storage for persistence
      chrome.storage.sync.set({ accessibilityState: state });
      sendResponse({ status: "success", state });
      return true;
    }

    if (feature === "textScaling") {
      state.textScaling.enabled = enabled;
      
      if (enabled) {
        // Apply the default value (100%) when enabled
        state.textScaling.value = 100;
      }
      
      // Apply to all tabs
      applyTextScalingToAllTabs(enabled, state.textScaling.value);
      
      // Save state to storage for persistence
      chrome.storage.sync.set({ accessibilityState: state });
      sendResponse({ status: "success", state });
      return true;
    }
    
    if (feature === "lineHeight") {
      state.lineHeight.enabled = enabled;
      
      if (enabled) {
        // Apply the default value (1.5) when enabled
        state.lineHeight.value = 1.5;
      }
      
      // Apply to all tabs
      applyLineHeightToAllTabs(enabled, state.lineHeight.value);
      
      // Save state to storage for persistence
      chrome.storage.sync.set({ accessibilityState: state });
      sendResponse({ status: "success", state });
      return true;
    }
    // Add other features here in the future
  }
  
  // Listen for state updates from content scripts 
  if (request.action === "updateState") {
    if (request.feature === "highContrast") {
      state.highContrast = request.enabled;
      chrome.storage.sync.set({ accessibilityState: state });
      // Broadcast state change to popup if it's open
      chrome.runtime.sendMessage({ 
        action: "stateUpdated", 
        state: state 
      }).catch(() => {
        // Ignore errors if popup is not open to receive the message
      });
      return true;
    }
    
    if (request.feature === "dyslexiaFont") {
      state.dyslexiaFont = request.enabled;
      chrome.storage.sync.set({ accessibilityState: state });
      // Broadcast state change to popup if it's open
      chrome.runtime.sendMessage({ 
        action: "stateUpdated", 
        state: state 
      }).catch(() => {
        // Ignore errors if popup is not open to receive the message
      });
      return true;
    }

    if (request.feature === "readingLine") {
      state.readingLine = request.enabled;
      chrome.storage.sync.set({ accessibilityState: state });
      // Broadcast state change to popup if it's open
      chrome.runtime.sendMessage({ 
        action: "stateUpdated", 
        state: state 
      }).catch(() => {
        // Ignore errors if popup is not open to receive the message
      });
      return true;
    }
  }

  // Handle value changes for sliders
  if (request.action === "updateTextScaling") {
    state.textScaling.value = request.value;
    
    // Apply to all tabs
    applyTextScalingToAllTabs(state.textScaling.enabled, request.value);
    
    // Save state to storage for persistence
    chrome.storage.sync.set({ accessibilityState: state });
    sendResponse({ status: "success", state });
    return true;
  }
  
  if (request.action === "updateLineHeight") {
    state.lineHeight.value = request.value;
    
    // Apply to all tabs
    applyLineHeightToAllTabs(state.lineHeight.enabled, request.value);
    
    // Save state to storage for persistence
    chrome.storage.sync.set({ accessibilityState: state });
    sendResponse({ status: "success", state });
    return true;
  }
  
  // New message type to check if reading line is active and reinitialize it if needed
  if (request.action === "checkReadingLine") {
    sendResponse({ 
      shouldActivate: state.readingLine 
    });
    return true;
  }

  return false;
});

// Function to apply settings to all tabs
async function applyToAllTabs(feature: string, enable: boolean): Promise<void> {
  try {
    // Get all tabs
    const tabs = await chrome.tabs.query({});
    
    // For each tab
    for (const tab of tabs) {
      if (!tab.id || !tab.url || !tab.url.startsWith('http')) continue;
      
      const tabId = tab.id;
      
      // Apply the appropriate CSS if needed
      if (enable) {
        try {
          if (feature === "highContrast") {
            await chrome.scripting.insertCSS({
              target: { tabId },
              files: ["/high-contrast.css"]
            });
          } else if (feature === "dyslexiaFont") {
            await chrome.scripting.insertCSS({
              target: { tabId },
              files: ["/dyslexic.css"]
            });
          } else if (feature === "readingLine") {
            await chrome.scripting.insertCSS({
              target: { tabId },
              files: ["/reading-line.css"]
            });
          }
        } catch (err) {
          console.error(`Failed to insert CSS into tab ${tabId}:`, err);
          // Continue with other tabs even if this one fails
        }
      }
      
      // Send message to content script with error handling
      try {
        // Wait for confirmation that the message was received
        chrome.tabs.sendMessage(tabId, {
          action: feature === "highContrast" ? "toggleHighContrast" : 
                  feature === "dyslexiaFont" ? "toggleDyslexiaFont" : 
                  "toggleReadingLine",
          enabled: enable
        }, (response) => {
          if (chrome.runtime.lastError) {
            console.error(`Error sending message to tab ${tabId}:`, chrome.runtime.lastError);
            // Content script might not be ready, try injecting it first
            chrome.scripting.executeScript({
              target: { tabId },
              files: ['content-script.js']
            }).then(() => {
              // Retry sending message after script is injected
              setTimeout(() => {
                chrome.tabs.sendMessage(tabId, {
                  action: feature === "highContrast" ? "toggleHighContrast" : 
                          feature === "dyslexiaFont" ? "toggleDyslexiaFont" : 
                          "toggleReadingLine",
                  enabled: enable
                });
              }, 100);
            }).catch(err => console.error(`Error injecting content script into tab ${tabId}:`, err));
          } else if (response && response.status === "success") {
            console.log(`Successfully applied ${feature}=${enable} to tab ${tabId}`);
          }
        });
      } catch (err) {
        console.error(`Error sending message to tab ${tabId}:`, err);
      }
    }
  } catch (error) {
    console.error(`Error applying ${feature}:`, error);
  }
}

// Function to apply high contrast to the current tab - legacy function
export async function applyHighContrast(enable: boolean): Promise<void> {
  // This function is kept for backwards compatibility but delegates to applyToAllTabs now
  applyToAllTabs("highContrast", enable);
}

// Function to apply dyslexia font to the current tab - legacy function
export async function applyDyslexiaFont(enable: boolean): Promise<void> {
  // This function is kept for backwards compatibility but delegates to applyToAllTabs now
  applyToAllTabs("dyslexiaFont", enable);
}

// Function to apply reading line to the current tab - legacy function 
export async function applyReadingLine(enable: boolean): Promise<void> {
  // This function is kept for backwards compatibility but delegates to applyToAllTabs now
  applyToAllTabs("readingLine", enable);
}

// Function to apply text scaling to all tabs
async function applyTextScalingToAllTabs(enabled: boolean, value: number): Promise<void> {
  try {
    const tabs = await chrome.tabs.query({});
    for (const tab of tabs) {
      if (!tab.id || !tab.url || !tab.url.startsWith('http')) continue;
      const tabId = tab.id;
      
      // Send message to content script with proper error handling
      try {
        chrome.tabs.sendMessage(tabId, {
          action: "updateTextScaling",
          enabled,
          value
        }, (response) => {
          if (chrome.runtime.lastError) {
            console.log(`Tab ${tabId} not ready for text scaling, injecting content script first`);
            // Content script not ready, inject it first and retry
            chrome.scripting.executeScript({
              target: { tabId },
              files: ['content-script.js']
            }).then(() => {
              // Retry sending message after script is injected with a short delay
              setTimeout(() => {
                chrome.tabs.sendMessage(tabId, {
                  action: "updateTextScaling",
                  enabled,
                  value
                }).catch(err => {
                  // Just log and continue if this fails too
                  console.log(`Retry failed for tab ${tabId}:`, err);
                });
              }, 200);
            }).catch(err => {
              console.log(`Script injection failed for tab ${tabId}:`, err);
              // The tab might not support content scripts (e.g. chrome:// URLs)
            });
          } else if (response && response.status === "success") {
            console.log(`Successfully applied text scaling=${value} to tab ${tabId}`);
          }
        });
      } catch (err) {
        // This catch is just a safeguard, most errors should be caught by the callback
        console.log(`Error applying text scaling to tab ${tabId}:`, err);
      }
    }
  } catch (error) {
    console.log(`Error getting tabs:`, error);
  }
}

// Function to apply line height to all tabs
async function applyLineHeightToAllTabs(enabled: boolean, value: number): Promise<void> {
  try {
    const tabs = await chrome.tabs.query({});
    for (const tab of tabs) {
      if (!tab.id || !tab.url || !tab.url.startsWith('http')) continue;
      const tabId = tab.id;
      
      // Send message to content script with proper error handling
      try {
        chrome.tabs.sendMessage(tabId, {
          action: "updateLineHeight",
          enabled,
          value
        }, (response) => {
          if (chrome.runtime.lastError) {
            console.log(`Tab ${tabId} not ready for line height, injecting content script first`);
            // Content script not ready, inject it first and retry
            chrome.scripting.executeScript({
              target: { tabId },
              files: ['content-script.js']
            }).then(() => {
              // Also inject CSS if enabled
              if (enabled) {
                return chrome.scripting.insertCSS({
                  target: { tabId },
                  files: ["/reading-line.css"]
                }).catch(err => console.log(`CSS injection error for tab ${tabId}:`, err));
              }
            }).then(() => {
              // Retry sending message after script is injected with a short delay
              setTimeout(() => {
                chrome.tabs.sendMessage(tabId, {
                  action: "updateLineHeight",
                  enabled,
                  value
                }).catch(err => {
                  // Just log and continue if this fails too
                  console.log(`Retry failed for tab ${tabId}:`, err);
                });
              }, 200);
            }).catch(err => {
              console.log(`Script injection failed for tab ${tabId}:`, err);
              // The tab might not support content scripts (e.g. chrome:// URLs)
            });
          } else if (response && response.status === "success") {
            console.log(`Successfully applied line height=${value} to tab ${tabId}`);
          }
        });
      } catch (err) {
        // This catch is just a safeguard, most errors should be caught by the callback
        console.log(`Error applying line height to tab ${tabId}:`, err);
      }
    }
  } catch (error) {
    console.log(`Error getting tabs:`, error);
  }
}

// Initialize by loading state from storage
chrome.storage.sync.get("accessibilityState", (result) => {
  if (result.accessibilityState) {
    Object.assign(state, result.accessibilityState);
    console.log("Loaded settings from storage:", state);
  }
});

// When a new tab is activated, check if we need to apply settings
chrome.tabs.onActivated.addListener(async (activeInfo) => {
  // Get the tab information
  try {
    const tab = await chrome.tabs.get(activeInfo.tabId);
    if (!tab.url || !tab.url.startsWith('http')) return;
    
    if (state.highContrast) {
      try {
        await chrome.scripting.insertCSS({
          target: { tabId: activeInfo.tabId },
          files: ["/high-contrast.css"]
        });
      } catch (err) {
        console.error("Error inserting high contrast CSS:", err);
      }
    }
    
    if (state.dyslexiaFont) {
      try {
        await chrome.scripting.insertCSS({
          target: { tabId: activeInfo.tabId },
          files: ["/dyslexic.css"]
        });
      } catch (err) {
        console.error("Error inserting dyslexia CSS:", err);
      }
    }
    
    if (state.readingLine) {
      try {
        await chrome.scripting.insertCSS({
          target: { tabId: activeInfo.tabId },
          files: ["/reading-line.css"]
        });
        
        // Force reinitialize the reading line in this tab
        chrome.tabs.sendMessage(activeInfo.tabId, {
          action: "toggleReadingLine",
          enabled: true
        }).catch(err => console.error("Error toggling reading line:", err));
        
      } catch (err) {
        console.error("Error inserting reading line CSS:", err);
      }
    }
  } catch (err) {
    console.error("Error getting tab info:", err);
  }
});

// Enhanced handling for visibility changes (e.g., coming back after minimizing browser)
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url && tab.url.startsWith('http')) {
    // First inject the content script
    chrome.scripting.executeScript({
      target: { tabId },
      files: ['content-script.js'] 
    }).then(() => {
      // After script is injected, apply any active accessibility features
      if (state.highContrast) {
        chrome.tabs.sendMessage(tabId, {
          action: "toggleHighContrast",
          enabled: true
        }).catch(err => console.error("Error applying high contrast:", err));
      }
      
      if (state.dyslexiaFont) {
        chrome.tabs.sendMessage(tabId, {
          action: "toggleDyslexiaFont",
          enabled: true
        }).catch(err => console.error("Error applying dyslexia font:", err));
      }
      
      if (state.readingLine) {
        // First ensure CSS is loaded
        chrome.scripting.insertCSS({
          target: { tabId },
          files: ["/reading-line.css"]
        }).then(() => {
          // Then apply the reading line
          chrome.tabs.sendMessage(tabId, {
            action: "toggleReadingLine",
            enabled: true
          }).catch(err => console.error("Error applying reading line:", err));
        }).catch(err => console.error("Error inserting reading line CSS:", err));
      }
      
      // Apply text scaling if enabled
      if (state.textScaling && state.textScaling.enabled) {
        chrome.tabs.sendMessage(tabId, {
          action: "updateTextScaling",
          enabled: true,
          value: state.textScaling.value
        }).catch(err => console.log("Non-critical: Error applying text scaling on page load:", err));
      }
      
      // Apply line height if enabled
      if (state.lineHeight && state.lineHeight.enabled) {
        chrome.tabs.sendMessage(tabId, {
          action: "updateLineHeight",
          enabled: true,
          value: state.lineHeight.value
        }).catch(err => console.log("Non-critical: Error applying line height on page load:", err));
      }
    }).catch(err => {
      console.log(`Error injecting content script into tab ${tabId} (this is normal for some pages):`, err);
    });
  }
});