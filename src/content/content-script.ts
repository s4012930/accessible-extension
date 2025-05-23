// Add TypeScript declaration for our custom window property
declare global {
  interface Window {
    __accessibilityExtensionLoaded?: boolean;
    __imageObserver?: MutationObserver | null;
  }
}

// Wrap everything in an immediately invoked function expression (IIFE) 
// to prevent variable name collisions when the script is injected multiple times
(function() {
  // Skip initialization if the script was already loaded
  if (window.__accessibilityExtensionLoaded) {
    return;
  }
  
  // Mark as loaded to prevent double initialization
  window.__accessibilityExtensionLoaded = true;

  // Type definitions
  type ColorBlindType = 'protanopia' | 'deuteranopia' | 'tritanopia' | 'high-contrast' | null;
  
  // Listen for messages from the extension popup/background
  chrome.runtime.onMessage.addListener((request, _sender, sendResponse) => {
    if (request.action === "ping") {
      sendResponse({ status: "pong" });
      return true;
    }
    if (request.action === "toggleHighContrast") {
      toggleHighContrast(request.enabled);
      sendResponse({ status: "success" });
      return true;
    }
    
    if (request.action === "toggleDyslexiaFont") {
      toggleDyslexiaFont(request.enabled);
      sendResponse({ status: "success" });
      return true;
    }
    
    if (request.action === "toggleReadingLine") {
      toggleReadingLine(request.enabled);
      sendResponse({ status: "success" });
      return true;
    }
    
    if (request.action === "toggleColorBlind") {
      toggleColorBlind(request.enabled, request.type);
      sendResponse({ status: "success" });
      return true;
    }
    
    if (request.action === "updateTextScaling") {
      toggleTextScaling(request.enabled, request.value);
      sendResponse({ status: "success" });
      return true;
    }
    
    if (request.action === "updateLineHeight") {
      toggleLineHeight(request.enabled, request.value);
      sendResponse({ status: "success" });
      return true;
    }
    
    if (request.action === "toggleReducedMotion") {
      toggleReducedMotion(request.enabled);
      sendResponse({ status: "success" });
      return true;
    }    if (request.action === "toggleLargeTargets") {
      try {
        console.log('Large targets request received:', request.enabled);
        toggleLargeTargets(request.enabled);
        sendResponse({ 
          status: "success", 
          enabled: request.enabled,
          value: 1.5  // Return the default value
        });
      } catch (error: any) {
        console.error("Error in toggleLargeTargets handler:", error);
        sendResponse({ status: "error", message: error.toString() });
      }
      return true;
    }
    
    if (request.action === "toggleKeyboardNav") {
      try {
        toggleKeyboardNav(request.enabled);
        sendResponse({ status: "success" });
      } catch (error: any) {
        console.error("Error in toggleKeyboardNav handler:", error);
        sendResponse({ status: "error", message: error.toString() });
      }
      return true;
    }
      
    if (request.action === "getKeyboardNavState") {
      try {
        const keyboardNavDOM = !!document.querySelector('link[data-accessibility-keyboard-nav]');
        const keyboardNavStorage = localStorage.getItem('accessibility-keyboard-nav') === 'true';
        const keyboardNavEnabled = keyboardNavDOM || keyboardNavStorage;
        sendResponse({ enabled: keyboardNavEnabled });
      } catch (error: any) {
        console.error("Error in getKeyboardNavState handler:", error);
        sendResponse({ enabled: false, error: error.toString() });      }
      return true;
    }    if (request.action === "toggleFocusMode") {
      try {
        console.log('Focus mode request received:', request.enabled);
        // Check current class state before toggle
        const currentClassState = document.documentElement.classList.contains('accessibility-focus-mode');
        console.log('Current focus mode class state before toggle:', currentClassState);
        console.log('Current focus mode localStorage state before toggle:', localStorage.getItem('accessibility-focus-mode'));
        
        toggleFocusMode(request.enabled);
        
        // Double-check that the class state changed correctly
        const newClassState = document.documentElement.classList.contains('accessibility-focus-mode');
        console.log('Focus mode class state after toggle:', newClassState);
        console.log('Focus mode localStorage state after toggle:', localStorage.getItem('accessibility-focus-mode'));
        
        // Alert the background page with the current state
        chrome.runtime.sendMessage({
          action: "updateState",
          feature: "focusMode",
          enabled: newClassState
        }).catch(err => console.log("Error updating focus mode state in background after toggle:", err));
        
        sendResponse({ 
          status: "success",
          enabled: newClassState // Send back the actual current state
        });
      } catch (error: any) {
        console.error("Error in toggleFocusMode handler:", error);
        sendResponse({ status: "error", message: error.toString() });
      }
      return true;
    }
    
    if (request.action === "toggleCustomCursor") {
      try {
        console.log('Custom cursor request received:', request.enabled);
        toggleCustomCursor(request.enabled);
        sendResponse({ 
          status: "success", 
          enabled: request.enabled
        });
      } catch (error: any) {
        console.error("Error in toggleCustomCursor handler:", error);
        sendResponse({ status: "error", message: error.toString() });
      }      return true;
    }    if (request.action === "toggleAutoScroll") {
      try {
        // Just toggle the feature directly
        toggleAutoScroll(request.enabled);
        
        // Send response immediately after toggle
        sendResponse({ 
          status: "success", 
          enabled: request.enabled 
        });
      } catch (error) {
        console.error("Error in toggleAutoScroll handler:", error);
        sendResponse({ status: "error", message: error instanceof Error ? error.message : String(error) });
      }
      return true;
    }
      if (request.action === "toggleHoverControls") {      try {
        console.log(`Hover controls request received: enabled=${request.enabled}, fromBackground=${request.fromBackground || false}`);
        
        // Get current local storage state
        const currentLocalState = localStorage.getItem('accessibility-hover-controls');
        
        // Check if the request is to enable hover controls and if they were recently turned off
        if (request.enabled && !request.fromBackground && currentLocalState === 'turnedOff') {
          console.log('Hover controls were recently turned off via "Turn All Off". User must explicitly re-enable.');
          sendResponse({ 
            status: "success", 
            feature: "hoverControls",
            enabled: false
          });
          return true;
        }
        
        toggleHoverControls(request.enabled, request.fromBackground || false);
        
        // Always send a successful response regardless of internal implementation details
        sendResponse({ 
          status: "success", 
          feature: "hoverControls",
          enabled: request.enabled 
        });
        return true;
      } catch (error: any) {
        console.error("Error in toggleHoverControls handler:", error);
        sendResponse({ status: "error", message: error.toString() });
        return true;
      }
    }
    
    if (request.action === "toggleHighlightLinks") {
      try {
        console.log('Highlight links request received:', request.enabled);
        toggleHighlightLinks(request.enabled);
        sendResponse({ 
          status: "success", 
          enabled: request.enabled 
        });
      } catch (error: any) {
        console.error("Error in toggleHighlightLinks handler:", error);
        sendResponse({ status: "error", message: error.toString() });
      }
      return true;
    }
    
    if (request.action === "toggleReadingProgress") {
      try {
        console.log('Reading progress request received:', request.enabled);
        toggleReadingProgress(request.enabled);
        sendResponse({ 
          status: "success", 
          enabled: request.enabled 
        });
      } catch (error: any) {
        console.error("Error in toggleReadingProgress handler:", error);
        sendResponse({ status: "error", message: error.toString() });
      }
      return true;
    }
    
    if (request.action === "toggleImageDescriptions") {
      try {
        const enabled = request.enabled;
        const fromBackground = request.fromBackground || false;
        toggleImageDescriptions(enabled, fromBackground);
        sendResponse({
          status: "success",
          message: `Image descriptions ${enabled ? 'enabled' : 'disabled'}`
        });
      } catch (err) {
        console.error('Error toggling image descriptions:', err);
        sendResponse({
          status: "error",
          message: `Failed to toggle image descriptions: ${err}`
        });
      }
      return true;
    }
    
    // Add other accessibility toggles here in the future
    return false;
  });

  // Global state object to minimize storage operations
  let globalAccessibilityState: Record<string, any> = {};

  // Debounce function to limit storage updates
  let storageUpdateTimer: ReturnType<typeof setTimeout> | null = null;
  const debouncedStorageUpdate = (updates: Record<string, any>) => {
    if (storageUpdateTimer) {
      clearTimeout(storageUpdateTimer);
    }
    
    // Update local copy of the state first
    globalAccessibilityState = {
      ...globalAccessibilityState,
      ...updates
    };
    
    storageUpdateTimer = setTimeout(() => {
      chrome.storage.sync.set({ 
        accessibilityState: globalAccessibilityState 
      }, () => {
        if (chrome.runtime.lastError) {
          console.error("Error updating storage:", chrome.runtime.lastError);
        }
      });
    }, 500); // 500ms debounce time
  };

  // Initialize global state from storage
  chrome.storage.sync.get("accessibilityState", (result) => {
    globalAccessibilityState = result.accessibilityState || {};
  });

  // Function to toggle high contrast mode
  function toggleHighContrast(enable: boolean): void {
    // Check if any colourblind mode is currently enabled
    const deuteranopiaEnabled = document.documentElement.classList.contains('accessibility-deuteranopia');
    const protanopiaEnabled = document.documentElement.classList.contains('accessibility-protanopia');
    const tritanopiaEnabled = document.documentElement.classList.contains('accessibility-tritanopia');
    const colorBlindType = deuteranopiaEnabled ? 'deuteranopia' : 
                          protanopiaEnabled ? 'protanopia' : 
                          tritanopiaEnabled ? 'tritanopia' : null;
    
    // First handle high contrast stylesheet
    let highContrastStylesheet = document.querySelector('link[data-accessibility-high-contrast]');
    
    if (enable) {
      // Add high contrast class
      document.documentElement.classList.add('accessibility-high-contrast');
      
      // Add high contrast stylesheet if it doesn't exist
      if (!highContrastStylesheet) {
        highContrastStylesheet = document.createElement('link');
        highContrastStylesheet.setAttribute('rel', 'stylesheet');
        highContrastStylesheet.setAttribute('data-accessibility-high-contrast', 'true');
        highContrastStylesheet.setAttribute('href', chrome.runtime.getURL('high-contrast.css'));
        document.head.appendChild(highContrastStylesheet);
      }
    } else {
      // Remove high contrast class
      document.documentElement.classList.remove('accessibility-high-contrast');
      
      // Remove high contrast stylesheet
      if (highContrastStylesheet) {
        highContrastStylesheet.remove();
      }
    }
    
    // Store the setting in localStorage for this specific feature
    localStorage.setItem('accessibility-high-contrast', String(enable));
    
    // Update global state and debounce storage update
    debouncedStorageUpdate({ highContrast: enable });

    // If any colourblind filter is active, we need to reapply its CSS to ensure proper combination
    if (colorBlindType && (deuteranopiaEnabled || protanopiaEnabled || tritanopiaEnabled)) {
      // Remove any existing colour blind stylesheets first
      document.querySelectorAll('link[data-accessibility-color-blind]').forEach((element) => {
        element.remove();
      });

      // Re-inject the stylesheet for the combined state
      try {
        const linkElement = document.createElement('link');
        linkElement.setAttribute('rel', 'stylesheet');
        linkElement.setAttribute('data-accessibility-color-blind', 'true');
        linkElement.setAttribute('href', chrome.runtime.getURL(`${colorBlindType}.css`));
        document.head.appendChild(linkElement);
      } catch (error) {
        console.error('Error applying combined filter mode:', error);
      }
    }
  }

  // Function to toggle dyslexia font
  function toggleDyslexiaFont(enable: boolean): void {
    // Apply the change to the DOM
    if (enable) {
      document.documentElement.classList.add('accessibility-dyslexia-font');
    } else {
      document.documentElement.classList.remove('accessibility-dyslexia-font');
    }
    
    // Store the setting in localStorage for this specific feature
    localStorage.setItem('accessibility-dyslexia-font', String(enable));
    
    // Update global state and debounce storage update
    debouncedStorageUpdate({ dyslexiaFont: enable });
  }

  // Function to toggle colour blind mode
  function toggleColorBlind(enable: boolean, type: ColorBlindType): void {
    // Check if high contrast is currently enabled before making changes
    const highContrastEnabled = document.documentElement.classList.contains('accessibility-high-contrast');
    
    // Remove only the colourblind classes from HTML element, preserving high contrast if enabled
    document.documentElement.classList.remove('accessibility-protanopia');
    document.documentElement.classList.remove('accessibility-deuteranopia');
    document.documentElement.classList.remove('accessibility-tritanopia');
    
    // Remove any existing colour blind stylesheets
    document.querySelectorAll('link[data-accessibility-color-blind]').forEach((element) => {
      element.remove();
    });
    
    // Clear localStorage for the previous colourblind setting
    localStorage.removeItem('accessibility-color-blind');
    
    // If enabled and type is specified, apply the colour blind mode
    if (enable && type) {
      // Add the appropriate class to the HTML element
      document.documentElement.classList.add(`accessibility-${type}`);
      
      // Store the setting in localStorage
      localStorage.setItem('accessibility-color-blind', type);
      
      // Also inject the stylesheet for additional styling
      try {
        const linkElement = document.createElement('link');
        linkElement.setAttribute('rel', 'stylesheet');
        linkElement.setAttribute('data-accessibility-color-blind', 'true');
        linkElement.setAttribute('href', chrome.runtime.getURL(`${type}.css`));
        document.head.appendChild(linkElement);
        console.log(`Applied ${type} color blind mode successfully`);
      } catch (error) {
        console.error('Error applying color blind mode:', error);
      }
    }
    
    // Ensure high contrast is properly applied if it was enabled
    if (highContrastEnabled) {
      // Make sure high contrast class is present
      if (!document.documentElement.classList.contains('accessibility-high-contrast')) {
        document.documentElement.classList.add('accessibility-high-contrast');
      }
      
      // Check if high contrast stylesheet exists, add if missing
      let highContrastStylesheet = document.querySelector('link[data-accessibility-high-contrast]');
      if (!highContrastStylesheet) {
        highContrastStylesheet = document.createElement('link');
        highContrastStylesheet.setAttribute('rel', 'stylesheet');
        highContrastStylesheet.setAttribute('data-accessibility-high-contrast', 'true');
        highContrastStylesheet.setAttribute('href', chrome.runtime.getURL('high-contrast.css'));
        document.head.appendChild(highContrastStylesheet);
      }
    }
    
    // Update global state and debounce storage update
    debouncedStorageUpdate({ colorBlind: { type, enabled: enable } });
  }

  // Check if the page is in dark mode
  function isDarkMode(): boolean {
    // Check various ways dark mode might be indicated
    const htmlEl = document.documentElement;
    const bodyEl = document.body;
    
    return (
      htmlEl.classList.contains('dark') ||
      bodyEl.classList.contains('dark') ||
      htmlEl.getAttribute('data-theme') === 'dark' ||
      bodyEl.getAttribute('data-theme') === 'dark' ||
      window.matchMedia('(prefers-color-scheme: dark)').matches ||
      localStorage.getItem('theme') === 'dark'
    );
  }

  // Function to toggle reduced motion
  function toggleReducedMotion(enabled: boolean): void {
    // Track if state is changing to avoid redundant operations
    const currentState = document.documentElement.classList.contains('accessibility-reduced-motion');
    if (currentState === enabled) {
      // No change needed, but ensure storage is consistent
      localStorage.setItem('accessibility-reduced-motion', String(enabled));
      return;
    }
    
    // First handle the class on HTML element
    if (enabled) {
      document.documentElement.classList.add('accessibility-reduced-motion');
    } else {
      document.documentElement.classList.remove('accessibility-reduced-motion');
    }
    
    // Store setting in localStorage
    localStorage.setItem('accessibility-reduced-motion', String(enabled));
    
    // Apply script-level animations control
    if (enabled) {
      // 1. Handle Element.animate() calls
      if (Element.prototype.animate) {
        // Use type assertion to add custom property
        (Element.prototype as any)._origAnimate = Element.prototype.animate;
        Element.prototype.animate = function(keyframes, options) {
          // Call original with zero duration and cancel
          const optionsCopy = options ? { ...(options as object), duration: 0 } : { duration: 0 };
          const anim = (this as any)._origAnimate(keyframes, optionsCopy);
          anim?.cancel?.();
          return anim;
        };
      }

      // 2. Optional: Handle requestAnimationFrame for certain animations
      if (!(window as any)._origRAF) {
        (window as any)._origRAF = window.requestAnimationFrame;
        window.requestAnimationFrame = () => (window as any)._origRAF(() => {}, 0);
      }
    } else {
      // Restore original animations behavior if disabled
      if ((Element.prototype as any)._origAnimate) {
        Element.prototype.animate = (Element.prototype as any)._origAnimate;
        delete (Element.prototype as any)._origAnimate;
      }
      
      if ((window as any)._origRAF) {
        window.requestAnimationFrame = (window as any)._origRAF;
        delete (window as any)._origRAF;
      }
    }

    // Add or remove stylesheet for CSS-based animations control
    let reducedMotionStylesheet = document.querySelector('link[data-accessibility-reduced-motion]');
    
    if (enabled) {
      if (!reducedMotionStylesheet) {
        try {
          const linkElement = document.createElement('link');
          linkElement.setAttribute('rel', 'stylesheet');
          linkElement.setAttribute('data-accessibility-reduced-motion', 'true');
          linkElement.setAttribute('href', chrome.runtime.getURL('reduced-motion.css'));
          document.head.appendChild(linkElement);
        } catch (error) {
          console.error('Error applying reduced motion mode:', error);
        }
      }
    } else {
      // Remove the stylesheet when disabled
      if (reducedMotionStylesheet) {
        reducedMotionStylesheet.remove();
      }
      
      // Additional measures to restore animations
      try {
        // 1. Force a refresh of animation states
        const refreshStyle = document.createElement('style');
        refreshStyle.textContent = 'body { animation: none; }';
        document.head.appendChild(refreshStyle);
        
        // Trigger a reflow
        void document.body.offsetHeight;
        
        // Remove the temporary style
        refreshStyle.remove();
        
        // 2. Reset animation-play-state for any explicitly paused elements
        const resetStyle = document.createElement('style');
        resetStyle.textContent = `
          * {
            animation-play-state: running !important;
            transition-property: all !important;
            transition-duration: 0.01s !important;
          }
        `;
        document.head.appendChild(resetStyle);
        
        // Remove after a short delay to allow animations to reset
        setTimeout(() => {
          resetStyle.remove();
        }, 50);
      } catch (error) {
        console.error('Error restoring animations:', error);
      }
    }
    
    // Update global state and debounce storage update
    debouncedStorageUpdate({ reducedMotion: enabled });
    
    // Immediately notify background script about state change
    chrome.runtime.sendMessage({
      action: "updateState",
      feature: "reducedMotion",
      enabled: enabled
    }).catch(() => {
      // Ignore errors if background isn't ready
    });
  }

  // Function to toggle reading line
  function toggleReadingLine(enabled: boolean): void {
    // Remove any existing reading line elements
    const existingContainer = document.querySelector('.accessibility-reading-line-container');
    if (existingContainer) {
      document.body.removeChild(existingContainer);
    }
    
    // Remove any existing reading line stylesheets
    document.querySelectorAll('link[data-accessibility-reading-line]').forEach((element) => {
      element.remove();
    });
    
    // Remove any previous event listeners to avoid duplicates
    document.removeEventListener('mousemove', updateReadingLinePosition);
    document.removeEventListener('visibilitychange', handleVisibilityChange);
    
    // Store the setting in localStorage
    localStorage.setItem('accessibility-reading-line', enabled ? 'true' : 'false');
    
    if (enabled) {
      try {
        // Inject the stylesheet first
        const linkElement = document.createElement('link');
        linkElement.setAttribute('rel', 'stylesheet');
        linkElement.setAttribute('href', chrome.runtime.getURL('reading-line.css'));
        linkElement.setAttribute('data-accessibility-reading-line', 'true');
        document.head.appendChild(linkElement);
        
        // Create container and line
        const container = document.createElement('div');
        container.className = 'accessibility-reading-line-container';
        container.id = 'accessibility-reading-line-container';
        
        const line = document.createElement('div');
        line.className = 'accessibility-reading-line';
        if (isDarkMode()) {
          line.classList.add('dark-mode');
        }
        
        container.appendChild(line);
        document.body.appendChild(container);
        
        // Set initial position
        line.style.top = `${window.innerHeight / 2}px`;
        
        // Add event listeners
        document.addEventListener('mousemove', updateReadingLinePosition);
        document.addEventListener('visibilitychange', handleVisibilityChange);
        
        console.log('Reading line enabled successfully');
      } catch (error) {
        console.error('Error enabling reading line:', error);
      }
    }
    
    // Update global state and debounce storage update
    debouncedStorageUpdate({ readingLine: enabled });  }

  // Handle visibility change for reading line
  function handleVisibilityChange(): void {
    if (document.visibilityState === 'visible') {
      const readingLineEnabled = localStorage.getItem('accessibility-reading-line') === 'enabled';
      if (readingLineEnabled) {
        // Re-add event listener for mouse movement
        document.addEventListener('mousemove', updateReadingLinePosition);
      }
    } else {
      document.removeEventListener('mousemove', updateReadingLinePosition);
    }
  }

  // Helper function to update reading line position
  function updateReadingLinePosition(e: MouseEvent): void {
    const readingLine = document.querySelector('.accessibility-reading-line') as HTMLElement;
    if (readingLine) {
      readingLine.style.top = `${e.clientY}px`;
    }
  }

  // Function to toggle text scaling
  function toggleTextScaling(enable: boolean, value: number = 100): void {
    // Remove any existing styling first
    const existingStyle = document.getElementById('accessibility-text-scaling');
    if (existingStyle) {
      existingStyle.remove();
    }

    if (enable) {
      // Create a new style element with the specified scale
      const style = document.createElement('style');
      style.id = 'accessibility-text-scaling';
      
      // Special handling for lucide.dev/icons website
      if (window.location.href.includes('lucide.dev/icons')) {
        // This targets main content elements but avoids elements that might trigger excessive re-renders
        style.textContent = `
          body > main, 
          body > div > main,
          .prose,
          .prose *,
          h1, h2, h3, h4, h5, h6,
          p {
            font-size: ${value / 100}em !important;
          }
        `;
      } else {
        // Normal handling for all other sites
        style.textContent = `
          html {
            font-size: ${value}% !important;
          }
        `;
      }
      document.head.appendChild(style);
    }
    
    // Store state in localStorage for persistence
    localStorage.setItem('accessibility-text-scaling-enabled', String(enable));
    if (enable) {
      localStorage.setItem('accessibility-text-scaling-value', String(value));
    }
    
    // This prevents hitting the MAX_WRITE_OPERATIONS_PER_MINUTE quota
    const isLucideIconsSite = window.location.href.includes('lucide.dev/icons');
    
    if (!isLucideIconsSite || !enable) {
      // For all other sites or when disabling, update Chrome storage as usual
      chrome.storage.sync.get("accessibilityState", (result) => {
        const state = result.accessibilityState || {};
        if (!state.textScaling) state.textScaling = { enabled: false, value: 100 };
        
        state.textScaling.enabled = enable;
        if (enable) {
          state.textScaling.value = value;
        }
        
        chrome.storage.sync.set({ 
          accessibilityState: state 
        }, () => {
          if (chrome.runtime.lastError) {
            console.error("Error updating storage:", chrome.runtime.lastError);
          }
        });
      });
    }
  }

  // Function to toggle line height
  function toggleLineHeight(enable: boolean, value: number = 1.5): void {
    // Remove any existing styling first
    const existingStyle = document.getElementById('accessibility-line-height');
    if (existingStyle) {
      existingStyle.remove();
    }

    if (enable) {
      // Create a new style element with the specified line height
      const style = document.createElement('style');
      style.id = 'accessibility-line-height';
      
      // Use higher specificity to override the dyslexia font's line-height
      style.textContent = `
        html[data-line-height="custom"] p, 
        html[data-line-height="custom"] div, 
        html[data-line-height="custom"] li, 
        html[data-line-height="custom"] td, 
        html[data-line-height="custom"] span, 
        html[data-line-height="custom"] a, 
        html[data-line-height="custom"] h1, 
        html[data-line-height="custom"] h2, 
        html[data-line-height="custom"] h3, 
        html[data-line-height="custom"] h4, 
        html[data-line-height="custom"] h5, 
        html[data-line-height="custom"] h6,
        html.accessibility-dyslexia-font[data-line-height="custom"] * {
          line-height: ${value} !important;
        }
      `;
      document.head.appendChild(style);
      
      // Add data attribute to html element for higher specificity
      document.documentElement.setAttribute('data-line-height', 'custom');
    } else {
      // Remove data attribute when disabled
      document.documentElement.removeAttribute('data-line-height');
    }
    
    // Store state in localStorage for persistence
    localStorage.setItem('accessibility-line-height-enabled', String(enable));
    if (enable) {
      localStorage.setItem('accessibility-line-height-value', String(value));
    }
    
    // Also update global Chrome storage
    chrome.storage.sync.get("accessibilityState", (result) => {
      const state = result.accessibilityState || {};
      if (!state.lineHeight) state.lineHeight = { enabled: false, value: 1.5 };
      
      state.lineHeight.enabled = enable;
      if (enable) {
        state.lineHeight.value = value;
      }
      
      chrome.storage.sync.set({ 
        accessibilityState: state 
      }, () => {
        if (chrome.runtime.lastError) {
          console.error("Error updating storage:", chrome.runtime.lastError);
        }
      });
    });
  }

  // Global variables for keyboard navigation auto-click feature
  let keyboardFocusTimer: number | null = null;
  
  function toggleKeyboardNav(enable: boolean): void {
    try {
      // Remove any existing keyboard nav stylesheet to avoid duplicates
      const existingStylesheets = document.querySelectorAll('link[data-accessibility-keyboard-nav]');
      existingStylesheets.forEach(sheet => {
        try {
          sheet.remove();
        } catch (err) {
          // Log error but continue
          console.error('Failed to remove existing keyboard nav stylesheet:', err);
        }
      });
      
      // Remove keyboardFocusTimer if it exists
      if (keyboardFocusTimer) {
        clearTimeout(keyboardFocusTimer);
        keyboardFocusTimer = null;
      }

      if (enable) {
        try {
          const linkElement = document.createElement('link');
          linkElement.setAttribute('rel', 'stylesheet');
          linkElement.setAttribute('data-accessibility-keyboard-nav', 'true');
          linkElement.setAttribute('href', chrome.runtime.getURL('keyboard-nav.css'));
          // Insert before other scripts/styles if possible, to ensure high priority
          if (document.head.firstChild) {
            document.head.insertBefore(linkElement, document.head.firstChild);
          } else {
            document.head.appendChild(linkElement);
          }
          
          console.log('Keyboard navigation enabled successfully on this tab.');
        } catch (innerError) {
          console.error('Error enabling keyboard navigation on this tab:', innerError);
          // Potentially send error back to background or popup if needed
        }
      } else {
        console.log('Keyboard navigation disabled on this tab.');
      }

      // Store the setting in localStorage for this specific tab's persistence
      try {
        localStorage.setItem('accessibility-keyboard-nav', String(enable));
      } catch (lsError) {
        console.error('Error setting localStorage for keyboardNav:', lsError);
      }

      // Update global state via background script (debounced)
      try {
        debouncedStorageUpdate({ keyboardNav: enable });
      } catch (dsuError) {
        console.error('Error calling debouncedStorageUpdate for keyboardNav:', dsuError);
      }
      
      // Notify background script immediately about the state change for this tab
      // This allows the background script to manage global state and apply to other tabs if necessary
      setTimeout(() => {
        try {
          chrome.runtime.sendMessage({
            action: "updateState", // Standard action for background to update its master state
            feature: "keyboardNav",
            enabled: enable
          }).catch(rtMsgError => {
            // Silently catch errors if background isn't ready or page is unloading
            console.log("Couldn't notify background script (keyboardNav):", rtMsgError);
          });
        } catch (rtError) {
          console.log("Error sending message to background (keyboardNav):", rtError);
        }
      }, 10); // Small delay to ensure other operations complete

    } catch (outerError) {
      console.error('Critical error in toggleKeyboardNav:', outerError);
      // Consider sending a message to background/popup about critical failure
    }

  }
  // Function to toggle larger click targets
  function toggleLargeTargets(enabled: boolean): void {
    console.log(`Toggling large targets: ${enabled ? 'ON' : 'OFF'}`);
    
    // Track if state is changing to avoid redundant operations
    const currentState = document.documentElement.classList.contains('accessibility-large-targets');
    if (currentState === enabled) {
      // No change needed, but ensure storage is consistent
      localStorage.setItem('accessibility-large-targets', String(enabled));
      return;
    }
    
    // First handle the class on HTML element
    if (enabled) {
      document.documentElement.classList.add('accessibility-large-targets');
    } else {
      document.documentElement.classList.remove('accessibility-large-targets');
    }
    
    // Store setting in localStorage
    localStorage.setItem('accessibility-large-targets', String(enabled));
    
    // Add or remove stylesheet for CSS-based large targets
    let largeTargetsStylesheet = document.querySelector('link[data-accessibility-large-targets]');
    
    if (enabled) {
      if (!largeTargetsStylesheet) {
        try {
          // Log to check if we're attempting to enable
          console.log('Enabling large targets mode...');
          const cssURL = chrome.runtime.getURL('large-targets.css');
          console.log('CSS URL:', cssURL);
          if (!cssURL) {
            throw new Error('Could not get URL for large-targets.css');
          }
          
          const linkElement = document.createElement('link');
          linkElement.setAttribute('rel', 'stylesheet');
          linkElement.setAttribute('data-accessibility-large-targets', 'true');
          linkElement.setAttribute('href', cssURL);
          document.head.appendChild(linkElement);
          console.log('Large targets mode enabled successfully');
          
          // Set the CSS variable for scaling
          document.documentElement.style.setProperty('--large-targets-scale', '1.5');
          
          // Verify that the stylesheet was actually added
          setTimeout(() => {
            const verifySheet = document.querySelector('link[data-accessibility-large-targets]');
            if (!verifySheet) {
              console.warn('Large targets stylesheet not found after insertion');
            }
          }, 100);
        } catch (error) {
          console.error('Error applying large targets mode:', error);
        }
      }
    } else {
      // Remove the stylesheet when disabled
      console.log("Removing large targets stylesheets...");
      
      // Remove all stylesheets related to large targets, not just the one we found initially
      document.querySelectorAll('link[data-accessibility-large-targets]').forEach(el => {
        try {
          el.remove();
          console.log("Removed a large targets stylesheet");
        } catch (err) {
          console.error("Error removing stylesheet:", err);
        }
      });
      
      // Remove the CSS variable for scaling
      document.documentElement.style.removeProperty('--large-targets-scale');
      
      // Double check removal with a short delay
      setTimeout(() => {
        const remainingStylesheets = document.querySelectorAll('link[data-accessibility-large-targets]');
        if (remainingStylesheets.length > 0) {
          console.warn(`Found ${remainingStylesheets.length} large targets stylesheets that weren't removed - forcing removal again`);
          remainingStylesheets.forEach(el => {
            try {
              el.remove();
            } catch (err) {
              console.error("Error in second removal attempt:", err);
            }
          });
        } else {
          console.log("All large targets stylesheets removed successfully");
        }
      }, 100);
    }
      // Update global state and debounce storage update
    debouncedStorageUpdate({ 
      largeTargets: { 
        enabled: enabled,
        value: 1.5  // Use default value
      } 
    });
    
    // Immediately notify background script about state change
    try {
      chrome.runtime.sendMessage({
        action: "updateState",
        feature: "largeTargets",
        enabled: enabled,
        value: 1.5  // Include value to match background script expectations
      }).catch(() => {
        // Ignore errors if background isn't ready
      });
    } catch (err) {
      // Handle any exceptions that might occur when sending messages
      console.log("Error sending largeTargets update to background:", err);
    }
  }

  // Function to toggle custom cursor  
  function toggleCustomCursor(enable: boolean): void {
    console.log(`Toggling custom cursor: ${enable ? 'ON' : 'OFF'}`);
    
    try {
      // Track if state is changing to avoid redundant operations
      const currentState = document.documentElement.classList.contains('accessibility-custom-cursor');
      if (currentState === enable) {
        // No change needed, but ensure storage is consistent
        localStorage.setItem('accessibility-custom-cursor', String(enable));
        return;
      }
      
      // First handle the class on HTML element
      if (enable) {
        document.documentElement.classList.add('accessibility-custom-cursor');
      } else {
        document.documentElement.classList.remove('accessibility-custom-cursor');
      }
      
      // Store setting in localStorage
      localStorage.setItem('accessibility-custom-cursor', String(enable));
      
      // Add or remove stylesheet for CSS-based custom cursor
      let customCursorStylesheet = document.querySelector('link[data-accessibility-custom-cursor]');
      
      if (enable) {
        if (!customCursorStylesheet) {
          console.log('Enabling custom cursor mode...');
          // Debug information about available cursor files
          console.log('Checking cursor files:');
          ['cursors/default.cur', 'cursors/pointer.cur', 'cursors/text.cur'].forEach(cursorPath => {
            const url = chrome.runtime.getURL(cursorPath);
            console.log(`- ${cursorPath}: ${url}`);
          });
          
          const cssURL = chrome.runtime.getURL('custom-cursor.css');
          console.log('CSS URL:', cssURL);
          if (!cssURL) {
            console.error('Could not get URL for custom-cursor.css');
            return;
          }
          
          const linkElement = document.createElement('link');
          linkElement.setAttribute('rel', 'stylesheet');
          linkElement.setAttribute('data-accessibility-custom-cursor', 'true');
          linkElement.setAttribute('href', cssURL);
          document.head.appendChild(linkElement);
          console.log('Custom cursor mode enabled successfully');
        }
      } else {
        // Remove the stylesheet when disabled
        console.log("Removing custom cursor stylesheets...");
        
        document.querySelectorAll('link[data-accessibility-custom-cursor]').forEach(el => {
          try {
            el.remove();
            console.log("Removed a custom cursor stylesheet");
          } catch (err) {
            console.error("Error removing stylesheet:", err);
          }
        });
      }
      
      // Double check removal with a short delay
      setTimeout(() => {
        const remainingStylesheets = document.querySelectorAll('link[data-accessibility-custom-cursor]');
        if (remainingStylesheets.length > 0) {
          console.warn(`Found ${remainingStylesheets.length} custom cursor stylesheets that weren't removed - forcing removal again`);
          remainingStylesheets.forEach(el => {
            try {
              el.remove();
            } catch (err) {
              console.error("Error in second removal attempt:", err);
            }
          });        } else {
          console.log("All custom cursor stylesheets removed successfully");
        }
      }, 100);
    } catch (error) {
      console.error('Error in toggleCustomCursor function:', error);
    }
    
    // Update global state and debounce storage update
    debouncedStorageUpdate({ 
      customCursor: enable
    });
    
    // Immediately notify background script about state change
    try {
      chrome.runtime.sendMessage({
        action: "updateState",
        feature: "customCursor",
        enabled: enable
      }).catch(() => {
        // Ignore errors if background isn't ready
      });
    } catch (err) {
      console.log("Error sending customCursor update to background:", err);
    }
  }

  // Auto-scroll functionality    
  function toggleAutoScroll(enable: boolean): void {
    console.log(`Toggling auto-scroll: ${enable ? 'ON' : 'OFF'}`);
    
    try {
      // Debug logging to help investigate issues
      console.log('Auto-scroll toggle function called with enable =', enable);
      console.log('HTML element classes before toggle:', document.documentElement.classList.toString());
      
      // Track if state is changing to avoid redundant operations
      const currentState = document.documentElement.classList.contains('accessibility-auto-scroll');
      console.log('Current auto-scroll state detected as:', currentState);
      
      if (currentState === enable) {
        // No change needed, but ensure storage is consistent
        console.log('No state change needed, state already matches requested state');
        localStorage.setItem('accessibility-auto-scroll', String(enable));
        
        // Update global state via Chrome storage even if no visual change
        updateAutoScrollStorage(enable);
        return;
      }
      
      // First handle the class on HTML element
      if (enable) {
        document.documentElement.classList.add('accessibility-auto-scroll');
      } else {
        document.documentElement.classList.remove('accessibility-auto-scroll');
      }
      
      // Store setting in localStorage
      localStorage.setItem('accessibility-auto-scroll', String(enable));
      
      // Add or remove stylesheet for auto-scroll
      let autoScrollStylesheet = document.querySelector('link[data-accessibility-auto-scroll]');
      
      if (enable) {
        if (!autoScrollStylesheet) {
          console.log('Enabling auto-scroll mode...');
          
          const cssURL = chrome.runtime.getURL('auto-scroll.css');
          console.log('Auto-scroll CSS URL:', cssURL);
          if (!cssURL) {
            console.error('Could not get URL for auto-scroll.css');
            return;
          }
          
          const linkElement = document.createElement('link');
          linkElement.setAttribute('rel', 'stylesheet');
          linkElement.setAttribute('data-accessibility-auto-scroll', 'true');
          linkElement.setAttribute('href', cssURL);          
          document.head.appendChild(linkElement);
          
          // Create and add the scroll zones to the page
          createScrollZones();
          
          // Show a message to the user
          showTemporaryMessage('Auto-scroll feature enabled', 3000);
          
          console.log('Auto-scroll mode enabled successfully');
        }
      } else {
        // Remove the stylesheet when disabled
        console.log("Removing auto-scroll stylesheets and zones...");
        
        document.querySelectorAll('link[data-accessibility-auto-scroll]').forEach(el => {
          try {
            el.remove();
            console.log("Removed auto-scroll stylesheet");
          } catch (err) {
            console.error("Error removing stylesheet:", err);
          }
        });
        
        // Remove scroll zones
        removeScrollZones();
        
        // Show a message to the user
        showTemporaryMessage('Auto-scroll feature disabled', 3000);
      }
      
      // Update global state and debounce storage update
      debouncedStorageUpdate({ 
        autoScroll: enable
      });
      
      // Immediately notify background script about state change
      try {
        chrome.runtime.sendMessage({
          action: "updateState",
          feature: "autoScroll",
          enabled: enable
        }).catch(() => {
          // Ignore errors if background isn't ready
        });
      } catch (err) {
        console.log("Error sending autoScroll update to background:", err);
      }
    } catch (error) {
      console.error('Error in toggleAutoScroll function:', error);
    }
  }
  
  // Helper function to update Chrome storage with auto-scroll state
  function updateAutoScrollStorage(enabled: boolean): void {
    chrome.storage.sync.get("accessibilityState", (result) => {
      const state = result.accessibilityState || {};
      state.autoScroll = enabled;
      
      chrome.storage.sync.set({ 
        accessibilityState: state 
      }, () => {
        if (chrome.runtime.lastError) {
          console.error('Error updating storage:', chrome.runtime.lastError);
        } else {
          console.log('Auto-scroll state updated in Chrome storage:', enabled);
        }
      });
    });
  }
  
  // Helper functions for auto-scroll
  let scrollInterval: number | null = null;
  const SCROLL_SPEED = 10; // pixels per interval
  const SCROLL_INTERVAL_MS = 16; // roughly 60fps
    function createScrollZones() {
    // Remove any existing scroll zones first
    removeScrollZones();
    
    // Create top scroll zone
    const topZone = document.createElement('div');
    topZone.className = 'accessibility-auto-scroll-zone top';
    topZone.setAttribute('data-accessibility-auto-scroll-zone', 'top');
    
    // Debug text
    const topDebugText = document.createElement('div');
    topDebugText.textContent = "Scroll Up Zone";
    topDebugText.style.position = 'absolute';
    topDebugText.style.top = '5px';
    topDebugText.style.left = '10px';
    topDebugText.style.color = 'white';
    topDebugText.style.fontSize = '12px';
    topDebugText.style.fontWeight = 'bold';
    topDebugText.style.textShadow = '0 0 2px black';
    topZone.appendChild(topDebugText);
    
    // Create bottom scroll zone
    const bottomZone = document.createElement('div');
    bottomZone.className = 'accessibility-auto-scroll-zone bottom';
    bottomZone.setAttribute('data-accessibility-auto-scroll-zone', 'bottom');
    
    // Debug text
    const bottomDebugText = document.createElement('div');
    bottomDebugText.textContent = "Scroll Down Zone";
    bottomDebugText.style.position = 'absolute';
    bottomDebugText.style.bottom = '5px';
    bottomDebugText.style.left = '10px';
    bottomDebugText.style.color = 'white';
    bottomDebugText.style.fontSize = '12px';
    bottomDebugText.style.fontWeight = 'bold';
    bottomDebugText.style.textShadow = '0 0 2px black';
    bottomZone.appendChild(bottomDebugText);
    
    // Add event listeners with console logging
    topZone.addEventListener('mouseenter', () => {
      console.log('Mouse entered top scroll zone');
      startScrolling('up');
    });
    
    topZone.addEventListener('mouseleave', () => {
      console.log('Mouse left top scroll zone');
      stopScrolling();
    });
    
    bottomZone.addEventListener('mouseenter', () => {
      console.log('Mouse entered bottom scroll zone');
      startScrolling('down');
    });
    
    bottomZone.addEventListener('mouseleave', () => {
      console.log('Mouse left bottom scroll zone');
      stopScrolling();
    });
    
    // Add to DOM
    document.body.appendChild(topZone);
    document.body.appendChild(bottomZone);
    
    console.log('Auto-scroll zones created and attached to DOM');
  }
  
  function removeScrollZones() {
    // Stop any active scrolling
    stopScrolling();
    
    // Remove the zones from DOM
    document.querySelectorAll('[data-accessibility-auto-scroll-zone]').forEach(el => {
      try {
        el.remove();
      } catch (err) {
        console.error("Error removing scroll zone:", err);
      }
    });
    
    console.log('Auto-scroll zones removed');
  }
  function startScrolling(direction: 'up' | 'down') {
    // Clear any existing interval first
    stopScrolling();
    
    console.log(`Starting auto-scroll ${direction}`);
    
    // Add indicator class to body to show active scrolling
    document.body.classList.add('accessibility-auto-scrolling');
    document.body.classList.add(`accessibility-auto-scrolling-${direction}`);
    
    // Start with slightly faster speed for better feedback
    const initialSpeed = SCROLL_SPEED * 1.5;
    
    // Start a new scroll interval with acceleration
    let currentSpeed = initialSpeed;
    const maxSpeed = SCROLL_SPEED * 2.5;
    
    scrollInterval = window.setInterval(() => {
      if (direction === 'up') {
        window.scrollBy({
          top: -currentSpeed,
          behavior: 'auto'
        });
      } else {
        window.scrollBy({
          top: currentSpeed,
          behavior: 'auto'
        });
      }
      
      // Accelerate scrolling gradually up to max speed
      if (currentSpeed < maxSpeed) {
        currentSpeed = Math.min(currentSpeed * 1.05, maxSpeed);
      }
    }, SCROLL_INTERVAL_MS);
    
    // Use our helper function to show a notification
    showTemporaryMessage(`Auto-scrolling ${direction}`, 2000);
  }
  
  function stopScrolling() {
    if (scrollInterval) {
      // Remove indicator classes
      document.body.classList.remove('accessibility-auto-scrolling');
      document.body.classList.remove('accessibility-auto-scrolling-up');
      document.body.classList.remove('accessibility-auto-scrolling-down');
      window.clearInterval(scrollInterval);
      scrollInterval = null;
      console.log('Auto-scroll stopped');
    }
  }
  // Helper function to show a temporary message on the page
  function showTemporaryMessage(message: string, duration: number = 3000): void {
    try {
      // Remove any existing messages
      const existingMessage = document.querySelector('.accessibility-auto-scroll-notification');
      if (existingMessage && existingMessage.parentNode) {
        existingMessage.parentNode.removeChild(existingMessage);
      }
      
      // Create and add the message element
      const messageElement = document.createElement('div');
      messageElement.className = 'accessibility-auto-scroll-notification';
      messageElement.textContent = message;
      
      // Add specific styles for visibility
      messageElement.style.position = 'fixed';
      messageElement.style.bottom = '20px';
      messageElement.style.left = '50%';
      messageElement.style.transform = 'translateX(-50%)';
      messageElement.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
      messageElement.style.color = 'white';
      messageElement.style.padding = '10px 20px';
      messageElement.style.borderRadius = '4px';
      messageElement.style.fontSize = '16px';
      messageElement.style.zIndex = '100002'; // Higher than other elements
      messageElement.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.3)';
      
      document.body.appendChild(messageElement);
      
      // Remove after the specified duration
      setTimeout(() => {
        if (messageElement.parentNode) {
          messageElement.parentNode.removeChild(messageElement);
        }
      }, duration);
      
      console.log('Temporary message displayed:', message);
    } catch (error) {
      console.error('Error showing temporary message:', error);
    }
  }

  // Focus mode variables
  let focusModeLine: HTMLElement | null = null;
  let focusModeContainer: HTMLElement | null = null;
  const FOCUS_MODE_LINE_HEIGHT = 90;  // Function to toggle focus mode
  function toggleFocusMode(enabled: boolean): void {
    console.log(`Toggling focus mode: ${enabled ? 'ON' : 'OFF'}`);
    
    // Check current state to avoid redundant operations
    const currentState = document.documentElement.classList.contains('accessibility-focus-mode');
    console.log('Current focus mode state detected as:', currentState);
    
    // Always update localStorage and class state for consistency
    localStorage.setItem('accessibility-focus-mode', enabled ? 'true' : 'false');
    
    // Force the HTML class to match the requested state (critical for persistence)
    if (enabled) {
      document.documentElement.classList.add('accessibility-focus-mode');
    } else {
      document.documentElement.classList.remove('accessibility-focus-mode');
    }
    
    // Always update state in background script to ensure sync across components
    chrome.runtime.sendMessage({
      action: "updateState",
      feature: "focusMode",
      enabled: enabled
    }).catch(err => console.log("Error updating focus mode state in background:", err));
    
    // Also update global state via the debounced storage update
    debouncedStorageUpdate({ focusMode: enabled });
    
    // Skip further processing if visual state already matches
    if (currentState === enabled) {
      console.log('No visual change needed for focus mode, state already matches requested state');
      return;
    }
    
    // Remove existing focus mode elements if any
    if (focusModeContainer && focusModeContainer.parentNode) {
      focusModeContainer.parentNode.removeChild(focusModeContainer);
    }
    focusModeContainer = null;
    focusModeLine = null;

    document.querySelectorAll('link[data-accessibility-focus-mode]').forEach((element) => {
      element.remove();
    });
    
    document.removeEventListener('mousemove', updateFocusModePosition);
      if (enabled) {
      try {
        
        // Inject the stylesheet first
        const linkElement = document.createElement('link');
        linkElement.setAttribute('rel', 'stylesheet');
        linkElement.setAttribute('href', chrome.runtime.getURL('focus-mode.css'));
        linkElement.setAttribute('data-accessibility-focus-mode', 'true');
        document.head.appendChild(linkElement);
        
        // Create container
        focusModeContainer = document.createElement('div');
        focusModeContainer.className = 'accessibility-focus-mode-container';
        focusModeContainer.id = 'accessibility-focus-mode-container';
        
        // Create focus line and assign it to the module-scoped variable
        focusModeLine = document.createElement('div');
        focusModeLine.className = 'accessibility-focus-mode-line';
        if (isDarkMode()) {
          focusModeLine.classList.add('dark-mode');
        }
        
        focusModeContainer.appendChild(focusModeLine);
        document.body.appendChild(focusModeContainer);
        
        // Set initial position
        focusModeLine.style.top = `${(window.innerHeight / 2) - (FOCUS_MODE_LINE_HEIGHT / 2)}px`;
        
        // Add event listeners
        document.addEventListener('mousemove', updateFocusModePosition);
          
        console.log('Focus mode enabled successfully');
      } catch (error) {
        console.error('Error enabling focus mode:', error);
      }
    }
    
    // Update global state and debounce storage update
    debouncedStorageUpdate({ focusMode: enabled });
    
    // Explicitly notify background script about state change
    try {
      chrome.runtime.sendMessage({
        action: "updateState",
        feature: "focusMode",
        enabled: enabled
      }).catch(() => {
        // Ignore errors if background isn't ready
        console.log("Background script not ready for focus mode update");
      });
    } catch (err) {
      console.log("Error sending focusMode update to background:", err);
    }
  }

  // Function to update the focus mode line position based on mouse movement
  function updateFocusModePosition(e: MouseEvent) {
    if (focusModeLine) {
      const mouseY = e.clientY;
      const lineTop = mouseY - (FOCUS_MODE_LINE_HEIGHT / 2);
      focusModeLine.style.top = `${lineTop}px`;
    }
  }

  // Check if accessibility features were previously enabled on this page
  function initAccessibilitySettings(): void {
    // First check Chrome storage for global settings
    chrome.storage.sync.get("accessibilityState", (result) => {
      if (result.accessibilityState) {
        const globalSettings = result.accessibilityState;
        
        // Apply high contrast if enabled globally - avoid side effects
        if (globalSettings.highContrast === true) {
          // Apply only the high contrast feature
          document.documentElement.classList.add('accessibility-high-contrast');
          localStorage.setItem('accessibility-high-contrast', 'true');
        } else if (globalSettings.highContrast === false) {
          document.documentElement.classList.remove('accessibility-high-contrast');
          localStorage.setItem('accessibility-high-contrast', 'false');
        }
        
        // Apply dyslexia font if enabled globally - avoid side effects
        if (globalSettings.dyslexiaFont === true) {
          // Apply only the dyslexia font feature
          document.documentElement.classList.add('accessibility-dyslexia-font');
          localStorage.setItem('accessibility-dyslexia-font', 'true');
        } else if (globalSettings.dyslexiaFont === false) {
          document.documentElement.classList.remove('accessibility-dyslexia-font');
          localStorage.setItem('accessibility-dyslexia-font', 'false');
        }
        
        // Apply colourblind settings if enabled globally
        if (globalSettings.colorBlind) {
          if (globalSettings.colorBlind.deuteranopia === true) {
            toggleColorBlind(true, 'deuteranopia');
          } else if (globalSettings.colorBlind.protanopia === true) {
            toggleColorBlind(true, 'protanopia');
          } else if (globalSettings.colorBlind.tritanopia === true) {
            toggleColorBlind(true, 'tritanopia');
          } else {
            toggleColorBlind(false, 'deuteranopia');
          }
        }
        
        // Apply reading line if enabled globally - avoid side effects
        if (globalSettings.readingLine === true) {
          // Force re-creation of reading line to ensure it's active
          const existingContainer = document.querySelector('.accessibility-reading-line-container');
          if (existingContainer) {
            document.body.removeChild(existingContainer);
          }
          
          // Remove any previous event listeners to avoid duplicates
          document.removeEventListener('mousemove', updateReadingLinePosition);
          document.removeEventListener('visibilitychange', handleVisibilityChange);
          
          // Create new container and line
          const container = document.createElement('div');
          container.className = 'accessibility-reading-line-container';
          container.id = 'accessibility-reading-line-container';
          
          const line = document.createElement('div');
          line.className = 'accessibility-reading-line';
          if (isDarkMode()) {
            line.classList.add('dark-mode');
          }
          
          container.appendChild(line);
          document.body.appendChild(container);
          
          // Set initial position
          line.style.top = `${window.innerHeight / 2}px`;
          
          // Add event listeners
          document.addEventListener('mousemove', updateReadingLinePosition);
          document.addEventListener('visibilitychange', handleVisibilityChange);
          
          localStorage.setItem('accessibility-reading-line', 'true');
        } else if (globalSettings.readingLine === false) {
          // Make sure it's removed if disabled globally
          const existingContainer = document.querySelector('.accessibility-reading-line-container');
          if (existingContainer) {
            document.body.removeChild(existingContainer);
          }
          document.removeEventListener('mousemove', updateReadingLinePosition);
          document.removeEventListener('visibilitychange', handleVisibilityChange);
          localStorage.setItem('accessibility-reading-line', 'false');
        }

        // Apply text scaling if enabled globally - avoid side effects
        if (globalSettings.textScaling && globalSettings.textScaling.enabled === true) {
          toggleTextScaling(true, globalSettings.textScaling.value);
        } else if (globalSettings.textScaling && globalSettings.textScaling.enabled === false) {
          toggleTextScaling(false);
        }

        // Apply line height if enabled globally - avoid side effects
        if (globalSettings.lineHeight && globalSettings.lineHeight.enabled === true) {
          toggleLineHeight(true, globalSettings.lineHeight.value);
        } else if (globalSettings.lineHeight && globalSettings.lineHeight.enabled === false) {
          toggleLineHeight(false);
        }

        // Apply reduced motion if enabled globally
        if (globalSettings.reducedMotion === true) {
          toggleReducedMotion(true);
        } else if (globalSettings.reducedMotion === false) {
          toggleReducedMotion(false);
        }
        
        // Apply large targets if enabled globally
        if (globalSettings.largeTargets === true) {
          toggleLargeTargets(true);
        } else if (globalSettings.largeTargets === false) {
          toggleLargeTargets(false);
        }        // Apply custom cursor if enabled globally
        if (globalSettings.customCursor === true) {
          toggleCustomCursor(true);
        } else if (globalSettings.customCursor === false) {
          toggleCustomCursor(false);
        }
        
        // Apply hover controls if enabled globally
        if (globalSettings.hoverControls === true) {
          toggleHoverControls(true);
        } else if (globalSettings.hoverControls === false) {
          toggleHoverControls(false);
        }
          // Apply image descriptions if enabled globally
        if (globalSettings.imageDescriptions === true) {
          toggleImageDescriptions(true, true);
        } else if (globalSettings.imageDescriptions === false) {
          toggleImageDescriptions(false, true);
        }
      } else {
        // Fall back to localStorage if no global settings found
        
        const highContrastEnabled = localStorage.getItem('accessibility-high-contrast') === 'true';
        if (highContrastEnabled) {
          document.documentElement.classList.add('accessibility-high-contrast');
        }
        
        const dyslexiaFontEnabled = localStorage.getItem('accessibility-dyslexia-font') === 'true';
        if (dyslexiaFontEnabled) {
          document.documentElement.classList.add('accessibility-dyslexia-font');
        }
        
        // Apply colourblind settings from localStorage, but only one at a time
        const deuteranopiaEnabled = localStorage.getItem('accessibility-deuteranopia') === 'true';
        const protanopiaEnabled = localStorage.getItem('accessibility-protanopia') === 'true';
        const tritanopiaEnabled = localStorage.getItem('accessibility-tritanopia') === 'true';
        
        // Apply just one colourblind filter with priority order
        if (deuteranopiaEnabled) {
          toggleColorBlind(true, 'deuteranopia');
        } else if (protanopiaEnabled) {
          toggleColorBlind(true, 'protanopia');
        } else if (tritanopiaEnabled) {
          toggleColorBlind(true, 'tritanopia');
        }
        
        const readingLineEnabled = localStorage.getItem('accessibility-reading-line') === 'true';
        if (readingLineEnabled) {
          // Force re-creation of reading line
          const existingContainer = document.querySelector('.accessibility-reading-line-container');
          if (existingContainer) {
            document.body.removeChild(existingContainer);
          }
          
          // Remove any previous event listeners
          document.removeEventListener('mousemove', updateReadingLinePosition);
          document.removeEventListener('visibilitychange', handleVisibilityChange);
          
          // Create new container and line
          const container = document.createElement('div');
          container.className = 'accessibility-reading-line-container';
          container.id = 'accessibility-reading-line-container';
          
          const line = document.createElement('div');
          line.className = 'accessibility-reading-line';
          if (isDarkMode()) {
            line.classList.add('dark-mode');
          }
          
          container.appendChild(line);
          document.body.appendChild(container);
          
          // Set initial position
          line.style.top = `${window.innerHeight / 2}px`;
          
          // Add event listeners
          document.addEventListener('mousemove', updateReadingLinePosition);
          document.addEventListener('visibilitychange', handleVisibilityChange);
        }

        const textScalingEnabled = localStorage.getItem('accessibility-text-scaling-enabled') === 'true';
        const textScalingValue = parseInt(localStorage.getItem('accessibility-text-scaling-value') || '100', 10);
        if (textScalingEnabled) {
          toggleTextScaling(true, textScalingValue);
        }

        const lineHeightEnabled = localStorage.getItem('accessibility-line-height-enabled') === 'true';
        const lineHeightValue = parseFloat(localStorage.getItem('accessibility-line-height-value') || '1.5');
        if (lineHeightEnabled) {
          toggleLineHeight(true, lineHeightValue);
        }

        // Apply reduced motion settings from localStorage
        const reducedMotionEnabled = localStorage.getItem('accessibility-reduced-motion') === 'true';
        if (reducedMotionEnabled) {
          toggleReducedMotion(true);
        }
          // Apply keyboard navigation settings from localStorage
        const keyboardNavEnabled = localStorage.getItem('accessibility-keyboard-nav') === 'true';
        if (keyboardNavEnabled) {
          toggleKeyboardNav(true);
        }
        
        // Apply large targets settings from localStorage
        const largeTargetsEnabled = localStorage.getItem('accessibility-large-targets') === 'true';
        if (largeTargetsEnabled) {
          toggleLargeTargets(true);
        }        // Apply custom cursor settings from localStorage        
        const customCursorEnabled = localStorage.getItem('accessibility-custom-cursor') === 'true';
        if (customCursorEnabled) {
          toggleCustomCursor(true);
        }
        
        // Apply auto-scroll settings from localStorage
        const autoScrollEnabled = localStorage.getItem('accessibility-auto-scroll') === 'true';
        if (autoScrollEnabled) {
          toggleAutoScroll(true);
        }
          // Apply hover controls settings from localStorage
        const hoverControlsState = localStorage.getItem('accessibility-hover-controls') === 'true';
        if (hoverControlsState) {
          toggleHoverControls(true);
        }
        
        // Apply highlight links settings from localStorage
        const highlightLinksState = localStorage.getItem('accessibility-highlight-links') === 'true';
        if (highlightLinksState) {
          toggleHighlightLinks(true);
        }
          // Apply image descriptions settings from localStorage
        const imageDescriptionsState = localStorage.getItem('accessibility-image-descriptions');
        // Only enable if the value is 'true', not if it's 'turnedOff'
        if (imageDescriptionsState === 'true') {
          toggleImageDescriptions(true, true);
        }
        
        // Update global storage with local settings - ensure colourblind state reflects that only one filter is active
        const colorBlindState = {
          enabled: deuteranopiaEnabled || protanopiaEnabled || tritanopiaEnabled,
          deuteranopia: deuteranopiaEnabled,
          protanopia: deuteranopiaEnabled ? false : protanopiaEnabled,
          tritanopia: deuteranopiaEnabled || protanopiaEnabled ? false : tritanopiaEnabled
        };
          const hoverControlsEnabled = localStorage.getItem('accessibility-hover-controls') === 'true';
          const highlightLinksEnabled = document.documentElement.classList.contains('accessibility-highlight-links') ||
                                      localStorage.getItem('accessibility-highlight-links') === 'true';
          const readingProgressEnabled = document.documentElement.classList.contains('accessibility-reading-progress') ||
                                      localStorage.getItem('accessibility-reading-progress') === 'true';
          const imageDescriptionsEnabled = document.documentElement.classList.contains('accessibility-image-descriptions') ||
                                      localStorage.getItem('accessibility-image-descriptions') === 'true';
          // Don't include in state if it was turned off through Turn All Off
          const imageDescriptionsTurnedOff = localStorage.getItem('accessibility-image-descriptions') === 'turnedOff';
        
        chrome.storage.sync.set({
          accessibilityState: {
            highContrast: highContrastEnabled,
            dyslexiaFont: dyslexiaFontEnabled,
            colorBlind: colorBlindState,
            readingLine: readingLineEnabled,
            textScaling: { enabled: textScalingEnabled, value: textScalingValue },
            lineHeight: { enabled: lineHeightEnabled, value: lineHeightValue },
            reducedMotion: reducedMotionEnabled,
            keyboardNav: keyboardNavEnabled,
            largeTargets: largeTargetsEnabled,
            customCursor: customCursorEnabled,
            autoScroll: autoScrollEnabled,
            hoverControls: hoverControlsEnabled,
            highlightLinks: highlightLinksEnabled,
            readingProgress: readingProgressEnabled,
            imageDescriptions: imageDescriptionsTurnedOff ? false : imageDescriptionsEnabled
          }
        });
      }
      
      // Inform the extension about the current state
      updateBackgroundState();
    });
  }

  // Function to update the background script about current state
  function updateBackgroundState(): void {
    // Use setTimeout to ensure message is sent after content script is fully initialized
    setTimeout(() => {
      const highContrastEnabled = document.documentElement.classList.contains('accessibility-high-contrast');
      const dyslexiaFontEnabled = document.documentElement.classList.contains('accessibility-dyslexia-font');
      const readingLineEnabled = !!document.querySelector('.accessibility-reading-line-container');
      const textScalingEnabled = localStorage.getItem('accessibility-text-scaling-enabled') === 'true';
      const lineHeightEnabled = localStorage.getItem('accessibility-line-height-enabled') === 'true';      
      const reducedMotionEnabled = document.documentElement.classList.contains('accessibility-reduced-motion');
      const keyboardNavDOM = !!document.querySelector('link[data-accessibility-keyboard-nav]');
      const keyboardNavStorage = localStorage.getItem('accessibility-keyboard-nav') === 'true';
      const keyboardNavEnabled = keyboardNavDOM || keyboardNavStorage;
      const largeTargetsEnabled = document.documentElement.classList.contains('accessibility-large-targets');
      const customCursorEnabled = !!document.querySelector('link[data-accessibility-custom-cursor]');
      const autoScrollEnabled = !!document.querySelector('link[data-accessibility-auto-scroll]') || 
                              localStorage.getItem('accessibility-auto-scroll') === 'true';
      const hoverControlsEnabled = document.documentElement.classList.contains('accessibility-hover-controls') ||
                                localStorage.getItem('accessibility-hover-controls') === 'true';
      const highlightLinksEnabled = document.documentElement.classList.contains('accessibility-highlight-links') ||
                                  localStorage.getItem('accessibility-highlight-links') === 'true';
      
      // Check colourblind modes
      const deuteranopiaEnabled = document.documentElement.classList.contains('accessibility-deuteranopia');
      const protanopiaEnabled = document.documentElement.classList.contains('accessibility-protanopia');
      const tritanopiaEnabled = document.documentElement.classList.contains('accessibility-tritanopia');
      const colorBlindEnabled = deuteranopiaEnabled || protanopiaEnabled || tritanopiaEnabled;
      
      chrome.runtime.sendMessage({ 
        action: "updateState", 
        feature: "highContrast", 
        enabled: highContrastEnabled 
      });
      
      chrome.runtime.sendMessage({ 
        action: "updateState", 
        feature: "dyslexiaFont", 
        enabled: dyslexiaFontEnabled 
      });

      // Update colourblind states
      chrome.runtime.sendMessage({
        action: "updateState", 
        feature: "colorBlind",
        enabled: colorBlindEnabled,
        deuteranopia: deuteranopiaEnabled,
        protanopia: protanopiaEnabled,
        tritanopia: tritanopiaEnabled
      });

      chrome.runtime.sendMessage({
        action: "updateState",
        feature: "readingLine",
        enabled: readingLineEnabled
      });

      chrome.runtime.sendMessage({
        action: "updateState",
        feature: "textScaling",
        enabled: textScalingEnabled
      });      chrome.runtime.sendMessage({
        action: "updateState",
        feature: "lineHeight",
        enabled: lineHeightEnabled
      });

      chrome.runtime.sendMessage({
        action: "updateState",
        feature: "largeTargets",
        enabled: largeTargetsEnabled
      });

      chrome.runtime.sendMessage({
        action: "updateState",
        feature: "reducedMotion",
        enabled: reducedMotionEnabled
      });

      chrome.runtime.sendMessage({
        action: "updateState",
        feature: "keyboardNav",
        enabled: keyboardNavEnabled
      });

      chrome.runtime.sendMessage({
        action: "updateState",
        feature: "customCursor",
        enabled: customCursorEnabled
      });      chrome.runtime.sendMessage({
        action: "updateState",
        feature: "autoScroll",
        enabled: autoScrollEnabled
      });

      chrome.runtime.sendMessage({
        action: "updateState",
        feature: "hoverControls",
        enabled: hoverControlsEnabled
      });

      chrome.runtime.sendMessage({
        action: "updateState",
        feature: "highlightLinks",
        enabled: highlightLinksEnabled
      });

      const readingProgressEnabled = document.documentElement.classList.contains('accessibility-reading-progress') ||
                                  localStorage.getItem('accessibility-reading-progress') === 'true';
      chrome.runtime.sendMessage({
        action: "updateState",
        feature: "readingProgress",
        enabled: readingProgressEnabled
      });      const imageDescriptionsState = localStorage.getItem('accessibility-image-descriptions');
      const imageDescriptionsEnabled = document.documentElement.classList.contains('accessibility-image-descriptions') ||
                                   imageDescriptionsState === 'true';
      // Don't re-enable if it was turned off through Turn All Off
      const imageDescriptionIsTurnedOff = imageDescriptionsState === 'turnedOff';
      
      chrome.runtime.sendMessage({
        action: "updateState",
        feature: "imageDescriptions",
        enabled: imageDescriptionIsTurnedOff ? false : imageDescriptionsEnabled
      });
    }, 100);
  }

  // Also listen for page load events to handle single-page applications
  window.addEventListener('load', () => {
    // Check if reading line should be active
    const readingLineEnabled = localStorage.getItem('accessibility-reading-line') === 'true';
    if (readingLineEnabled) {
      // Ensure reading line is present
      const existingContainer = document.querySelector('.accessibility-reading-line-container');
      if (!existingContainer) {
        // Recreate reading line
        toggleReadingLine(true);
      }
    }
    
    // Check colourblind settings
    const deuteranopiaEnabled = localStorage.getItem('accessibility-deuteranopia') === 'true';
    if (deuteranopiaEnabled) {
      toggleColorBlind(true, 'deuteranopia');
    }
    
    const protanopiaEnabled = localStorage.getItem('accessibility-protanopia') === 'true';
    if (protanopiaEnabled) {
      toggleColorBlind(true, 'protanopia');
    }
    
    const tritanopiaEnabled = localStorage.getItem('accessibility-tritanopia') === 'true';
    if (tritanopiaEnabled) {
      toggleColorBlind(true, 'tritanopia');
    }

    // Check reduced motion settings
    const reducedMotionEnabled = localStorage.getItem('accessibility-reduced-motion') === 'true';
    if (reducedMotionEnabled) {
      toggleReducedMotion(true);
    }
  });

  // Initialize on page load
  initAccessibilitySettings();

  // Clear any hover controls state to prevent issues with the navigation tracking
  localStorage.removeItem('accessibility-hover-last-click');
  localStorage.removeItem('accessibility-hover-last-target');
  localStorage.removeItem('accessibility-hover-click-count');
  // Function to toggle hover controls  
  function toggleHoverControls(enable: boolean, fromBackground = false): void {
    try {
      const currentState = document.documentElement.classList.contains('accessibility-hover-controls');
      
      // If the state already matches what's requested, do nothing
      if (currentState === enable) {
        console.log(`Hover controls are already ${enable ? 'enabled' : 'disabled'}, no action needed`);
        return;
      }
      
      if (enable) {
        // Implementation for enabling hover controls
        console.log(`Toggling hover controls: ON`);
        // Add hover class to document element to enable CSS styles
        document.documentElement.classList.add('accessibility-hover-controls');
        
        // Create link to CSS if it doesn't exist
        if (!document.querySelector('link[data-accessibility-hover-controls]')) {
          try {
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = chrome.runtime.getURL('hover-controls.css');
            console.log('CSS URL:', link.href);
            link.setAttribute('data-accessibility-hover-controls', 'true');
            document.head.appendChild(link);
            console.log('Hover controls CSS added to page');
          } catch (error) {
            console.error('Error adding hover controls CSS:', error);
          }
        }
        
        // Add event listeners
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('click', handleClick);
        console.log('Hover controls event listeners added');
        
        // Store the state in localStorage
        localStorage.setItem('accessibility-hover-controls', 'true');
        
        // If the user is manually enabling after a "Turn All Off", clear that state
        if (!fromBackground) {
          localStorage.removeItem('accessibility-hover-turnedOff');
        }
        
        // Test by highlighting a sample element
        setTimeout(() => {
          console.log('Testing hover controls detection...');
          const links = document.querySelectorAll('a');
          console.log(`Found ${links.length} links on page`);
        }, 500);
      } else {
        // Implementation for disabling hover controls
        console.log(`Toggling hover controls: OFF`);
        // Remove class
        document.documentElement.classList.remove('accessibility-hover-controls');
        
        // Remove the CSS link
        const link = document.querySelector('link[data-accessibility-hover-controls]');
        if (link && link.parentNode) {
          link.parentNode.removeChild(link);
        }
        
        // Remove all hover elements first
        removeHoverElements();

        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('click', handleClick);
        console.log('Hover controls event listeners removed');
        
        // Store the state in localStorage
        localStorage.setItem('accessibility-hover-controls', fromBackground ? 'turnedOff' : 'false');
      }
      
      // Only send update to background if this wasn't triggered by the background
      if (!fromBackground) {
        try {
          chrome.runtime.sendMessage({ 
            action: "updateState", 
            feature: "hoverControls", 
            enabled: enable 
          });
        } catch (err) {
          console.error('Error sending message to background script:', err);
        }
      }
    } catch (err) {
      console.error('Error in toggleHoverControls:', err);
    }
  }
  
  // Variables for hover controls
  let hoverTarget: Element | null = null;
  let hoverIndicator: HTMLElement | null = null;
  let hoverTimer: HTMLElement | null = null;
  let hoverTimeout: number | null = null;
  let lastHoverPosition = { x: 0, y: 0 };
  
  // Clean up all hover elements
  function removeHoverElements(): void {
    // Clear any active timeout
    if (hoverTimeout) {
      window.clearTimeout(hoverTimeout);
      hoverTimeout = null;
    }
    
    // Remove the hover indicator if it exists
    const indicators = document.querySelectorAll('.accessibility-hover-indicator');
    indicators.forEach(indicator => {
      if (indicator.parentNode) {
        indicator.parentNode.removeChild(indicator);
      }
    });
    
    // Remove any animations that might be playing
    const animations = document.querySelectorAll('.accessibility-hover-click-animation');
    animations.forEach(animation => {
      if (animation.parentNode) {
        animation.parentNode.removeChild(animation);
      }
    });
    
    // Reset variables
    hoverTarget = null;
    hoverIndicator = null;
    hoverTimer = null;
  }
  // Function to handle mouse movement
  function handleMouseMove(event: MouseEvent): void {
    // Get the element under the mouse
    const target = document.elementFromPoint(event.clientX, event.clientY);
    
    // Store current mouse position
    lastHoverPosition = { x: event.clientX, y: event.clientY };
    
    // Skip if no target or if it's a hover control element
    if (!target || 
        target.closest('.accessibility-hover-indicator') || 
        target.closest('.accessibility-hover-click-animation')) {
      return;
    }
    
    // Check if it's a clickable element
    const isClickable = isElementClickable(target);
    
    // Log occasional debug info (throttled to avoid console spam)
    if (Math.random() < 0.01) {  // Only log ~1% of movements
      console.log(`Mouse over ${target.tagName}${target.id ? '#'+target.id : ''}, clickable: ${isClickable}`);
    }
    
    // If not a clickable element, remove hover indicators and clear timeout
    if (!isClickable) {
      removeHoverElements();
      return;
    }
    
    // If it's the same target as before, reset the timer
    if (target === hoverTarget) {
      // Reset the timer for the current target
      if (hoverTimeout) {
        window.clearTimeout(hoverTimeout);
        hoverTimeout = null;
      }
      
      // Restart the timer animation
      startHoverTimer();
      return;
    }
    
    // It's a new clickable target, set up hover
    console.log(`New clickable target: ${target.tagName}${target.id ? '#'+target.id : ''}`);
    removeHoverElements();
    setupHoverIndicator(target, event.clientX, event.clientY);
  }
  
  // Check if an element is clickable (link, button, etc.)
  function isElementClickable(element: Element | null): boolean {
    if (!element) return false;
    
    // Check tag name for common clickable elements
    const tagName = element.tagName.toLowerCase();
    if (['a', 'button', 'input', 'select', 'textarea', 'summary'].includes(tagName)) {
      return true;
    }
    
    if (element.hasAttribute('role')) {
      const role = element.getAttribute('role')?.toLowerCase();
      if (['button', 'link', 'checkbox', 'radio', 'switch', 'tab', 'menuitem'].includes(role || '')) {
        return true;
      }
    }
    
    // Check for cursor style suggesting it's clickable
    const styles = window.getComputedStyle(element as Element);
    if (styles.cursor === 'pointer') {
      return true;
    }
    
    // Check for common class names that suggest interactive elements
    const classNames = element.className.split(' ');
    const interactiveClassPatterns = ['btn', 'button', 'clickable', 'link', 'nav-item', 'menu-item'];
    for (const pattern of interactiveClassPatterns) {
      if (classNames.some(className => className.toLowerCase().includes(pattern))) {
        return true;
      }
    }
    
    return false;
  }
  // Set up hover indicator and timer
  function setupHoverIndicator(target: Element, clientX: number, clientY: number): void {
    console.log(`Setting up hover indicator for ${target.tagName} element`);
    
    // Set current hover target
    hoverTarget = target;
    
    // Get target's bounding rect
    const rect = target.getBoundingClientRect();
    console.log(`Target position: top=${rect.top}, left=${rect.left}, width=${rect.width}, height=${rect.height}`);
    
    // Create hover indicator
    hoverIndicator = document.createElement('div');
    hoverIndicator.className = 'accessibility-hover-indicator';
    hoverIndicator.style.top = rect.top + window.scrollY + 'px';
    hoverIndicator.style.left = rect.left + window.scrollX + 'px';
    hoverIndicator.style.width = rect.width + 'px';
    hoverIndicator.style.height = rect.height + 'px';
    
    // Create timer bar
    hoverTimer = document.createElement('div');
    hoverTimer.className = 'accessibility-hover-timer';
    hoverIndicator.appendChild(hoverTimer);
    
    // Add to document
    document.body.appendChild(hoverIndicator);
    console.log('Hover indicator added to document');
    
    // Store current mouse position for click animation
    lastHoverPosition = { x: clientX, y: clientY };
    
    // Start hover timer animation
    startHoverTimer();
  }
    // Handle hover timer animation and action
  function startHoverTimer(): void {
    // Clear any existing timeout
    if (hoverTimeout) {
      window.clearTimeout(hoverTimeout);
    }
    
    // Skip if no hover elements
    if (!hoverIndicator || !hoverTimer || !hoverTarget) return;
    
    // Animation duration (3000ms = 3 seconds)
    const HOVER_DURATION = 3000;
    let startTime = Date.now();
    
    console.log('Starting hover timer animation');
    
    // Function to update timer
    const updateTimer = () => {
      if (!hoverIndicator || !hoverTimer || !hoverTarget) return;
      
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / HOVER_DURATION, 1);
      
      // Update timer width
      hoverTimer.style.width = (progress * 100) + '%';
      
      // Add class when we're almost done
      if (progress > 0.75) {
        hoverIndicator.classList.add('accessibility-hover-almost-complete');
      } else {
        hoverIndicator.classList.remove('accessibility-hover-almost-complete');
      }
      
      // If timer is complete, trigger click
      if (progress >= 1) {
        console.log('Timer complete, triggering click');
        triggerClickOnTarget();
      } else {
        // Otherwise, continue animation
        window.requestAnimationFrame(updateTimer);
      }
    };
    
    // Start the animation
    window.requestAnimationFrame(updateTimer);
    
    // Set a backup timeout for 3 seconds as a fallback
    hoverTimeout = window.setTimeout(() => {
      console.log('Timer backup triggered');
      triggerClickOnTarget();
    }, HOVER_DURATION);
  }
    // Trigger click animation and actual click
  function triggerClickOnTarget(): void {
    if (!hoverTarget || !hoverIndicator) return;
    
    // Clear any hover timeout
    if (hoverTimeout) {
      window.clearTimeout(hoverTimeout);
      hoverTimeout = null;
    }
    
    // Create click animation
    const clickAnimation = document.createElement('div');
    clickAnimation.className = 'accessibility-hover-click-animation';
    clickAnimation.style.top = (lastHoverPosition.y + window.scrollY) + 'px';
    clickAnimation.style.left = (lastHoverPosition.x + window.scrollX) + 'px';
    clickAnimation.style.transform = 'translate(-50%, -50%)';
    document.body.appendChild(clickAnimation);
    
    // Show temporary message
    showTemporaryMessage('Clicking element', 1000);
    
    // Simulate click on the target
    console.log('Simulating click on', hoverTarget.tagName, hoverTarget.textContent ? hoverTarget.textContent.slice(0, 20) : '');
    simulateClick(hoverTarget);
    
    // Remove after animation finishes
    setTimeout(() => removeHoverElements(), 500);
  }
  // Function to safely simulate a click
  function simulateClick(element: Element): void {
    try {
      const now = Date.now();
      const lastClickTime = parseInt(localStorage.getItem('accessibility-hover-last-click') || '0', 10);
      const lastClickTarget = localStorage.getItem('accessibility-hover-last-target') || '';
      const currentTarget = element.tagName + 
                           (element.id ? '#' + element.id : '') + 
                           (element.className ? '.' + element.className.replace(/\s+/g, '.') : '');
      
      const timeSinceLastClick = now - lastClickTime;
      const sameTarget = currentTarget === lastClickTarget;
      
      // Clear old click data if it's been more than 5 seconds
      if (timeSinceLastClick > 5000) {
        localStorage.removeItem('accessibility-hover-last-click');
        localStorage.removeItem('accessibility-hover-last-target');
        localStorage.removeItem('accessibility-hover-click-count');
      }
      
      if (timeSinceLastClick < 1000 && sameTarget) {
        const clickCount = parseInt(localStorage.getItem('accessibility-hover-click-count') || '0', 10) + 1;
        localStorage.setItem('accessibility-hover-click-count', clickCount.toString());
        
        if (clickCount > 3) {
          console.log('Too many rapid clicks on same element, pausing briefly');
          setTimeout(() => {
            localStorage.removeItem('accessibility-hover-click-count');
          }, 3000);
          return;
        }
      } else {
        // Reset click count for new elements
        localStorage.setItem('accessibility-hover-click-count', '1');
      }
      
      // Update click timestamp and target
      localStorage.setItem('accessibility-hover-last-click', now.toString());
      localStorage.setItem('accessibility-hover-last-target', currentTarget);
      
      // For links, handle navigation with care
      if (element.tagName.toLowerCase() === 'a') {
        const anchor = element as HTMLAnchorElement;
        const href = anchor.href;
        
        // Skip javascript: URLs or empty hrefs
        if (!href || href.startsWith('javascript:') || href === '#') {
          const clickEvent = new MouseEvent('click', {
            view: window,
            bubbles: true,
            cancelable: true,
            clientX: lastHoverPosition.x,
            clientY: lastHoverPosition.y
          });
          element.dispatchEvent(clickEvent);
        } else {
          console.log('Link with href detected, navigating to:', href);
          
          // Use a minimal timeout to let the animation complete
          setTimeout(() => {
            try {
              // Navigate to the URL
              window.location.assign(href);
            } catch (navError) {
              console.error('Navigation error:', navError);
            }
          }, 50);
        }
      } else {
        console.log('Simulating click on non-link element');
        // For non-link elements, use the standard click approach
        const clickEvent = new MouseEvent('click', {
          view: window,
          bubbles: true,
          cancelable: true,
          clientX: lastHoverPosition.x,
          clientY: lastHoverPosition.y
        });
        element.dispatchEvent(clickEvent);
      }
    } catch (error) {
      console.error('Error simulating click:', error);
    }
  }
  
  // Handle real clicks to clear hover elements
  function handleClick(): void {
    removeHoverElements();
  }

  // Function to toggle highlight links
  function toggleHighlightLinks(enable: boolean): void {
    console.log(`Toggling highlight links: ${enable ? 'ON' : 'OFF'}`);
    
    // Check current state to avoid redundant operations
    const currentState = document.documentElement.classList.contains('accessibility-highlight-links');
    if (currentState === enable) {
      // No change needed, but ensure storage is consistent
      localStorage.setItem('accessibility-highlight-links', String(enable));
      return;
    }
    
    // Update HTML class
    if (enable) {
      document.documentElement.classList.add('accessibility-highlight-links');
    } else {
      document.documentElement.classList.remove('accessibility-highlight-links');
    }
    
    // Store setting in localStorage
    localStorage.setItem('accessibility-highlight-links', String(enable));
    
    // Add or remove stylesheet
    let highlightLinksStylesheet = document.querySelector('link[data-accessibility-highlight-links]');
    
    if (enable) {
      if (!highlightLinksStylesheet) {
        try {
          const cssURL = chrome.runtime.getURL('highlight-links.css');
          console.log('CSS URL:', cssURL);
          
          const linkElement = document.createElement('link');
          linkElement.setAttribute('rel', 'stylesheet');
          linkElement.setAttribute('data-accessibility-highlight-links', 'true');
          linkElement.setAttribute('href', cssURL);
          document.head.appendChild(linkElement);
          console.log('Highlight links mode enabled successfully');
        } catch (error) {
          console.error('Error applying highlight links mode:', error);
        }
      }
    } else {
      // Remove the stylesheet when disabled
      document.querySelectorAll('link[data-accessibility-highlight-links]').forEach(el => {
        try {
          el.remove();
        } catch (err) {
          console.error("Error removing stylesheet:", err);
        }
      });
    }
    
    // Update global state and debounce storage update
    debouncedStorageUpdate({ highlightLinks: enable });
    
    // Notify background script of state change
    try {
      chrome.runtime.sendMessage({
        action: "updateState",
        feature: "highlightLinks",
        enabled: enable
      }).catch(() => {
        // Ignore errors if background isn't ready
      });
    } catch (err) {
      console.log("Error sending highlightLinks update to background:", err);
    }
  }
  
  // Function to toggle reading progress
  function toggleReadingProgress(enable: boolean): void {
    console.log(`Toggling reading progress: ${enable ? 'ON' : 'OFF'}`);
    
    // Check current state to avoid redundant operations
    const currentState = document.documentElement.classList.contains('accessibility-reading-progress');
    if (currentState === enable) {
      // No change needed, but ensure storage is consistent
      localStorage.setItem('accessibility-reading-progress', String(enable));
      return;
    }
    
    // Update HTML class
    if (enable) {
      document.documentElement.classList.add('accessibility-reading-progress');
    } else {
      document.documentElement.classList.remove('accessibility-reading-progress');
    }
    
    // Store setting in localStorage
    localStorage.setItem('accessibility-reading-progress', String(enable));
    
    // Add or remove stylesheet and progress indicator
    let readingProgressStylesheet = document.querySelector('link[data-accessibility-reading-progress]');
    let progressContainer = document.querySelector('.accessibility-reading-progress-container');
    
    if (enable) {
      // Add stylesheet if it doesn't exist
      if (!readingProgressStylesheet) {
        try {
          const cssURL = chrome.runtime.getURL('reading-progress.css');
          console.log('Reading Progress CSS URL:', cssURL);
          
          const linkElement = document.createElement('link');
          linkElement.setAttribute('rel', 'stylesheet');
          linkElement.setAttribute('data-accessibility-reading-progress', 'true');
          linkElement.setAttribute('href', cssURL);
          document.head.appendChild(linkElement);
        } catch (error) {
          console.error('Error applying reading progress stylesheet:', error);
        }
      }
      
      // Create progress indicator if it doesn't exist
      if (!progressContainer) {
        try {
          // Create container with progress bar
          const container = document.createElement('div');
          container.className = 'accessibility-reading-progress-container';
          
          const progressBar = document.createElement('div');
          progressBar.className = 'accessibility-reading-progress-bar';
          container.appendChild(progressBar);
          
          // Add to DOM
          document.body.insertBefore(container, document.body.firstChild);
          
          // Initialize scroll tracking
          updateReadingProgress();
          
          // Add scroll event listener
          window.addEventListener('scroll', updateReadingProgress);
        } catch (error) {
          console.error('Error creating reading progress indicator:', error);
        }
      }
    } else {
      // Remove the stylesheet when disabled
      if (readingProgressStylesheet) {
        readingProgressStylesheet.remove();
      }
      
      // Remove the progress indicator
      if (progressContainer) {
        progressContainer.remove();
      }
      
      // Remove scroll event listener
      window.removeEventListener('scroll', updateReadingProgress);
    }
    
    // Update global state and debounce storage update
    debouncedStorageUpdate({ readingProgress: enable });
    
    // Notify background script of state change
    try {
      chrome.runtime.sendMessage({
        action: "updateState",
        feature: "readingProgress",
        enabled: enable
      }).catch(() => {
        // Ignore errors if background isn't ready
      });
    } catch (err) {
      console.log("Error sending readingProgress update to background:", err);
    }
  }
    // Function to update reading progress indicator based on scroll position
  function updateReadingProgress(): void {
    const progressBar = document.querySelector('.accessibility-reading-progress-bar') as HTMLElement;
    if (!progressBar) return;
    
    // Calculate how far the user has scrolled
    const scrollTop = window.scrollY || document.documentElement.scrollTop;
    const scrollHeight = document.documentElement.scrollHeight;
    const clientHeight = document.documentElement.clientHeight;
    
    // Calculate scroll percentage
    const scrollPercentage = (scrollTop / (scrollHeight - clientHeight)) * 100;
    
    // Update progress bar width
    progressBar.style.width = `${Math.min(scrollPercentage, 100)}%`;
  }
    // Variables to track active tooltip state
  let activeTooltipElement: Element | null = null;
  let lastTooltipEvent: MouseEvent | null = null;
  // Function to toggle image descriptions
  function toggleImageDescriptions(enable: boolean, fromBackground = false): void {
    console.log(`Toggling image descriptions: ${enable ? 'ON' : 'OFF'}, fromBackground: ${fromBackground}`);
    
    // Get current local storage state
    const currentLocalState = localStorage.getItem('accessibility-image-descriptions');
    
    // Check if the request is to enable image descriptions and if they were recently turned off
    if (enable && !fromBackground && currentLocalState === 'turnedOff') {
      console.log('Image descriptions were recently turned off via "Turn All Off". User must explicitly re-enable.');
      
      // Notify background that we're not enabling the feature
      try {
        chrome.runtime.sendMessage({
          action: "updateState",
          feature: "imageDescriptions",
          enabled: false
        }).catch(() => {
          // Ignore errors if background isn't ready
        });
      } catch (error) {
        console.warn('Failed to notify background of image descriptions state change:', error);
      }
      
      return;
    }
    
    // Check current DOM state to avoid redundant operations
    const currentState = document.documentElement.classList.contains('accessibility-image-descriptions');
    if (currentState === enable) {
      // No DOM change needed, but ensure storage is consistent
      localStorage.setItem('accessibility-image-descriptions', fromBackground && !enable ? 'turnedOff' : String(enable));
      return;
    }
    
    // Update HTML class
    if (enable) {
      document.documentElement.classList.add('accessibility-image-descriptions');
    } else {
      document.documentElement.classList.remove('accessibility-image-descriptions');
    }
    
    // Store setting in localStorage with special handling for Turn All Off
    localStorage.setItem('accessibility-image-descriptions', fromBackground && !enable ? 'turnedOff' : String(enable));
    
    // Add or remove stylesheet and image description tooltips
    let imageDescriptionsStylesheet = document.querySelector('link[data-accessibility-image-descriptions]');
    let tooltipContainer = document.querySelector('.accessibility-image-description-tooltip');
    
    if (enable) {
      // Add stylesheet if it doesn't exist
      if (!imageDescriptionsStylesheet) {
        try {
          const cssURL = chrome.runtime.getURL('image-descriptions.css');
          console.log('Image Descriptions CSS URL:', cssURL);
          
          const linkElement = document.createElement('link');
          linkElement.setAttribute('rel', 'stylesheet');
          linkElement.setAttribute('data-accessibility-image-descriptions', 'true');
          linkElement.setAttribute('href', cssURL);
          document.head.appendChild(linkElement);
        } catch (error) {
          console.error('Error applying image descriptions stylesheet:', error);
        }
      }
      
      // Create tooltip container if it doesn't exist
      if (!tooltipContainer) {
        try {
          // Create tooltip container
          const container = document.createElement('div');
          container.className = 'accessibility-image-description-tooltip';
          
          // Add to DOM
          document.body.appendChild(container);
        } catch (error) {
          console.error('Error creating image description tooltip container:', error);
        }
      }
      
      // Setup image descriptions
      setupImageDescriptions();
      
      // Add scroll event listener to update tooltip position
      window.addEventListener('scroll', handlePageScroll, { passive: true });
    } else {
      // Remove the stylesheet when disabled
      if (imageDescriptionsStylesheet) {
        imageDescriptionsStylesheet.remove();
      }
      
      // Remove the tooltip container
      if (tooltipContainer) {
        tooltipContainer.remove();
      }
      
      // Remove image description event listeners
      removeImageDescriptionListeners();
      
      // Remove scroll event listener
      window.removeEventListener('scroll', handlePageScroll);
      
      // Reset tooltip tracking variables
      activeTooltipElement = null;
      lastTooltipEvent = null;
    }
    
    // Only send update to background if this wasn't triggered by the background
    if (!fromBackground) {
      // Notify background script of state change
      try {
        chrome.runtime.sendMessage({
          action: "updateState",
          feature: "imageDescriptions",
          enabled: enable
        }).catch(() => {
          // Ignore errors if background isn't ready
        });
      } catch (error) {
        console.warn('Failed to notify background of image descriptions state change:', error);
      }
    }
  }
  // Helper function to set up image descriptions
  function setupImageDescriptions(): void {
    // Only target images and elements that contain images
    const imageElements = document.querySelectorAll('img, input[type="image"]');
    const containersWithImages = document.querySelectorAll('a:has(img), button:has(img), [role="button"]:has(img)');
    
    // Add event listeners to all standalone images
    imageElements.forEach(element => {
      element.addEventListener('mouseenter', handleImageMouseEnter as EventListener);
      element.addEventListener('mouseleave', handleImageMouseLeave as EventListener);
      element.addEventListener('mousemove', handleImageMouseMove as EventListener);
    });
    
    // Add event listeners to containers with images
    containersWithImages.forEach(element => {
      element.addEventListener('mouseenter', handleImageMouseEnter as EventListener);
      element.addEventListener('mouseleave', handleImageMouseLeave as EventListener);
      element.addEventListener('mousemove', handleImageMouseMove as EventListener);
    });
    
    // Set up observer for dynamically added images
    setupImageObserver();
  }
  
  // Function to observe dynamically added images
  function setupImageObserver(): void {
    // Remove any existing observer
    if (window.__imageObserver) {
      window.__imageObserver.disconnect();
    }
    
    // Create a new mutation observer
    const observer = new MutationObserver(mutations => {
      mutations.forEach(mutation => {
        if (mutation.type === 'childList') {
          mutation.addedNodes.forEach(node => {            if (node.nodeType === Node.ELEMENT_NODE) {              // Handle added images
              const addedElement = node as Element;
              
              // Check if it's an image
              const isImage = addedElement.tagName === 'IMG' || 
                            (addedElement.tagName === 'INPUT' && addedElement.getAttribute('type') === 'image');
              
              // Check if it's a container with an image
              const isContainerWithImage = 
                (addedElement.tagName === 'A' || 
                 addedElement.tagName === 'BUTTON' || 
                 addedElement.getAttribute('role') === 'button') && 
                addedElement.querySelector('img') !== null;
              
              // Only add listeners if it's an image or contains an image
              if (isImage || isContainerWithImage) {
                addedElement.addEventListener('mouseenter', handleImageMouseEnter as EventListener);
                addedElement.addEventListener('mouseleave', handleImageMouseLeave as EventListener);
                addedElement.addEventListener('mousemove', handleImageMouseMove as EventListener);
              }
              
            // Also check for any relevant elements inside the added node
              // Only select images and containers that have images
              const nestedImages = addedElement.querySelectorAll('img, input[type="image"]');
              const nestedContainersWithImages = addedElement.querySelectorAll('a:has(img), button:has(img), [role="button"]:has(img)');
              
              // Add listeners to images
              nestedImages.forEach(element => {
                element.addEventListener('mouseenter', handleImageMouseEnter as EventListener);
                element.addEventListener('mouseleave', handleImageMouseLeave as EventListener);
                element.addEventListener('mousemove', handleImageMouseMove as EventListener);
              });
              
              // Add listeners to containers with images
              nestedContainersWithImages.forEach(element => {
                element.addEventListener('mouseenter', handleImageMouseEnter as EventListener);
                element.addEventListener('mouseleave', handleImageMouseLeave as EventListener);
                element.addEventListener('mousemove', handleImageMouseMove as EventListener);
              });
            }
          });
        }
      });
    });
    
    // Start observing the document
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
    
    // Store observer reference
    window.__imageObserver = observer;
  }
  
  // Function to handle mouse entering an image
  function handleImageMouseEnter(event: MouseEvent): void {
    const target = event.target as Element;
    
    // Only proceed if this element is an image or contains an image
    const isImage = target.tagName === 'IMG' || 
                   (target.tagName === 'INPUT' && target.getAttribute('type') === 'image');
    const hasImage = target.querySelector('img') !== null;
    
    if (!isImage && !hasImage) {
      return; // Skip if not image-related
    }
    
    const description = getImageDescription(target);
    
    if (description && description !== 'No image found in this element') {
      const tooltip = document.querySelector('.accessibility-image-description-tooltip') as HTMLElement;
      if (tooltip) {
        tooltip.textContent = description;
        tooltip.classList.add('visible');
        positionTooltip(tooltip, event);
        
        // Store for scroll handling
        activeTooltipElement = target;
        lastTooltipEvent = event;
      }
    }
  }
  
  // Function to handle mouse leaving an image
  function handleImageMouseLeave(): void {
    const tooltip = document.querySelector('.accessibility-image-description-tooltip') as HTMLElement;
    if (tooltip) {
      tooltip.classList.remove('visible');
    }
  }
    // Function to handle mouse moving over an image
  function handleImageMouseMove(event: MouseEvent): void {
    const tooltip = document.querySelector('.accessibility-image-description-tooltip') as HTMLElement;
    if (tooltip && tooltip.classList.contains('visible')) {
      positionTooltip(tooltip, event);
    }
  }
  
  // Function to position the tooltip near the image
  function positionTooltip(tooltip: HTMLElement, event: MouseEvent): void {
    const offset = 15; // Offset from cursor
    
    // Use clientX/clientY with scroll offsets for better positioning
    let left = event.clientX + window.scrollX + offset;
    let top = event.clientY + window.scrollY + offset;
    
    // Get the dimensions of the tooltip and viewport
    const tooltipRect = tooltip.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    
    // Adjust position if tooltip would go off the right edge
    if (left + tooltipRect.width > viewportWidth + window.scrollX) {
      left = event.clientX + window.scrollX - tooltipRect.width - offset;
    }
    
    // Adjust position if tooltip would go off the bottom edge
    if (top + tooltipRect.height > viewportHeight + window.scrollY) {
      top = event.clientY + window.scrollY - tooltipRect.height - offset;
    }
    
    // Apply the position using fixed coordinates for consistent positioning during scrolling
    tooltip.style.position = 'fixed';
    tooltip.style.left = `${event.clientX + offset}px`;
    tooltip.style.top = `${event.clientY + offset}px`;
  }
    // Function to get image description from alt, title, or aria-label attributes
  function getImageDescription(element: Element): string {
    // Handle direct image elements
    if (element.tagName === 'IMG') {
      const alt = element.getAttribute('alt');
      const title = element.getAttribute('title');
      const ariaLabel = element.getAttribute('aria-label');
      
      // Prefer alt text, then aria-label, then title
      if (alt && alt.trim() !== '') {
        return alt;
      } else if (ariaLabel && ariaLabel.trim() !== '') {
        return ariaLabel;
      } else if (title && title.trim() !== '') {
        return title;
      }
      
      return 'No description available for this image';
    }
    
    // Input type="image" elements
    if (element.tagName === 'INPUT' && element.getAttribute('type') === 'image') {
      const alt = element.getAttribute('alt');
      const title = element.getAttribute('title');
      const ariaLabel = element.getAttribute('aria-label');
      
      if (alt && alt.trim() !== '') {
        return alt;
      } else if (ariaLabel && ariaLabel.trim() !== '') {
        return ariaLabel;
      } else if (title && title.trim() !== '') {
        return title;
      }
      
      return 'No description available for this image button';
    }
    
    // Handle buttons, links, and other interactive elements that contain images
    const childImg = element.querySelector('img');
    if (childImg) {
      const imgAlt = childImg.getAttribute('alt');
      const imgTitle = childImg.getAttribute('title');
      const imgAriaLabel = childImg.getAttribute('aria-label');
      
      if (imgAlt && imgAlt.trim() !== '') {
        return imgAlt;
      } else if (imgAriaLabel && imgAriaLabel.trim() !== '') {
        return imgAriaLabel;
      } else if (imgTitle && imgTitle.trim() !== '') {
        return imgTitle;
      }
      
      // If no description found on the image, try the container
      const containerAriaLabel = element.getAttribute('aria-label');
      const containerTitle = element.getAttribute('title');
      const containerText = element.textContent?.trim();
      
      if (containerAriaLabel && containerAriaLabel.trim() !== '') {
        return containerAriaLabel;
      } else if (containerTitle && containerTitle.trim() !== '') {
        return containerTitle;
      } else if (containerText && containerText !== '') {
        return containerText;
      }
      
      return 'No description available for this image';
    }
    
    // We should not reach here with our improved filtering, but just in case
    return 'No image found in this element';
  }// Function to remove image description event listeners
  function removeImageDescriptionListeners(): void {
    // Use the same selectors as in setupImageDescriptions
    const imageElements = document.querySelectorAll('img, input[type="image"]');
    const containersWithImages = document.querySelectorAll('a:has(img), button:has(img), [role="button"]:has(img)');
    
    // Remove event listeners from standalone images
    imageElements.forEach(element => {
      element.removeEventListener('mouseenter', handleImageMouseEnter as EventListener);
      element.removeEventListener('mouseleave', handleImageMouseLeave as EventListener);
      element.removeEventListener('mousemove', handleImageMouseMove as EventListener);
    });
    
    // Remove event listeners from containers with images
    containersWithImages.forEach(element => {
      element.removeEventListener('mouseenter', handleImageMouseEnter as EventListener);
      element.removeEventListener('mouseleave', handleImageMouseLeave as EventListener);
      element.removeEventListener('mousemove', handleImageMouseMove as EventListener);
    });
    
    // Disconnect the observer
    if (window.__imageObserver) {
      window.__imageObserver.disconnect();
      window.__imageObserver = null;
    }
  }
  
  // Function to handle page scroll events and reposition tooltips
  function handlePageScroll(): void {
    // If we have an active tooltip and mouse event data, reposition the tooltip
    if (activeTooltipElement && lastTooltipEvent) {
      const tooltip = document.querySelector('.accessibility-image-description-tooltip') as HTMLElement;
      
      if (tooltip && tooltip.classList.contains('visible')) {
        // Create a new event object with updated scroll coordinates
        const updatedEvent = new MouseEvent('mousemove', {
          clientX: lastTooltipEvent.clientX,
          clientY: lastTooltipEvent.clientY,
          bubbles: true,
          cancelable: true,
          view: window
        });
        
        // Update position with the new event coordinates
        positionTooltip(tooltip, updatedEvent);
      }
    }
  }
  
  // Debug message to indicate that the script has loaded
  console.debug("Accessibility extension content script loaded");
})();