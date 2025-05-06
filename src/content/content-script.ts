// Listen for messages from the extension popup/background
chrome.runtime.onMessage.addListener((request, _sender, sendResponse) => {
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
  
  // Add other accessibility toggles here in the future
  return false;
});

// Function to toggle high contrast mode
function toggleHighContrast(enable: boolean): void {
  // Apply the change to the DOM
  if (enable) {
    document.documentElement.classList.add('accessibility-high-contrast');
  } else {
    document.documentElement.classList.remove('accessibility-high-contrast');
  }
  
  // Store the setting in localStorage for this specific feature
  localStorage.setItem('accessibility-high-contrast', String(enable));
  
  // Also update global Chrome storage for cross-tab consistency
  chrome.storage.sync.get("accessibilityState", (result) => {
    const state = result.accessibilityState || {};
    state.highContrast = enable;
    
    chrome.storage.sync.set({ 
      accessibilityState: state 
    }, () => {
      if (chrome.runtime.lastError) {
        console.error("Error updating storage:", chrome.runtime.lastError);
      }
    });
  });
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
  
  // Also update global Chrome storage for cross-tab consistency
  chrome.storage.sync.get("accessibilityState", (result) => {
    const state = result.accessibilityState || {};
    state.dyslexiaFont = enable;
    
    chrome.storage.sync.set({ 
      accessibilityState: state 
    }, () => {
      if (chrome.runtime.lastError) {
        console.error("Error updating storage:", chrome.runtime.lastError);
      }
    });
  });
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

// Function to toggle reading line
function toggleReadingLine(enable: boolean): void {
  // Check if there's an existing reading line container
  const existingContainer = document.querySelector('.accessibility-reading-line-container');
  
  if (!enable) {
    // Only remove the line if disabling the feature
    if (existingContainer) {
      document.body.removeChild(existingContainer);
    }
    // Remove event listener when disabled
    document.removeEventListener('mousemove', updateReadingLinePosition);
  } else {
    // If enabling the feature and a container already exists, don't create a new one
    if (!existingContainer) {
      // Create container and line elements
      const container = document.createElement('div');
      container.className = 'accessibility-reading-line-container';
      container.id = 'accessibility-reading-line-container'; // Add ID for easier targeting
      
      const line = document.createElement('div');
      line.className = 'accessibility-reading-line';
      
      // Apply different class based on dark/light mode
      if (isDarkMode()) {
        line.classList.add('dark-mode');
      }
      
      container.appendChild(line);
      
      // Add to DOM
      document.body.appendChild(container);
      
      // Initial position (middle of viewport)
      line.style.top = `${window.innerHeight / 2}px`;
    }
    
    // Position the line at mouse cursor Y position - always add the event listener
    // to ensure it works even if the container already existed
    document.addEventListener('mousemove', updateReadingLinePosition);
    
    // Handle visibility changes - reinitialize when tab becomes visible again
    document.addEventListener('visibilitychange', handleVisibilityChange);
  }
  
  // Store the setting in localStorage for this specific feature
  localStorage.setItem('accessibility-reading-line', String(enable));
  
  // Also update global Chrome storage for cross-tab consistency
  chrome.storage.sync.get("accessibilityState", (result) => {
    const state = result.accessibilityState || {};
    state.readingLine = enable;
    
    chrome.storage.sync.set({ 
      accessibilityState: state 
    }, () => {
      if (chrome.runtime.lastError) {
        console.error("Error updating storage:", chrome.runtime.lastError);
      }
    });
  });
}

// Handle visibility changes to ensure reading line persists when tab becomes visible
function handleVisibilityChange(): void {
  if (document.visibilityState === 'visible') {
    // Check if reading line should be active
    const readingLineEnabled = localStorage.getItem('accessibility-reading-line') === 'true';
    if (readingLineEnabled) {
      // Check if the line exists, if not recreate it
      const existingContainer = document.querySelector('.accessibility-reading-line-container');
      if (!existingContainer) {
        // Recreate the reading line
        const container = document.createElement('div');
        container.className = 'accessibility-reading-line-container';
        container.id = 'accessibility-reading-line-container';
        
        const line = document.createElement('div');
        line.className = 'accessibility-reading-line';
        
        // Apply different class based on dark/light mode
        if (isDarkMode()) {
          line.classList.add('dark-mode');
        }
        
        container.appendChild(line);
        document.body.appendChild(container);
        
        // Initial position
        line.style.top = `${window.innerHeight / 2}px`;
        
        // Ensure the event listener is active
        document.addEventListener('mousemove', updateReadingLinePosition);
      }
    }
  }
}

// Function to update reading line position
function updateReadingLinePosition(e: MouseEvent): void {
  const line = document.querySelector('.accessibility-reading-line');
  if (line) {
    (line as HTMLElement).style.top = `${e.clientY}px`;
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
      // For lucide.dev, apply scaling only to specific elements to avoid excessive DOM updates
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
  
  // For lucide.dev/icons, don't update storage with every slider movement
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
    // The html[data-line-height="custom"] selector gives us higher specificity
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
        // Make sure it's removed if disabled globally
        document.documentElement.classList.remove('accessibility-high-contrast');
        localStorage.setItem('accessibility-high-contrast', 'false');
      }
      
      // Apply dyslexia font if enabled globally - avoid side effects
      if (globalSettings.dyslexiaFont === true) {
        // Apply only the dyslexia font feature
        document.documentElement.classList.add('accessibility-dyslexia-font');
        localStorage.setItem('accessibility-dyslexia-font', 'true');
      } else if (globalSettings.dyslexiaFont === false) {
        // Make sure it's removed if disabled globally
        document.documentElement.classList.remove('accessibility-dyslexia-font');
        localStorage.setItem('accessibility-dyslexia-font', 'false');
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
    } else {
      // Fall back to localStorage if no global settings found
      // Only apply each setting individually to avoid side effects
      
      const highContrastEnabled = localStorage.getItem('accessibility-high-contrast') === 'true';
      if (highContrastEnabled) {
        document.documentElement.classList.add('accessibility-high-contrast');
      }
      
      const dyslexiaFontEnabled = localStorage.getItem('accessibility-dyslexia-font') === 'true';
      if (dyslexiaFontEnabled) {
        document.documentElement.classList.add('accessibility-dyslexia-font');
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
      
      // Update global storage with local settings
      chrome.storage.sync.set({
        accessibilityState: {
          highContrast: highContrastEnabled,
          dyslexiaFont: dyslexiaFontEnabled,
          readingLine: readingLineEnabled,
          textScaling: { enabled: textScalingEnabled, value: textScalingValue },
          lineHeight: { enabled: lineHeightEnabled, value: lineHeightValue }
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

    chrome.runtime.sendMessage({
      action: "updateState",
      feature: "readingLine",
      enabled: readingLineEnabled
    });

    chrome.runtime.sendMessage({
      action: "updateState",
      feature: "textScaling",
      enabled: textScalingEnabled
    });

    chrome.runtime.sendMessage({
      action: "updateState",
      feature: "lineHeight",
      enabled: lineHeightEnabled
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
});

// Initialize on page load
initAccessibilitySettings();