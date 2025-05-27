// Define the valid colour blind types
type ColorBlindType = 'deuteranopia' | 'protanopia' | 'tritanopia';

// Define the state for colourblind accessibility feature
interface ColorBlindState {
  enabled: boolean;
  deuteranopia: boolean;
  protanopia: boolean;
  tritanopia: boolean;
}

// Global state for accessibility features
interface AccessibilityState {
  highContrast: boolean;
  dyslexiaFont: boolean;
  readingLine: boolean;
  focusMode: boolean;
  colorBlind: ColorBlindState;
  textScaling: {
    enabled: boolean;
    value: number;  // 100 = default (middle), can be decreased or increased
  };
  lineHeight: {
    enabled: boolean;
    value: number;  // 1.5 = default (middle), can be decreased or increased
  };
  reducedMotion: boolean;
  keyboardNav: boolean;
  largeTargets: {
    enabled: boolean;
    value: number;  // 1.5 = default (middle), can be decreased or increased
  };  
  customCursor: boolean;
  autoScroll: boolean;
  hoverControls: boolean;
  highlightLinks: boolean;
  readingProgress: boolean;
  imageDescriptions: boolean;
  // Add other accessibility features as needed
}

// Track the timestamp of the last turn off all action
let turnOffAllTimestamp = 0;

const state: AccessibilityState = {
  highContrast: false,
  dyslexiaFont: false,
  readingLine: false,
  focusMode: false,
  colorBlind: {
    enabled: false,
    deuteranopia: false,
    protanopia: false,
    tritanopia: false
  },
  textScaling: {
    enabled: false,
    value: 100   // Default scale (100%)
  },
  lineHeight: {
    enabled: false,
    value: 1.5    // Default line height
  },
  reducedMotion: false,
  keyboardNav: false,
  largeTargets: {
    enabled: false,
    value: 1.5    // Default scale factor (1.5x)  
  },  
  customCursor: false,
  autoScroll: false,
  hoverControls: false,
  highlightLinks: false,
  readingProgress: false,
  imageDescriptions: false
};

