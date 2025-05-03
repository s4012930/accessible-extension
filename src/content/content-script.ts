// Listen for messages from the extension popup/background
chrome.runtime.onMessage.addListener((request, _sender, sendResponse) => {
  if (request.action === "toggleHighContrast") {
    toggleHighContrast(request.enabled);
    sendResponse({ status: "success" });
    return true;
  }
  
  // Add other accessibility toggles here in the future
  return false;
});

// Function to toggle high contrast mode
function toggleHighContrast(enable: boolean): void {
  if (enable) {
    document.documentElement.classList.add('accessibility-high-contrast');
  } else {
    document.documentElement.classList.remove('accessibility-high-contrast');
  }
  
  // Store the setting in localStorage for persistence within the page
  localStorage.setItem('accessibility-high-contrast', String(enable));
}

// Check if high contrast was previously enabled on this page
function initAccessibilitySettings(): void {
  const highContrastEnabled = localStorage.getItem('accessibility-high-contrast') === 'true';
  if (highContrastEnabled) {
    toggleHighContrast(true);
  }
  
  // Inform the extension about the current state
  chrome.runtime.sendMessage({ 
    action: "updateState", 
    feature: "highContrast", 
    enabled: highContrastEnabled 
  });
}

// Initialize on page load
initAccessibilitySettings();