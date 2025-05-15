// Add TypeScript declaration for our custom window property
declare global {
  interface Window {
    __accessibilityExtensionLoaded?: boolean;
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
        sendResponse({ enabled: false, error: error.toString() });
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

  // Function to toggle keyboard navigation
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
        }
        // Update global storage with local settings - ensure colourblind state reflects that only one filter is active
        const colorBlindState = {
          enabled: deuteranopiaEnabled || protanopiaEnabled || tritanopiaEnabled,
          deuteranopia: deuteranopiaEnabled,
          protanopia: deuteranopiaEnabled ? false : protanopiaEnabled,
          tritanopia: deuteranopiaEnabled || protanopiaEnabled ? false : tritanopiaEnabled
        };
        
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
            largeTargets: largeTargetsEnabled
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

  // Add console message to help with debugging
  console.debug("Accessibility extension content script loaded");
})();