// Debounced storage function to prevent excessive writes to Chrome storage
const storageWriteDebouncer = (() => {
  let timeout: number | null = null;
  let pendingWrites: Partial<AccessibilityState> = {};
  let isWriting = false;
  
  return {
    update: (updates: Partial<AccessibilityState>) => {
      pendingWrites = { ...pendingWrites, ...updates };
      
      if (timeout) {
        clearTimeout(timeout);
      }
      
      if (!isWriting) {
        timeout = window.setTimeout(() => {
          const currentUpdates = { ...pendingWrites };
          pendingWrites = {};
          isWriting = true;
          
          chrome.storage.sync.set({ accessibilityState: { ...state, ...currentUpdates } })
            .then(() => {
              console.log("State updated and saved to storage successfully");
              isWriting = false;
              if (Object.keys(pendingWrites).length > 0) {
                // If more updates came in while we were writing, process them
                storageWriteDebouncer.update({});
              }
            })
            .catch(error => {
              console.error("Error saving state to chrome.storage.sync:", error);
              isWriting = false;
            });
        }, 300); // Debounce by 300ms
      }
    }
  };
})();

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
  
  // Handle sync request from content script when colourblind filters are disabled
  if (request.action === "syncColorBlindState") {
    // Update our internal state with the state from the content script
    if (request.state) {
      state.colorBlind = request.state;
      
      // Apply the change to all tabs to ensure consistency
      if (!state.colorBlind.enabled) {
        // Turn off all types on all tabs
        Promise.all([
          applyColorBlindToAllTabs("deuteranopia", false),
          applyColorBlindToAllTabs("protanopia", false),
          applyColorBlindToAllTabs("tritanopia", false)
        ]).then(() => {
          chrome.storage.sync.set({ accessibilityState: state });
          sendResponse({ status: "success", state });
          
          // Also notify popup of state change if it's open
          chrome.runtime.sendMessage({ 
            action: "stateUpdated", 
            state: state 
          }).catch(() => {
            // Ignore errors if popup is not open to receive the message
          });
        }).catch((error) => {
          console.error("Error syncing colorblind state:", error);
          sendResponse({ status: "error", message: error.toString() });
        });
        return true;
      }
    }
    
    sendResponse({ status: "success", state });
    return true;
  }
    if (request.action === "turnOffAll") {
    console.log("Turn All Off: Disabling all accessibility features");
    
    // Reset all state values to false
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
    state.keyboardNav = false;
    state.largeTargets.enabled = false;
    state.customCursor = false;
    state.autoScroll = false;    
    state.focusMode = false;
    state.hoverControls = false;
    state.highlightLinks = false;
    state.readingProgress = false;
    state.imageDescriptions = false;
    
    // Set a timestamp for the turnOffAll action to prevent race conditions
    turnOffAllTimestamp = Date.now();
    
    console.log("Turn All Off: Setting hover controls to false in state");
    
    // Save state to storage immediately (very important to ensure persistence)
    chrome.storage.sync.set({ 
      accessibilityState: state,
      turnOffAllTimestamp: turnOffAllTimestamp
    });
    
    // Log that we're starting to apply changes to all tabs
    console.log("Turn All Off: Starting to apply changes to all tabs");
    
    // Handle hover controls first to ensure it gets priority
    const hoverControlsPromise = applyHoverControlsToAllTabs(false)
      .then(() => {
        console.log("Turn All Off: Successfully disabled hover controls on all tabs");
      })
      .catch(error => {
        console.error("Turn All Off: Error disabling hover controls:", error);
      });
    
    // Use Promise.all to wait for all async operations to complete
    Promise.all([
      hoverControlsPromise, // Already started above
      applyToAllTabs("highContrast", false),
      applyToAllTabs("dyslexiaFont", false),
      applyToAllTabs("readingLine", false),
      applyToAllTabs("focusMode", false),
      applyColorBlindToAllTabs("deuteranopia", false),
      applyColorBlindToAllTabs("protanopia", false),
      applyColorBlindToAllTabs("tritanopia", false),
      applyTextScalingToAllTabs(false, state.textScaling.value),
      applyLineHeightToAllTabs(false, state.lineHeight.value),
      applyReducedMotionToAllTabs(false),
      applyKeyboardNavToAllTabs(false),
      applyLargeTargetsToAllTabs(false),
      applyCustomCursorToAllTabs(false),
      applyAutoScrollToAllTabs(false),
      applyHighlightLinksToAllTabs(false),
      applyReadingProgressToAllTabs(false),
      applyImageDescriptionsToAllTabs(false)
    ]).then(() => {
      console.log("Turn All Off: All features disabled successfully");
      // Send response only after all operations complete
      sendResponse({ status: "success", state });
    }).catch((error) => {
      console.error("Error turning off all features:", error);
      sendResponse({ status: "success", state });
    });
    
    // Return true to send a response asynchronously
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
      sendResponse({ status: "success", state });      return true;
    }    if (feature === "focusMode") {
      state.focusMode = enabled;
      
      // Apply to all tabs, not just the current one
      applyToAllTabs("focusMode", enabled);
      
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
    
    if (feature === "readingProgress") {
      state.readingProgress = enabled;
      
      // Apply to all tabs
      applyReadingProgressToAllTabs(enabled);
      
      // Save state to storage for persistence
      chrome.storage.sync.set({ accessibilityState: state });
      sendResponse({ status: "success", state });
      return true;
    }
    
    if (feature === "imageDescriptions") {
      state.imageDescriptions = enabled;
      
      // Apply to all tabs
      applyImageDescriptionsToAllTabs(enabled);
      
      // Save state to storage for persistence
      chrome.storage.sync.set({ accessibilityState: state });
      sendResponse({ status: "success", state });
      return true;
    }
    
    if (feature === "colorBlind") {
      const { type, fullState } = request as { type?: ColorBlindType, fullState?: ColorBlindState };
      
      // If the request includes a complete state object, use that directly
      if (fullState) {
        // First disable all existing colourblind filters
        if (state.colorBlind.deuteranopia) {
          applyColorBlindToAllTabs("deuteranopia", false);
        }
        if (state.colorBlind.protanopia) {
          applyColorBlindToAllTabs("protanopia", false);
        }
        if (state.colorBlind.tritanopia) {
          applyColorBlindToAllTabs("tritanopia", false);
        }
        
        // Update the state with the new values
        state.colorBlind = fullState;
        
        // Apply only the active filter
        if (fullState.enabled) {
          if (state.colorBlind.deuteranopia) {
            applyColorBlindToAllTabs("deuteranopia", true);
          }
          if (state.colorBlind.protanopia) {
            applyColorBlindToAllTabs("protanopia", true);
          }
          if (state.colorBlind.tritanopia) {
            applyColorBlindToAllTabs("tritanopia", true);
          }
        }
        
        // Save state to storage
        chrome.storage.sync.set({ accessibilityState: state });
        sendResponse({ status: "success", state });
        return true;
      } 
      else if (type) {
        // If enabling a filter, first disable all other types
        if (enabled) {
          // Disable all filters first, including the one being updated
          if (state.colorBlind.deuteranopia) {
            applyColorBlindToAllTabs("deuteranopia", false);
          }
          if (state.colorBlind.protanopia) {
            applyColorBlindToAllTabs("protanopia", false);
          }
          if (state.colorBlind.tritanopia) {
            applyColorBlindToAllTabs("tritanopia", false);
          }
          
          // Update internal state - all filters off except the one being enabled
          state.colorBlind.deuteranopia = false;
          state.colorBlind.protanopia = false;
          state.colorBlind.tritanopia = false;
          state.colorBlind[type] = true;
          state.colorBlind.enabled = true;
        } else {
          // If disabling, just update the specific filter
          state.colorBlind[type] = false;
          
          // Apply the filter change to turn it off
          applyColorBlindToAllTabs(type, false);
          
          // Update the main enabled flag based on if any filter is still enabled
          state.colorBlind.enabled = state.colorBlind.deuteranopia || 
                                   state.colorBlind.protanopia || 
                                   state.colorBlind.tritanopia;
        }
        
        // Apply the filter change if enabling
        if (enabled) {
          applyColorBlindToAllTabs(type, true);
        }
        
        // Save state to storage for persistence
        chrome.storage.sync.set({ accessibilityState: state });
        sendResponse({ status: "success", state });
      } else {
        // If there's no specific type, toggle the main enabled flag
        state.colorBlind.enabled = enabled;
        
        if (!enabled) {
          // If disabling all colourblind modes, turn all types off
          state.colorBlind.deuteranopia = false;
          state.colorBlind.protanopia = false;
          state.colorBlind.tritanopia = false;
          
          // Turn off all types on all tabs
          Promise.all([
            applyColorBlindToAllTabs("deuteranopia", false),
            applyColorBlindToAllTabs("protanopia", false),
            applyColorBlindToAllTabs("tritanopia", false)
          ]).then(() => {
            chrome.storage.sync.set({ accessibilityState: state });
            sendResponse({ status: "success", state });
          }).catch((error) => {
            console.error("Error turning off colorblind filters:", error);
            // Still send a success response to ensure popup gets updated
            sendResponse({ status: "success", state });
          });
          return true;
        } else {
          chrome.storage.sync.set({ accessibilityState: state });
          sendResponse({ status: "success", state });
        }
      }
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

    if (feature === "reducedMotion") {
      state.reducedMotion = enabled;
      
      // Apply to all tabs
      applyReducedMotionToAllTabs(enabled);
      
      // Save state to storage for persistence
      chrome.storage.sync.set({ accessibilityState: state }, () => {
        // Ensure popup gets updated state
        chrome.runtime.sendMessage({ 
          action: "stateUpdated", 
          state: state 
        }).catch(() => {
          // Ignore errors if popup is not open
        });
      });
      
      sendResponse({ status: "success", state });
      return true;
    }    if (feature === "largeTargets") {
      state.largeTargets.enabled = enabled;
      
      if (enabled) {
        // Apply the default value (1.5) when enabled
        state.largeTargets.value = 1.5;
      }
      
      // Apply to all tabs
      applyLargeTargetsToAllTabs(enabled);
      
      // Save state to storage for persistence
      chrome.storage.sync.set({ accessibilityState: state }, () => {
        // Ensure popup gets updated state
        chrome.runtime.sendMessage({ 
          action: "stateUpdated", 
          state: state 
        }).catch(() => {
          // Ignore errors if popup is not open
        });
      });
      
      sendResponse({ status: "success", state });
      return true;
    }    if (feature === "customCursor") {
      state.customCursor = request.enabled;
      
      // Apply to all tabs
      applyCustomCursorToAllTabs(request.enabled);
      
      // Save state to storage for persistence
      chrome.storage.sync.set({ accessibilityState: state }, () => {
        // Ensure popup gets updated state
        chrome.runtime.sendMessage({ 
          action: "stateUpdated", 
          state: state 
        }).catch(() => {
          // Ignore errors if popup is not open
        });
      });
      
      sendResponse({ status: "success", state });
      return true;
    }
    
    if (feature === "autoScroll") {
      state.autoScroll = request.enabled;
      
      // Apply to all tabs
      applyAutoScrollToAllTabs(request.enabled);
      
      // Save state to storage for persistence
      chrome.storage.sync.set({ accessibilityState: state }, () => {
        // Ensure popup gets updated state
        chrome.runtime.sendMessage({ 
          action: "stateUpdated", 
          state: state 
        }).catch(() => {
          // Ignore errors if popup is not open
        });
      });
      
      sendResponse({ status: "success", state });
      return true;
    }    if (feature === "hoverControls") {
      state.hoverControls = request.enabled;
      
      // Apply to all tabs
      applyHoverControlsToAllTabs(request.enabled);
      
      // Save state to storage for persistence
      chrome.storage.sync.set({ accessibilityState: state }, () => {
        // Ensure popup gets updated state
        chrome.runtime.sendMessage({ 
          action: "stateUpdated", 
          state: state 
        }).catch(() => {
          // Ignore errors if popup is not open
        });
      });
      
      sendResponse({ status: "success", state });
      return true;
    }
    
    if (request.feature === "highlightLinks") {
      state.highlightLinks = request.enabled;
      
      // Apply to all tabs
      applyToAllTabs("highlightLinks", request.enabled);
      
      // Save state to storage for persistence
      chrome.storage.sync.set({ accessibilityState: state }, () => {
        // Ensure popup gets updated state
        chrome.runtime.sendMessage({ 
          action: "stateUpdated", 
          state: state 
        }).catch(() => {
          // Ignore errors if popup is not open
        });
      });
      
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

    if (request.feature === "focusMode") {
      state.focusMode = request.enabled;
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

    if (request.feature === "colorBlind") {
      const { type } = request as { type?: ColorBlindType };
      if (type) {
        state.colorBlind[type] = request.enabled;
        // Update the main enabled flag
        state.colorBlind.enabled = state.colorBlind.deuteranopia || 
                                  state.colorBlind.protanopia || 
                                  state.colorBlind.tritanopia;
      } else {
        state.colorBlind.enabled = request.enabled;
      }
      chrome.storage.sync.set({ accessibilityState: state });
      // Broadcast state change to popup if it's open
      chrome.runtime.sendMessage({ 
        action: "stateUpdated", 
        state: state 
      }).catch(() => {
        // Ignore errors if popup is not open to receive the message
      });
      return true;
    }    if (request.feature === "reducedMotion") {
      state.reducedMotion = request.enabled;
      chrome.storage.sync.set({ accessibilityState: state });
      // Broadcast state change to popup if it's open
      chrome.runtime.sendMessage({ 
        action: "stateUpdated", 
        state: state 
      }).catch(() => {
        // Ignore errors if popup is not open to receive the message
      });
      return true;
    }    if (request.feature === "keyboardNav") {
      if (typeof request.enabled === 'boolean' && state.keyboardNav !== request.enabled) {
        state.keyboardNav = request.enabled;
        // Save state to storage
        chrome.storage.sync.set({ accessibilityState: state }, () => {
          if (chrome.runtime.lastError) {
            console.error("Error saving keyboardNav state to chrome.storage.sync:", chrome.runtime.lastError);
          } else {
            console.log("keyboardNav state saved to chrome.storage.sync:", state.keyboardNav);
            // Propagate this change to all tabs
            applyKeyboardNavToAllTabs(state.keyboardNav);
          }
        });
      }
      // Broadcast state change to popup if it's open, regardless of whether it changed,
      // as the request might have originated from a content script state sync.
      chrome.runtime.sendMessage({ 
        action: "stateUpdated", 
        state: state 
      }).catch(() => {
        // Ignore errors if popup is not open to receive the message
      });
      // sendResponse is not needed here as this is a state update, not a direct request needing a response to the sender.
      return true;    }
      
    if (request.feature === "customCursor") {
      state.customCursor = request.enabled;
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
      if (request.feature === "largeTargets") {
      state.largeTargets.enabled = request.enabled;
      if (request.value !== undefined) {
        state.largeTargets.value = request.value;
      }
      chrome.storage.sync.set({ accessibilityState: state });
      
      // Broadcast state change to popup if it's open
      chrome.runtime.sendMessage({ 
        action: "stateUpdated", 
        state: state 
      }).catch(() => {
        // Ignore errors if popup is not open to receive the message
      });
      return true;
    }    if (request.feature === "autoScroll") {
      state.autoScroll = request.enabled;
      chrome.storage.sync.set({ accessibilityState: state });
      
      // Broadcast state change to popup if it's open
      chrome.runtime.sendMessage({ 
        action: "stateUpdated", 
        state: state 
      }).catch(() => {
        // Ignore errors if popup is not open to receive the message
      });
      
      // If this was enabled, apply it to all tabs
      if (request.enabled) {
        applyAutoScrollToAllTabs(true);
      }
      
      return true;
    }

    if (request.feature === "hoverControls") {
      state.hoverControls = request.enabled;
      
      // Apply to all tabs
      applyHoverControlsToAllTabs(request.enabled);
      
      // Save state to storage for persistence
      chrome.storage.sync.set({ accessibilityState: state }, () => {
        // Ensure popup gets updated state
        chrome.runtime.sendMessage({ 
          action: "stateUpdated", 
          state: state 
        }).catch(() => {
          // Ignore errors if popup is not open
        });
      });
      
      sendResponse({ status: "success", state });
      return true;
    }
    
    if (request.feature === "highlightLinks") {
      state.highlightLinks = request.enabled;
      
      // Apply to all tabs
      applyToAllTabs("highlightLinks", request.enabled);
      
      // Save state to storage for persistence
      chrome.storage.sync.set({ accessibilityState: state }, () => {
        // Ensure popup gets updated state
        chrome.runtime.sendMessage({ 
          action: "stateUpdated", 
          state: state 
        }).catch(() => {
          // Ignore errors if popup is not open
        });
      });
      
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

    if (request.feature === "focusMode") {
      state.focusMode = request.enabled;
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

    if (request.feature === "colorBlind") {
      const { type } = request as { type?: ColorBlindType };
      if (type) {
        state.colorBlind[type] = request.enabled;
        // Update the main enabled flag
        state.colorBlind.enabled = state.colorBlind.deuteranopia || 
                                  state.colorBlind.protanopia || 
                                  state.colorBlind.tritanopia;
      } else {
        state.colorBlind.enabled = request.enabled;
      }
      chrome.storage.sync.set({ accessibilityState: state });
      // Broadcast state change to popup if it's open
      chrome.runtime.sendMessage({ 
        action: "stateUpdated", 
        state: state 
      }).catch(() => {
        // Ignore errors if popup is not open to receive the message
      });
      return true;
    }    if (request.feature === "reducedMotion") {
      state.reducedMotion = request.enabled;
      chrome.storage.sync.set({ accessibilityState: state });
      // Broadcast state change to popup if it's open
      chrome.runtime.sendMessage({ 
        action: "stateUpdated", 
        state: state 
      }).catch(() => {
        // Ignore errors if popup is not open to receive the message
      });
      return true;
    }    if (request.feature === "keyboardNav") {
      if (typeof request.enabled === 'boolean' && state.keyboardNav !== request.enabled) {
        state.keyboardNav = request.enabled;
        // Save state to storage
        chrome.storage.sync.set({ accessibilityState: state }, () => {
          if (chrome.runtime.lastError) {
            console.error("Error saving keyboardNav state to chrome.storage.sync:", chrome.runtime.lastError);
          } else {
            console.log("keyboardNav state saved to chrome.storage.sync:", state.keyboardNav);
            // Propagate this change to all tabs
            applyKeyboardNavToAllTabs(state.keyboardNav);
          }
        });
      }
      // Broadcast state change to popup if it's open, regardless of whether it changed,
      // as the request might have originated from a content script state sync.
      chrome.runtime.sendMessage({ 
        action: "stateUpdated", 
        state: state 
      }).catch(() => {
        // Ignore errors if popup is not open to receive the message
      });
      // sendResponse is not needed here as this is a state update, not a direct request needing a response to the sender.
      return true;    }
      
    if (request.feature === "customCursor") {
      state.customCursor = request.enabled;
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
      if (request.feature === "largeTargets") {
      state.largeTargets.enabled = request.enabled;
      if (request.value !== undefined) {
        state.largeTargets.value = request.value;
      }
      chrome.storage.sync.set({ accessibilityState: state });
      
      // Broadcast state change to popup if it's open
      chrome.runtime.sendMessage({ 
        action: "stateUpdated", 
        state: state 
      }).catch(() => {
        // Ignore errors if popup is not open to receive the message
      });
      return true;
    }    if (request.feature === "autoScroll") {
      state.autoScroll = request.enabled;
      chrome.storage.sync.set({ accessibilityState: state });
      
      // Broadcast state change to popup if it's open
      chrome.runtime.sendMessage({ 
        action: "stateUpdated", 
        state: state 
      }).catch(() => {
        // Ignore errors if popup is not open to receive the message
      });
      
      // If this was enabled, apply it to all tabs
      if (request.enabled) {
        applyAutoScrollToAllTabs(true);
      }
      
      return true;
    }    if (request.feature === "hoverControls") {
      state.hoverControls = request.enabled;
      
      // Apply to all tabs
      applyHoverControlsToAllTabs(request.enabled);
      
      // Save state to storage for persistence
      chrome.storage.sync.set({ accessibilityState: state }, () => {
        // Ensure popup gets updated state
        chrome.runtime.sendMessage({ 
          action: "stateUpdated", 
          state: state 
        }).catch(() => {
          // Ignore errors if popup is not open
        });
      });
      
      sendResponse({ status: "success", state });
      return true;
    }
    
    if (request.feature === "highlightLinks") {
      state.highlightLinks = request.enabled;
      
      // Apply to all tabs
      applyToAllTabs("highlightLinks", request.enabled);
      
      // Save state to storage for persistence
      chrome.storage.sync.set({ accessibilityState: state }, () => {
        // Ensure popup gets updated state
        chrome.runtime.sendMessage({ 
          action: "stateUpdated", 
          state: state 
        }).catch(() => {
          // Ignore errors if popup is not open
        });
      });
      
      sendResponse({ status: "success", state });
      return true;
    }
    // Add other features here in the future
  }
  
  // Listen for visibility changes
  if (request.action === "updateVisibility") {
    const { tabId, visible } = request;
    
    if (visible) {
      // Tab is becoming visible, reapply settings
      chrome.tabs.get(tabId, (tab) => {
        if (chrome.runtime.lastError || !tab.url || !tab.url.startsWith('http')) {
          return;
        }
        
        // Reapply all relevant settings
        if (state.highContrast) {
          chrome.tabs.sendMessage(tabId, { action: "toggleHighContrast", enabled: true });
        }
        
        if (state.dyslexiaFont) {
          chrome.tabs.sendMessage(tabId, { action: "toggleDyslexiaFont", enabled: true });
        }
        
        if (state.readingLine) {
          chrome.tabs.sendMessage(tabId, { action: "toggleReadingLine", enabled: true });
        }
        
        if (state.focusMode) {
          chrome.tabs.sendMessage(tabId, { action: "toggleFocusMode", enabled: true });
        }
        
        if (state.colorBlind.enabled) {
          if (state.colorBlind.deuteranopia) {
            chrome.tabs.sendMessage(tabId, { action: "toggleColorBlind", enabled: true, type: "deuteranopia" });
          }
          if (state.colorBlind.protanopia) {
            chrome.tabs.sendMessage(tabId, { action: "toggleColorBlind", enabled: true, type: "protanopia" });
          }
          if (state.colorBlind.tritanopia) {
            chrome.tabs.sendMessage(tabId, { action: "toggleColorBlind", enabled: true, type: "tritanopia" });
          }
        }
        
        if (state.reducedMotion) {
          chrome.tabs.sendMessage(tabId, { action: "toggleReducedMotion", enabled: true });
        }
        
        if (state.keyboardNav) {
          chrome.tabs.sendMessage(tabId, { action: "toggleKeyboardNav", enabled: true });
        }
        
        if (state.largeTargets.enabled) {
          chrome.tabs.sendMessage(tabId, { action: "toggleLargeTargets", enabled: true, value: state.largeTargets.value });
        }
        
        if (state.customCursor) {
          chrome.tabs.sendMessage(tabId, { action: "toggleCustomCursor", enabled: true });
        }
        
        if (state.autoScroll) {
          chrome.tabs.sendMessage(tabId, { action: "toggleAutoScroll", enabled: true });
        }
        
        if (state.hoverControls) {
          chrome.tabs.sendMessage(tabId, { action: "toggleHoverControls", enabled: true });
        }
        
        if (state.readingProgress) {
          chrome.tabs.sendMessage(tabId, { action: "toggleReadingProgress", enabled: true });
        }
      });
    } else {
      // Tab is becoming hidden, you might want to save state or perform other actions
    }
    
    return true;
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
  
  if (request.action === "updateLargeTargets") {
    state.largeTargets.value = request.value;
    
    // Apply to all tabs
    applyLargeTargetsToAllTabs(state.largeTargets.enabled);
    
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
      
      // Apply the CSS
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
          } else if (feature === "focusMode") {
            await chrome.scripting.insertCSS({
              target: { tabId },
              files: ["/focus-mode.css"]
            });
          } else if (feature === "highlightLinks") {
            await chrome.scripting.insertCSS({
              target: { tabId },
              files: ["/highlight-links.css"]
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
                  feature === "focusMode" ? "toggleFocusMode" :
                  feature === "highlightLinks" ? "toggleHighlightLinks" :
                  "toggleReadingLine",
          enabled: enable
        }, (response) => {
          if (chrome.runtime.lastError) {
            console.error(`Error sending message to tab ${tabId}:`, chrome.runtime.lastError);
            chrome.scripting.executeScript({
              target: { tabId },
              files: ['content-script.js']
            }).then(() => {
              // Retry sending message after script is injected
              setTimeout(() => {
                chrome.tabs.sendMessage(tabId, {
                  action: feature === "highContrast" ? "toggleHighContrast" : 
                          feature === "dyslexiaFont" ? "toggleDyslexiaFont" : 
                          feature === "focusMode" ? "toggleFocusMode" :
                          feature === "highlightLinks" ? "toggleHighlightLinks" :
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

// Function to apply colourblind mode to all tabs
async function applyColorBlindToAllTabs(type: ColorBlindType, enable: boolean): Promise<void> {
  try {
    // Get all tabs
    const tabs = await chrome.tabs.query({});
    
    // For each tab
    for (const tab of tabs) {
      if (!tab.id || !tab.url || !tab.url.startsWith('http')) continue;
      
      const tabId = tab.id;
      
      // Apply the CSS if needed
      if (enable) {
        try {
          await chrome.scripting.insertCSS({
            target: { tabId },
            files: [`/${type}.css`]
          });
        } catch (err) {
          console.error(`Failed to insert ${type} CSS into tab ${tabId}:`, err);
          // Continue with other tabs even if current one fails
        }
      } else {

        try {
          await chrome.scripting.executeScript({
            target: { tabId },
            func: (colorType) => {
              // Remove the specific colourblind class
              document.documentElement.classList.remove(`accessibility-${colorType}`);
              
              // Find and remove the specific colorblind stylesheet
              const links = document.querySelectorAll('link[rel="stylesheet"]');
              links.forEach(link => {
                const href = link.getAttribute('href');
                if (href && href.includes(`${colorType}.css`)) {
                  link.remove();
                }
              });
              
              // Let the content script know to update its state
              if (window.postMessage) {
                window.postMessage({
                  source: "accessibility-extension",
                  action: "colorBlindRemoved",
                  type: colorType
                }, "*");
              }
            },
            args: [type]
          });
        } catch (err) {
          console.error(`Error removing ${type} CSS from tab ${tabId}:`, err);
        }
      }
      
      // Send message to content script with error handling
      try {
        // Wait for confirmation that the message was received
        chrome.tabs.sendMessage(tabId, {
          action: "toggleColorBlind",
          enabled: enable,
          type: type,
          highContrastEnabled: state.highContrast // Always include high contrast state
        }, (response) => {
          if (chrome.runtime.lastError) {
            console.error(`Error sending colorblind message to tab ${tabId}:`, chrome.runtime.lastError);
            chrome.scripting.executeScript({
              target: { tabId },
              files: ['content-script.js']
            }).then(() => {
              // Retry sending message after script is injected
              setTimeout(() => {
                chrome.tabs.sendMessage(tabId, {
                  action: "toggleColorBlind",
                  enabled: enable,
                  type: type,
                  highContrastEnabled: state.highContrast // Always include high contrast state
                });
              }, 100);
            }).catch(err => console.error(`Error injecting content script for colorblind into tab ${tabId}:`, err));
          } else if (response && response.status === "success") {
            console.log(`Successfully applied ${type}=${enable} to tab ${tabId}`);
          }
        });
      } catch (err) {
        console.error(`Error sending colorblind message to tab ${tabId}:`, err);
      }
    }
  } catch (error) {
    console.error(`Error applying ${type}:`, error);
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

// Function to apply reduced motion to all tabs
async function applyReducedMotionToAllTabs(enabled: boolean): Promise<void> {
  try {
    const tabs = await chrome.tabs.query({});
    for (const tab of tabs) {
      if (!tab.id || !tab.url || !tab.url.startsWith('http')) continue;
      const tabId = tab.id;
      
      // Send message to content script with proper error handling
      try {
        chrome.tabs.sendMessage(tabId, {
          action: "toggleReducedMotion",
          enabled
        }, (response) => {
          if (chrome.runtime.lastError) {
            console.log(`Tab ${tabId} not ready for reduced motion, injecting content script first`);
            // Content script not ready, inject it first and retry
            chrome.scripting.executeScript({
              target: { tabId },
              files: ['content-script.js']
            }).then(() => {
              // Also inject CSS if enabled
              if (enabled) {
                return chrome.scripting.insertCSS({
                  target: { tabId },
                  files: ["/reduced-motion.css"]
                }).catch(err => console.log(`CSS injection error for tab ${tabId}:`, err));
              }
            }).then(() => {
              // Retry sending message after script is injected with a short delay
              setTimeout(() => {
                chrome.tabs.sendMessage(tabId, {
                  action: "toggleReducedMotion",
                  enabled
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
            console.log(`Successfully applied reduced motion=${enabled} to tab ${tabId}`);
          }
        });
      } catch (err) {
        // This catch is just a safeguard, most errors should be caught by the callback
        console.log(`Error applying reduced motion to tab ${tabId}:`, err);
      }
    }
  } catch (error) {
    console.log(`Error getting tabs:`, error);
  }
}

// Apply keyboard navigation to all tabs
async function applyKeyboardNavToAllTabs(enable: boolean): Promise<void> {
  try {
    const tabs = await chrome.tabs.query({});
    for (const tab of tabs) {
      if (tab.id && tab.url && (tab.url.startsWith('http://') || tab.url.startsWith('https://'))) {
        const tabId = tab.id;
        chrome.tabs.sendMessage(tabId, { action: "ping" }, (response) => {
          if (chrome.runtime.lastError) {
            console.log(`Content script not found in tab ${tabId} for keyboardNav. Injecting.`);
            chrome.scripting.executeScript({
              target: { tabId: tabId },
              files: ['content-script.js']
            }).then(() => {
              console.log(`Content script injected in tab ${tabId} for keyboardNav. Applying state.`);
              setTimeout(() => {
                chrome.tabs.sendMessage(tabId, {
                  action: "toggleKeyboardNav",
                  enabled: enable
                }).catch(err => console.warn(`Error sending toggleKeyboardNav to tab ${tabId} after injection:`, err.message));
              }, 100);
            }).catch(err => console.error(`Failed to inject content script in tab ${tabId} for keyboardNav:`, err.message));
          } else {
            if (response && response.status === "pong") {
              console.log(`Content script active in tab ${tabId}. Sending toggleKeyboardNav.`);
              chrome.tabs.sendMessage(tabId, {
                action: "toggleKeyboardNav",
                enabled: enable
              }).catch(err => console.warn(`Error sending toggleKeyboardNav to active tab ${tabId}:`, err.message));
            } else {
               console.warn(`Content script in tab ${tabId} responded unexpectedly to ping or no response status.`);
            }
          }
        });
      }
    }
  } catch (error) {
    console.error("Error in applyKeyboardNavToAllTabs:", error);
  }
}

// Function to apply large targets to all tabs
async function applyLargeTargetsToAllTabs(enabled: boolean): Promise<void> {
  try {
    const tabs = await chrome.tabs.query({});
    for (const tab of tabs) {
      if (!tab.id || !tab.url || !tab.url.startsWith('http')) continue;
      const tabId = tab.id;
      
      // Send message to content script with proper error handling
      try {
        chrome.tabs.sendMessage(tabId, {
          action: "toggleLargeTargets",
          enabled
        }, (response) => {
          if (chrome.runtime.lastError) {
            console.log(`Tab ${tabId} not ready for large targets, injecting content script first`);
            // Content script not ready, inject it first and retry
            chrome.scripting.executeScript({
              target: { tabId },
              files: ['content-script.js']
            }).then(() => {
              // Also inject CSS if enabled
              if (enabled) {
                return chrome.scripting.insertCSS({
                  target: { tabId },
                  files: ["/large-targets.css"]
                }).catch(err => console.log(`CSS injection error for tab ${tabId}:`, err));
              } else {

                return Promise.resolve();
              }
            }).then(() => {              // Retry sending message after script is injected with a short delay
              setTimeout(() => {
                try {
                  chrome.tabs.sendMessage(tabId, {
                    action: "toggleLargeTargets",
                    enabled
                  }, (retryResponse) => {
                    // Check for lastError without accessing it directly
                    if (chrome.runtime.lastError) {
                      console.log(`Retry still failed for tab ${tabId}, but continuing: ${chrome.runtime.lastError.message}`);
                    } else if (retryResponse && retryResponse.status === "success") {
                      console.log(`Successfully applied large targets=${enabled} to tab ${tabId} on retry`);
                    }
                  });
                } catch (retryErr) {
                  // Just log and continue if this fails too
                  console.log(`Retry exception for tab ${tabId}:`, retryErr);
                }
              }, 300); // Increased delay to give more time for content script to initialize
            }).catch(err => {
              console.log(`Script injection failed for tab ${tabId}:`, err);
              // The tab might not support content scripts (e.g. chrome:// URLs)
            });
          } else if (response && response.status === "success") {
            console.log(`Successfully applied large targets=${enabled} to tab ${tabId}`);
          }
        });
      } catch (err) {
        // This catch is just a safeguard, most errors should be caught by the callback
        console.log(`Error applying large targets to tab ${tabId}:`, err);
      }
    }
  } catch (error) {
    console.log(`Error getting tabs:`, error);
  }
}

// Function to apply custom cursor to all tabs
async function applyCustomCursorToAllTabs(enabled: boolean): Promise<void> {
  try {
    const tabs = await chrome.tabs.query({});
    for (const tab of tabs) {
      if (!tab.id || !tab.url || !tab.url.startsWith('http')) continue;
      const tabId = tab.id;
      
      // Send message to content script with proper error handling
      try {
        // First, check if CSS needs to be injected directly (more reliable than messaging)
        if (enabled) {
          try {
            await chrome.scripting.insertCSS({
              target: { tabId },
              files: ['custom-cursor.css']
            });
            console.log(`CSS injected directly for custom cursor in tab ${tabId}`);
          } catch (cssErr) {
            console.log(`Could not inject CSS directly, will try via content script: ${cssErr}`);
          }
        }
        
        // Send the message to the content script
        chrome.tabs.sendMessage(tabId, {
          action: "toggleCustomCursor",
          enabled
        }, (response) => {
          // Always check chrome.runtime.lastError in callbacks
          if (chrome.runtime.lastError) {
            console.log(`Tab ${tabId} not ready for custom cursor: ${chrome.runtime.lastError.message}`);
            // Content script not ready, inject it first and retry
            chrome.scripting.executeScript({
              target: { tabId },
              files: ['content-script.js']
            }).then(() => {
              // Wait a moment for the script to initialize
              setTimeout(() => {
                try {
                  chrome.tabs.sendMessage(tabId, {
                    action: "toggleCustomCursor",
                    enabled
                  }, (retryResponse) => {
                    // Check for lastError again without accessing it directly
                    if (chrome.runtime.lastError) {
                      console.log(`Retry failed for custom cursor in tab ${tabId}: ${chrome.runtime.lastError.message}`);
                    } else if (retryResponse && retryResponse.status === "success") {
                      console.log(`Successfully applied custom cursor=${enabled} to tab ${tabId} on retry`);
                    }
                  });
                } catch (retryErr) {
                  console.log(`Exception during retry for tab ${tabId}:`, retryErr);
                }
              }, 300); // Increased delay to ensure content script is ready
            }).catch(err => console.error('Error injecting content script:', err));
          } else if (response && response.status === "success") {
            console.log(`Successfully applied custom cursor=${enabled} to tab ${tabId}`);
          }
        });
      } catch (error) {
        console.error(`Error in tab ${tabId}:`, error);
      }
    }
  } catch (error) {
    console.error("Error applying custom cursor to all tabs:", error);
  }
}

// Function to apply auto-scroll to all tabs
async function applyAutoScrollToAllTabs(enabled: boolean): Promise<void> {
  try {
    const tabs = await chrome.tabs.query({});
    for (const tab of tabs) {
      if (!tab.id || !tab.url || !tab.url.startsWith('http')) continue;
      const tabId = tab.id;
      
      // Send message to content script with proper error handling
      try {
        // First, check if CSS needs to be injected directly (more reliable than messaging)
        if (enabled) {
          try {
            await chrome.scripting.insertCSS({
              target: { tabId },
              files: ['auto-scroll.css']
            });
            console.log(`CSS injected directly for auto-scroll in tab ${tabId}`);
          } catch (cssErr) {
            console.log(`Could not inject CSS directly, will try via content script: ${cssErr}`);
          }
        }
        
        // Send the message to the content script
        chrome.tabs.sendMessage(tabId, {
          action: "toggleAutoScroll",
          enabled
        }, (response) => {
          if (chrome.runtime.lastError) {
            console.log(`Content script not ready in tab ${tabId}, injecting it first: ${chrome.runtime.lastError.message}`);
            
            // Inject the content script and try again
            chrome.scripting.executeScript({
              target: { tabId },
              files: ['content-script.js']
            }).then(() => {
              // Wait a bit for the script to initialize
              setTimeout(() => {
                // Try sending the message again after script injection
                chrome.tabs.sendMessage(tabId, {
                  action: "toggleAutoScroll",
                  enabled
                }, (secondResponse) => {
                  if (chrome.runtime.lastError) {
                    console.log(`Failed to apply auto-scroll after script injection: ${chrome.runtime.lastError.message}`);
                  } else if (secondResponse && secondResponse.status === "success") {
                    console.log(`Successfully applied auto-scroll=${enabled} to tab ${tabId} after script injection`);
                  }
                });
              }, 300); // Increased delay to give more time for content script to initialize
            }).catch(err => {
              console.log(`Script injection failed for tab ${tabId}:`, err);
              // The tab might not support content scripts (e.g. chrome:// URLs)
            });
          } else if (response && response.status === "success") {
            console.log(`Successfully applied auto-scroll=${enabled} to tab ${tabId}`);
          }
        });
      } catch (err) {
        // This catch is just a safeguard, most errors should be caught by the callback
        console.log(`Error applying auto-scroll to tab ${tabId}:`, err);
      }
    }
  } catch (error) {
    console.log(`Error getting tabs:`, error);
  }
}

chrome.storage.sync.get(["accessibilityState", "turnOffAllTimestamp"], (result) => {
  if (result.accessibilityState) {
    Object.assign(state, result.accessibilityState);
    console.log("Loaded settings from storage:", state);
  }
  
  // Restore the turnOffAllTimestamp if available
  if (result.turnOffAllTimestamp) {
    turnOffAllTimestamp = result.turnOffAllTimestamp;
    console.log("Restored Turn All Off timestamp:", turnOffAllTimestamp);
  }
});

// When a new tab is activated, check to apply settings
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
    
    if (state.focusMode) {
      try {
        await chrome.scripting.insertCSS({
          target: { tabId: activeInfo.tabId },
          files: ["/focus-mode.css"]
        });
        
        // Force reinitialize the focus mode in this tab
        chrome.tabs.sendMessage(activeInfo.tabId, {
          action: "toggleFocusMode",
          enabled: true
        }).catch(err => console.error("Error toggling focus mode:", err));
        
      } catch (err) {
        console.error("Error inserting focus mode CSS:", err);
      }
    }

    if (state.colorBlind.enabled) {
      try {
        if (state.colorBlind.deuteranopia) {
          await chrome.scripting.insertCSS({
            target: { tabId: activeInfo.tabId },
            files: ["/deuteranopia.css"]
          });
        }
        if (state.colorBlind.protanopia) {
          await chrome.scripting.insertCSS({
            target: { tabId: activeInfo.tabId },
            files: ["/protanopia.css"]
          });
        }
        if (state.colorBlind.tritanopia) {
          await chrome.scripting.insertCSS({
            target: { tabId: activeInfo.tabId },
            files: ["/tritanopia.css"]
          });
        }
      } catch (err) {
        console.error("Error inserting colorblind CSS:", err);
      }
    }

    if (state.reducedMotion) {
      try {
        await chrome.scripting.insertCSS({
          target: { tabId: activeInfo.tabId },
          files: ["/reduced-motion.css"]
        });
      } catch (err) {
        console.error("Error inserting reduced motion CSS:", err);
      }
    }
      // Apply keyboard navigation if enabled
    if (state.keyboardNav) {
      try {
        chrome.tabs.sendMessage(activeInfo.tabId, {
          action: "toggleKeyboardNav",
          enabled: true
        }).catch(err => console.error("Error applying keyboard navigation:", err));
      } catch (err) {
        console.error("Error applying keyboard navigation:", err);
      }
    }    if (state.largeTargets.enabled) {
      try {
        await chrome.scripting.insertCSS({
          target: { tabId: activeInfo.tabId },
          files: ["/large-targets.css"]
        });
        chrome.tabs.sendMessage(activeInfo.tabId, {
          action: "toggleLargeTargets",
          enabled: true,
          value: state.largeTargets.value
        }).catch(err => console.error("Error applying large targets:", err));
      } catch (err) {
        console.error("Error applying large targets:", err);
      }
    }

    if (state.customCursor) {
      try {
        chrome.tabs.sendMessage(activeInfo.tabId, {
          action: "toggleCustomCursor",
          enabled: true
        }).catch(err => console.error("Error applying custom cursor:", err));
      } catch (err) {
        console.error("Error applying custom cursor:", err);
      }
    }

    if (state.autoScroll) {
      try {
        chrome.tabs.sendMessage(activeInfo.tabId, {
          action: "toggleAutoScroll",
          enabled: true
        }).catch(err => console.error("Error applying auto-scroll:", err));
      } catch (err) {
        console.error("Error applying auto-scroll:", err);
      }
    }

    if (state.highlightLinks) {
      try {
        // Inject the highlight links CSS
        await chrome.scripting.insertCSS({
          target: { tabId: activeInfo.tabId },
          files: ["/highlight-links.css"]
        });
        
        // Apply the highlight links feature
        chrome.tabs.sendMessage(activeInfo.tabId, {
          action: "toggleHighlightLinks",
          enabled: true
        }).catch(err => console.error("Error applying highlight links:", err));
      } catch (err) {
        console.error("Error applying highlight links:", err);
      }
    }
    
    if (state.imageDescriptions) {
      try {
        // Inject the image descriptions CSS
        await chrome.scripting.insertCSS({
          target: { tabId: activeInfo.tabId },
          files: ["/image-descriptions.css"]
        });
          // Apply the image descriptions feature
        chrome.tabs.sendMessage(activeInfo.tabId, {
          action: "toggleImageDescriptions",
          enabled: true,
          fromBackground: true
        }).catch(err => console.error("Error applying image descriptions:", err));
      } catch (err) {
        console.error("Error applying image descriptions:", err);
      }
    }
  } catch (err) {
    console.error("Error getting tab info:", err);
  }
});

// Enhanced handling for visibility changes
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
      
      // Apply focus mode if enabled
      if (state.focusMode) {
        chrome.scripting.insertCSS({
          target: { tabId },
          files: ["/focus-mode.css"]
        }).then(() => {
          // Then apply the focus mode
          chrome.tabs.sendMessage(tabId, {
            action: "toggleFocusMode",
            enabled: true
          }).catch(err => console.error("Error applying focus mode:", err));
        }).catch(err => console.error("Error inserting focus mode CSS:", err));
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

      // Apply colourblind modes if enabled
      if (state.colorBlind && state.colorBlind.enabled) {
        if (state.colorBlind.deuteranopia) {
          chrome.tabs.sendMessage(tabId, {
            action: "toggleColorBlind",
            enabled: true,
            type: "deuteranopia"
          }).catch(err => console.log("Non-critical: Error applying deuteranopia on page load:", err));
        }
        if (state.colorBlind.protanopia) {
          chrome.tabs.sendMessage(tabId, {
            action: "toggleColorBlind",
            enabled: true,
            type: "protanopia"
          }).catch(err => console.log("Non-critical: Error applying protanopia on page load:", err));
        }
        if (state.colorBlind.tritanopia) {
          chrome.tabs.sendMessage(tabId, {
            action: "toggleColorBlind",
            enabled: true,
            type: "tritanopia"
          }).catch(err => console.log("Non-critical: Error applying tritanopia on page load:", err));
        }
      }

      // Apply reduced motion if enabled
      if (state.reducedMotion) {
        chrome.tabs.sendMessage(tabId, {
          action: "toggleReducedMotion",
          enabled: true
        }).catch(err => console.log("Non-critical: Error applying reduced motion on page load:", err));
      }
        // Apply large targets if enabled
      if (state.largeTargets.enabled) {
        // First ensure CSS is loaded
        chrome.scripting.insertCSS({
          target: { tabId },
          files: ["/large-targets.css"]
        }).then(() => {
          chrome.tabs.sendMessage(tabId, {
            action: "toggleLargeTargets",
            enabled: true,
            value: state.largeTargets.value
          }).catch(err => console.log("Non-critical: Error applying large targets on page load:", err));
        }).catch(err => console.log("Non-critical: Error inserting large targets CSS:", err));
      }
      
      // Apply keyboard navigation if enabled
      if (state.keyboardNav) {
        console.log(`Tab ${tabId} updated. Applying keyboardNav: ${state.keyboardNav}`);
        // Similar logic to applyKeyboardNavToAllTabs but for a single tab
        chrome.tabs.sendMessage(tabId, { action: "ping" }, (response) => {
          if (chrome.runtime.lastError) {
            console.log(`Content script not found in updated tab ${tabId}. Injecting for keyboardNav.`);
            chrome.scripting.executeScript({
              target: { tabId: tabId },
              files: ['content-script.js']
            }).then(() => {
              console.log(`Content script injected in updated tab ${tabId}. Applying keyboardNav state.`);
              setTimeout(() => {
                chrome.tabs.sendMessage(tabId, {
                  action: "toggleKeyboardNav",
                  enabled: state.keyboardNav
                }).catch(err => console.warn(`Error sending toggleKeyboardNav to updated tab ${tabId} after injection:`, err.message));
              }, 100);
            }).catch(err => console.error(`Failed to inject content script in updated tab ${tabId} for keyboardNav:`, err.message));
          } else {
            if (response && response.status === "pong") {
               chrome.tabs.sendMessage(tabId, {
                action: "toggleKeyboardNav",
                enabled: state.keyboardNav
              }).catch(err => console.warn(`Error sending toggleKeyboardNav to updated tab ${tabId}:`, err.message));
            } else {
              console.warn(`Content script in updated tab ${tabId} responded unexpectedly to ping.`);
            }
          }
        });
      }

      // Apply custom cursor if enabled
      if (state.customCursor) {
        chrome.tabs.sendMessage(tabId, {
          action: "toggleCustomCursor",
          enabled: true
        }).catch(err => console.log("Non-critical: Error applying custom cursor on page load:", err));
      }      // Apply auto-scroll if enabled
      if (state.autoScroll) {
        chrome.tabs.sendMessage(tabId, {
          action: "toggleAutoScroll",
          enabled: true
        }).catch(err => console.log("Non-critical: Error applying auto-scroll on page load:", err));      }
      
      // Handle hover controls with special care for "Turn All Off" action
      const now = Date.now();
      const recentTurnOff = (now - turnOffAllTimestamp) < 5000;

      if (state.hoverControls && !recentTurnOff) {
        // Only apply hover controls if it's enabled AND there was no recent "Turn All Off"
        console.log("Applying hover controls to tab", tabId);
        // First ensure CSS is loaded
        chrome.scripting.insertCSS({
          target: { tabId },
          files: ["/hover-controls.css"]
        }).then(() => {
          chrome.tabs.sendMessage(tabId, {
            action: "toggleHoverControls",
            enabled: true,
            fromBackground: true
          }, (response) => {
            if (chrome.runtime.lastError) {
              console.log("Retrying hover controls after error:", chrome.runtime.lastError.message);
              // Try again with a delay
              setTimeout(() => {
                chrome.tabs.sendMessage(tabId, {
                  action: "toggleHoverControls",
                  enabled: true,
                  fromBackground: true
                }).catch(err => console.log("Still failed to apply hover controls:", err));
              }, 500);
            } else if (response && response.status === "success") {
              console.log("Successfully applied hover controls on tab update");
            }
          });
        }).catch(err => console.log("Non-critical: Error inserting hover controls CSS:", err));
      } else if (recentTurnOff) {
        console.log(`Skipping hover controls application in tab ${tabId} - "Turn All Off" was recently used`);
        
        // Explicitly ensure hover controls are off in this tab
        chrome.tabs.sendMessage(tabId, {
          action: "toggleHoverControls",
          enabled: false,
          fromBackground: true
        }).catch(err => console.log("Error ensuring hover controls remain off:", err));      
      }
        // Apply reading progress if enabled
      if (state.readingProgress) {
        // First ensure CSS is loaded
        chrome.scripting.insertCSS({
          target: { tabId },
          files: ["/reading-progress.css"]
        }).then(() => {
          // Then apply the reading progress
          chrome.tabs.sendMessage(tabId, {
            action: "toggleReadingProgress",
            enabled: true
          }).catch(err => console.error("Error applying reading progress:", err));
        }).catch(err => console.error("Error inserting reading progress CSS:", err));
      }
      
      // Apply highlight links if enabled
      if (state.highlightLinks) {
        // First ensure CSS is loaded
        chrome.scripting.insertCSS({
          target: { tabId },
          files: ["/highlight-links.css"]
        }).then(() => {
          chrome.tabs.sendMessage(tabId, {
            action: "toggleHighlightLinks",
            enabled: true
          }).catch(err => console.log("Non-critical: Error applying highlight links on page load:", err));
        }).catch(err => console.log("Non-critical: Error inserting highlight links CSS:", err));
      }
      
      // Apply image descriptions if enabled
      if (state.imageDescriptions) {
        // First ensure CSS is loaded
        chrome.scripting.insertCSS({
          target: { tabId },
          files: ["/image-descriptions.css"]
        }).then(() => {          // Then apply the image descriptions
          chrome.tabs.sendMessage(tabId, {
            action: "toggleImageDescriptions",
            enabled: true,
            fromBackground: true
          }).catch(err => console.log("Non-critical: Error applying image descriptions on page load:", err));
        }).catch(err => console.log("Non-critical: Error inserting image descriptions CSS:", err));
      }
      
      // Apply image descriptions if enabled
      if (state.imageDescriptions) {
        // First ensure CSS is loaded
        chrome.scripting.insertCSS({
          target: { tabId },
          files: ["/image-descriptions.css"]
        }).then(() => {          // Then apply the image descriptions
          chrome.tabs.sendMessage(tabId, {
            action: "toggleImageDescriptions",
            enabled: true,
            fromBackground: true
          }).catch(err => console.error("Error applying image descriptions:", err));
        }).catch(err => console.error("Error inserting image descriptions CSS:", err));
      }
    }).catch(err => {
      console.log(`Error injecting content script into tab ${tabId} (this is normal for some pages):`, err);
    });
  }
});

// Apply hover controls to all tabs
function applyHoverControlsToAllTabs(enabled: boolean, originTabId?: number): Promise<void> {
  console.log(`applyHoverControlsToAllTabs called with enabled=${enabled}`);
  return new Promise<void>((resolve) => {
    // Keep track of tabs we've processed
    const processedTabs = new Set<number>();
    
    chrome.tabs.query({}, async (tabs) => {
      console.log(`Found ${tabs.length} tabs to apply hover controls to`);
      
      // Use Promise.allSettled to handle all tabs in parallel
      const promises = tabs
        .filter(tab => tab.id !== undefined)
        .map(async (tab) => {
          const tabId = tab.id as number;
          
          // Skip the originating tab and already processed tabs
          if (originTabId !== undefined && tabId === originTabId) {
            console.log(`Skipping originating tab ${tabId} to prevent message loop`);
            return;
          }
          
          if (processedTabs.has(tabId)) {
            console.log(`Tab ${tabId} already processed, skipping`);
            return;
          }
          
          // Mark this tab as processed
          processedTabs.add(tabId);
          
          try {
            // First, ensure content script is loaded
            await chrome.scripting.executeScript({
              target: { tabId },
              files: ['content-script.js']
            });
            
            // Now apply the hover control setting
            chrome.tabs.sendMessage(tabId, {
              action: "toggleHoverControls",
              enabled,
              fromBackground: true
            }).catch(err => console.log(`Error applying hover controls to tab ${tabId}:`, err));
          } catch (error) {
            console.error(`Error in tab ${tabId}:`, error);
          }
        });
      
      // Wait for all promises to settle
      Promise.allSettled(promises).then(() => {
        console.log("Completed applying hover controls to all tabs");
        resolve();
      });
    });
  });
}

// Function to apply highlight links to all tabs
async function applyHighlightLinksToAllTabs(enabled: boolean): Promise<void> {
  try {
    // Get all tabs
    const tabs = await chrome.tabs.query({});
    
    // For each tab
    for (const tab of tabs) {
      if (!tab.id || !tab.url || !tab.url.startsWith('http')) continue;
      
      const tabId = tab.id;
      
      // Send message to content script with error handling
      try {
        await chrome.tabs.sendMessage(tabId, { 
          action: "toggleHighlightLinks", 
          enabled: enabled 
        });
        console.log(`Highlight links ${enabled ? 'enabled' : 'disabled'} for tab ${tabId}`);
      } catch (err) {
        console.log(`Could not apply highlight links to tab ${tabId}:`, err);
      }
    }
  } catch (error) {
    console.error("Error applying highlight links to all tabs:", error);
  }
}

// Function to apply reading progress to all tabs
async function applyReadingProgressToAllTabs(enabled: boolean): Promise<void> {
  try {
    // Get all tabs
    const tabs = await chrome.tabs.query({});
    
    // Loop through each tab and apply the setting
    for (const tab of tabs) {
      // Skip tabs without IDs or URLs (like chrome:// URLs which we can't inject into)
      if (!tab.id || !tab.url || tab.url.startsWith('chrome://') || tab.url.startsWith('edge://')) {
        continue;
      }
      
      try {
        // Send message to content script to apply the reading progress
        await chrome.tabs.sendMessage(tab.id, {
          action: 'toggleReadingProgress',
          enabled: enabled
        });
        
        console.log(`Applied reading progress (${enabled ? 'ON' : 'OFF'}) to tab ${tab.id}`);
      } catch {
        // This often means the content script is not yet injected
        console.log(`Couldn't apply reading progress to tab ${tab.id}, injecting content script...`);
        
        try {
          // Try to inject the content script
          await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            files: ['content-script.js']
          });
          
          // Now try again to apply the setting
          await chrome.tabs.sendMessage(tab.id, {
            action: 'toggleReadingProgress',
            enabled: enabled
          });
          
          console.log(`Injected script and applied reading progress to tab ${tab.id}`);
        } catch (injectErr) {
          // Some tabs can't be injected into (like chrome:// URLs)
          console.error(`Failed to inject content script into tab ${tab.id}:`, injectErr);
        }
      }
    }  } catch (error) {
    console.error("Error applying reading progress to all tabs:", error);
  }
}

// Function to apply image descriptions to all tabs
async function applyImageDescriptionsToAllTabs(enabled: boolean): Promise<void> {
  try {
    // Get all tabs
    const tabs = await chrome.tabs.query({});
    
    // Loop through each tab and apply the setting
    for (const tab of tabs) {
      // Skip tabs without IDs or URLs (like chrome:// URLs which we can't inject into)
      if (!tab.id || !tab.url || tab.url.startsWith('chrome://') || tab.url.startsWith('edge://')) {
        continue;
      }
      
      try {        // Send message to content script to apply the image descriptions
        await chrome.tabs.sendMessage(tab.id, {
          action: 'toggleImageDescriptions',
          enabled: enabled,
          fromBackground: true
        });
        
        console.log(`Applied image descriptions (${enabled ? 'ON' : 'OFF'}) to tab ${tab.id}`);
      } catch {
        // This often means the content script is not yet injected
        console.log(`Couldn't apply image descriptions to tab ${tab.id}, injecting content script...`);
        
        try {
          // Try to inject the content script
          await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            files: ['content-script.js']
          });
            // Now try again to apply the setting
          await chrome.tabs.sendMessage(tab.id, {
            action: 'toggleImageDescriptions',
            enabled: enabled,
            fromBackground: true
          });
          
          console.log(`Injected script and applied image descriptions to tab ${tab.id}`);
        } catch (injectionError) {
          // Some tabs can't be injected into (like chrome:// URLs)
          console.error(`Failed to inject content script into tab ${tab.id}:`, injectionError);        }
      }
    }
  } catch (error) {
    console.error("Error applying reading progress to all tabs:", error);
  }
}