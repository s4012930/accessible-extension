import { useState, useEffect } from 'react';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardTitle } from '@/components/ui/card';
import { CollapsibleSlider } from '@/components/ui/collapsible-slider';
import { Contrast, Type, Keyboard, Video, BookA, Eye, MousePointer, Brain, Sun, Moon, TextSelect, RulerIcon, AlignJustify, MousePointerClick, MousePointer2, MousePointerSquareDashed, LayoutDashboard, Focus, MoveHorizontal, EyeOff, ChevronDown, ChevronUp, Link2, ImageIcon, ArrowDownUp } from 'lucide-react';
import { Toaster } from '@/components/ui/sonner';
import { toast } from 'sonner';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';

// Define constant toast ID
const FEATURE_TOAST_ID = 'feature-toggle';

interface AccessibilityState {
  highContrast: boolean;
  dyslexiaFont: boolean;
  readingLine: boolean;
  colorBlind?: {
    enabled: boolean;
    deuteranopia: boolean;
    protanopia: boolean;
    tritanopia: boolean;
  };
  textScaling?: {
    enabled: boolean;
    value: number;
  };
  lineHeight?: {
    enabled: boolean;
    value: number;
  };
  reducedMotion?: boolean;
  keyboardNav?: boolean;
  largeTargets?: {
    enabled: boolean;
    value: number;
  };
  customCursor?: boolean;
  autoScroll?: boolean;
  hoverControls?: boolean;
}

// Define a new component for collapsible toggles
interface CollapsibleTogglesProps {
  icon: React.ReactNode;
  label: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  children: React.ReactNode;
  className?: string;
}

function CollapsibleToggles({
  icon,
  label,
  checked,
  onCheckedChange,
  children,
  className
}: CollapsibleTogglesProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  // When the switch is turned off, collapse the toggles
  useEffect(() => {
    if (!checked) {
      setIsExpanded(false);
    }
  }, [checked]);

  // When the switch is turned on, expand the toggles
  const handleCheckedChange = (newChecked: boolean) => {
    onCheckedChange(newChecked);
    if (newChecked) {
      setIsExpanded(true);
    }
  };

  return (
    <div className={cn("py-1", className)}>
      <div className="flex items-center justify-between mb-1">
        <span className="flex items-center gap-2">
          {icon}
          <span>{label}</span>
        </span>
        <div className="flex items-center gap-2">
          {checked && (
            <button
              type="button"
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-1 rounded-full hover:bg-muted"
              aria-label={isExpanded ? 'Hide options' : 'Show options'}
            >
              {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
          )}
          <Switch checked={checked} onCheckedChange={handleCheckedChange} />
        </div>
      </div>
      
      {checked && isExpanded && (
        <div className="mt-2 pl-8 space-y-2">
          {children}
        </div>
      )}
    </div>
  );
}

export default function Popup() {
  const { setTheme } = useTheme();
  const [darkMode, setDarkMode] = useState(false);
  
  // Vision features
  const [vision, setVision] = useState(false);
  const [dyslexia, setDyslexia] = useState(false);
  const [colorBlind, setColorBlind] = useState({
    enabled: false,
    deuteranopia: false,
    protanopia: false,
    tritanopia: false
  });
  const [textScaling, setTextScaling] = useState({ enabled: false, value: 100 });
  const [readingLine, setReadingLine] = useState(false);
  const [lineHeight, setLineHeight] = useState({ enabled: false, value: 1.5 });
  const [reducedMotion, setReducedMotion] = useState(false);
  
  // Separate throttling flags for each slider to prevent race conditions
  const [isTextScalingUpdating, setIsTextScalingUpdating] = useState(false);
  const [isLineHeightUpdating, setIsLineHeightUpdating] = useState(false);
  
  // Motor features
  const [motor, setMotor] = useState(false);
  const [largeTargets, setLargeTargets] = useState<{enabled: boolean, value: number}>({enabled: false, value: 1.5});
  const [customCursor, setCustomCursor] = useState(false);
  const [autoScroll, setAutoScroll] = useState(false);
  const [hoverControls, setHoverControls] = useState(false);
  // Cognitive features
  const [simplifiedView, setSimplifiedView] = useState(false);
  const [focusMode, setFocusMode] = useState(false);
  const [highlightLinks, setHighlightLinks] = useState(false);
  const [imageDescriptions, setImageDescriptions] = useState(false);
  
  // Misc features
  const [aiAlt, setAiAlt] = useState(false);
  
  // Load saved state when popup opens
  useEffect(() => {
    // Set up message listener to catch state updates from background script
    const messageListener = (request: any) => {
      if (request.action === "stateUpdated" && request.state) {
        const updatedState = request.state;
        setVision(updatedState.highContrast);
        setDyslexia(updatedState.dyslexiaFont);
        setReadingLine(updatedState.readingLine || false);
        setColorBlind(updatedState.colorBlind || { enabled: false, deuteranopia: false, protanopia: false, tritanopia: false });
        setTextScaling(updatedState.textScaling || { enabled: false, value: 100 });
        setLineHeight(updatedState.lineHeight || { enabled: false, value: 1.5 });
        setReducedMotion(updatedState.reducedMotion || false);
        setMotor(updatedState.keyboardNav || false);
        setLargeTargets(updatedState.largeTargets || {enabled: false, value: 1.5});
        setCustomCursor(updatedState.customCursor || false);
        setAutoScroll(updatedState.autoScroll || false);
        setHoverControls(updatedState.hoverControls || false);
      }
      return true;
    };
    
    chrome.runtime.onMessage.addListener(messageListener);
    
    // Get initial state
    chrome.runtime.sendMessage({ action: "getState" }, (response: AccessibilityState) => {
      if (response) {
        setVision(response.highContrast);
        setDyslexia(response.dyslexiaFont);
        setReadingLine(response.readingLine || false);
        setColorBlind(response.colorBlind || { enabled: false, deuteranopia: false, protanopia: false, tritanopia: false });
        setTextScaling(response.textScaling || { enabled: false, value: 100 });
        setLineHeight(response.lineHeight || { enabled: false, value: 1.5 });        
        setReducedMotion(response.reducedMotion || false);
        setMotor(response.keyboardNav || false);
        setLargeTargets(response.largeTargets || {enabled: false, value: 1.5});
        setCustomCursor(response.customCursor || false);
        setAutoScroll(response.autoScroll || false);
        setHoverControls(response.hoverControls || false);
      }
      
      // Query the active tab directly to get the most up-to-date keyboard navigation state
      chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
        if (tabs[0]?.id) {
          try {
            chrome.tabs.sendMessage(tabs[0].id, { action: "getKeyboardNavState" }, (tabResponse) => {
              if (chrome.runtime.lastError) {
                // Ignore errors - tab might not have our content script
                return;
              }
              
              if (tabResponse && typeof tabResponse.enabled === 'boolean') {
                // Update motor state from the active tab
                setMotor(tabResponse.enabled);
                
                // Update background script if there's a mismatch
                if (response && response.keyboardNav !== tabResponse.enabled) {
                  chrome.runtime.sendMessage({
                    action: "updateState",
                    feature: "keyboardNav",
                    enabled: tabResponse.enabled
                  });
                }
              }
            });
          } catch (e) {
            // Ignore any errors
            console.log("Error querying tab keyboard navigation state:", e);
          }
          try {
            chrome.tabs.sendMessage(tabs[0].id, { action: "getKeyboardNavState" }, (response) => {
              if (chrome.runtime.lastError) {
                // Ignore errors - tab might not have our content script
                return;
              }
              
              if (response && typeof response.enabled === 'boolean') {
                setMotor(response.enabled);
              }
            });
          } catch (e) {
            // Ignore any errors from tabs that don't have our content script
            console.log("Error querying tab state:", e);
          }
        }
      });
    });
    
    // Check localStorage for theme preference first
    const savedTheme = localStorage.getItem('theme') || 'light';
    setTheme(savedTheme);
    setDarkMode(savedTheme === 'dark');
    
    // Clean up listener when component unmounts
    return () => {
      chrome.runtime.onMessage.removeListener(messageListener);
    };
  }, [setTheme]); // Remove theme dependency to prevent re-renders

  const toggleDarkMode = () => {
    const newDarkMode = !darkMode;
    setDarkMode(newDarkMode);
    const newTheme = newDarkMode ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme); // Save preference
    
    // Remove the flag since user is manually changing the theme
    localStorage.removeItem('darkModeByHighContrast');
  };

  const handleVision = (checked: boolean) => {
    setVision(checked);
    
    // Enable dark mode when high contrast is enabled
    if (checked && !darkMode) {
      setDarkMode(true);
      setTheme('dark');
      localStorage.setItem('theme', 'dark');
      // Store that dark mode was enabled by high contrast
      localStorage.setItem('darkModeByHighContrast', 'true');
    } 
    // Disable dark mode when high contrast is disabled, but only if it was enabled by high contrast
    else if (!checked && localStorage.getItem('darkModeByHighContrast') === 'true') {
      setDarkMode(false);
      setTheme('light');
      localStorage.setItem('theme', 'light');
      localStorage.removeItem('darkModeByHighContrast');
    }
    
    // Send message to background script
    chrome.runtime.sendMessage({ 
      action: "toggleFeature", 
      feature: "highContrast", 
      enabled: checked 
    }, (response) => {
      if (response && response.status === "success") {
        toast.success(`High Contrast mode ${checked ? 'enabled' : 'disabled'}!`, {
          id: FEATURE_TOAST_ID
        });
        
        // Get updated state to ensure UI stays in sync with actual state
        chrome.runtime.sendMessage({ action: "getState" }, (response: AccessibilityState) => {
          if (response) {
            setVision(response.highContrast);
            setDyslexia(response.dyslexiaFont);
            setReadingLine(response.readingLine || false);
            setColorBlind(response.colorBlind || { enabled: false, deuteranopia: false, protanopia: false, tritanopia: false });
            setTextScaling(response.textScaling || { enabled: false, value: 100 });
            setLineHeight(response.lineHeight || { enabled: false, value: 1.5 });
            setReducedMotion(response.reducedMotion || false);
          }
        });
      } else {
        toast.error('Failed to toggle High Contrast mode', {
          id: FEATURE_TOAST_ID
        });
        // Revert UI state if operation failed
        setVision(!checked);
        
        // Also revert dark mode if it was just changed
        if (checked && localStorage.getItem('darkModeByHighContrast') === 'true') {
          setDarkMode(false);
          setTheme('light');
          localStorage.setItem('theme', 'light');
          localStorage.removeItem('darkModeByHighContrast');
        } else if (!checked && darkMode && localStorage.getItem('darkModeByHighContrast') === 'true') {
          setDarkMode(true);
          setTheme('dark');
          localStorage.setItem('theme', 'dark');
        }
      }
    });
  };

  const handleDyslexia = (checked: boolean) => {
    setDyslexia(checked);
    
    // Send message to background script
    chrome.runtime.sendMessage({ 
      action: "toggleFeature", 
      feature: "dyslexiaFont", 
      enabled: checked 
    }, (response) => {
      if (response && response.status === "success") {
        toast.success(`Dyslexia Font ${checked ? 'enabled' : 'disabled'}!`, {
          id: FEATURE_TOAST_ID
        });
        
        // Get updated state to ensure UI stays in sync with actual state
        chrome.runtime.sendMessage({ action: "getState" }, (response: AccessibilityState) => {
          if (response) {
            setVision(response.highContrast);
            setDyslexia(response.dyslexiaFont);
            setReadingLine(response.readingLine || false);
            setColorBlind(response.colorBlind || { enabled: false, deuteranopia: false, protanopia: false, tritanopia: false });
            setTextScaling(response.textScaling || { enabled: false, value: 100 });
            setLineHeight(response.lineHeight || { enabled: false, value: 1.5 });
            setReducedMotion(response.reducedMotion || false);
          }
        });
      } else {
        toast.error('Failed to toggle Dyslexia Font', {
          id: FEATURE_TOAST_ID
        });
        // Revert UI state if operation failed
        setDyslexia(!checked);
      }
    });
  };
  
  const handleReadingLine = (checked: boolean) => {
    setReadingLine(checked);
    
    // Send message to background script
    chrome.runtime.sendMessage({ 
      action: "toggleFeature", 
      feature: "readingLine", 
      enabled: checked 
    }, (response) => {
      if (response && response.status === "success") {
        toast.success(`Reading Guide ${checked ? 'enabled' : 'disabled'}!`, {
          id: FEATURE_TOAST_ID
        });
        
        // Get updated state to ensure UI stays in sync with actual state
        chrome.runtime.sendMessage({ action: "getState" }, (response: AccessibilityState) => {
          if (response) {
            setVision(response.highContrast);
            setDyslexia(response.dyslexiaFont);
            setReadingLine(response.readingLine || false);
            setColorBlind(response.colorBlind || { enabled: false, deuteranopia: false, protanopia: false, tritanopia: false });
            setTextScaling(response.textScaling || { enabled: false, value: 100 });
            setLineHeight(response.lineHeight || { enabled: false, value: 1.5 });
            setReducedMotion(response.reducedMotion || false);
          }
        });
      } else {
        toast.error('Failed to toggle Reading Guide', {
          id: FEATURE_TOAST_ID
        });
        // Revert UI state if operation failed
        setReadingLine(!checked);
      }
    });
  };
  
  const handleTextScaling = (enabled: boolean, value: number) => {
    setTextScaling({ enabled, value });
    
    // Send message to background script
    chrome.runtime.sendMessage({ 
      action: "toggleFeature", 
      feature: "textScaling", 
      enabled, 
      value 
    }, (response) => {
      if (response && response.status === "success") {
        toast.success(`Text Scaling ${enabled ? 'enabled' : 'disabled'}!`, {
          id: FEATURE_TOAST_ID
        });
        
        // Get updated state to ensure UI stays in sync with actual state
        chrome.runtime.sendMessage({ action: "getState" }, (response: AccessibilityState) => {
          if (response) {
            setVision(response.highContrast);
            setDyslexia(response.dyslexiaFont);
            setReadingLine(response.readingLine || false);
            setColorBlind(response.colorBlind || { enabled: false, deuteranopia: false, protanopia: false, tritanopia: false });
            setTextScaling(response.textScaling || { enabled: false, value: 100 });
            setLineHeight(response.lineHeight || { enabled: false, value: 1.5 });
            setReducedMotion(response.reducedMotion || false);
          }
        });
      } else {
        toast.error('Failed to toggle Text Scaling', {
          id: FEATURE_TOAST_ID
        });
        // Revert UI state if operation failed
        setTextScaling({ enabled: !enabled, value });
      }
    });
  };
  
  const handleLineHeight = (enabled: boolean, value: number) => {
    setLineHeight({ enabled, value });
    
    // Send message to background script
    chrome.runtime.sendMessage({ 
      action: "toggleFeature", 
      feature: "lineHeight", 
      enabled, 
      value 
    }, (response) => {
      if (response && response.status === "success") {
        toast.success(`Line Height ${enabled ? 'enabled' : 'disabled'}!`, {
          id: FEATURE_TOAST_ID
        });
        
        // Get updated state to ensure UI stays in sync with actual state
        chrome.runtime.sendMessage({ action: "getState" }, (response: AccessibilityState) => {
          if (response) {
            setVision(response.highContrast);
            setDyslexia(response.dyslexiaFont);
            setReadingLine(response.readingLine || false);
            setColorBlind(response.colorBlind || { enabled: false, deuteranopia: false, protanopia: false, tritanopia: false });
            setTextScaling(response.textScaling || { enabled: false, value: 100 });
            setLineHeight(response.lineHeight || { enabled: false, value: 1.5 });
            setReducedMotion(response.reducedMotion || false);
          }
        });
      } else {
        toast.error('Failed to toggle Line Height', {
          id: FEATURE_TOAST_ID
        });
        // Revert UI state if operation failed
        setLineHeight({ enabled: !enabled, value });
      }
    });
  };
  
  const handleColorBlind = (checked: boolean, type: 'deuteranopia' | 'protanopia' | 'tritanopia') => {
    // Create a new colorBlind state object based on the current toggle
    const newColorBlindState = {
      // Overall enabled state is true if any filter will be enabled after this action
      enabled: checked || 
               (type !== 'deuteranopia' && colorBlind.deuteranopia) || 
               (type !== 'protanopia' && colorBlind.protanopia) || 
               (type !== 'tritanopia' && colorBlind.tritanopia),
      // When enabling a filter, all others should be disabled
      deuteranopia: checked && type === 'deuteranopia' ? true : type === 'deuteranopia' ? false : checked ? false : colorBlind.deuteranopia,
      protanopia: checked && type === 'protanopia' ? true : type === 'protanopia' ? false : checked ? false : colorBlind.protanopia,
      tritanopia: checked && type === 'tritanopia' ? true : type === 'tritanopia' ? false : checked ? false : colorBlind.tritanopia
    };

    // Update the UI state immediately for better responsiveness
    setColorBlind(newColorBlindState);
    
    // Send message to background script - always include the complete state
    chrome.runtime.sendMessage({ 
      action: "toggleFeature", 
      feature: "colorBlind", 
      enabled: checked, 
      type,
      // Send the full state to ensure background is aware of all filter states
      fullState: newColorBlindState
    }, (response) => {
      if (response && response.status === "success") {
        toast.success(`${type.charAt(0).toUpperCase() + type.slice(1)} ${checked ? 'enabled' : 'disabled'}!`, {
          id: FEATURE_TOAST_ID
        });
        
        // Get updated state to ensure UI stays in sync with actual state
        chrome.runtime.sendMessage({ action: "getState" }, (response: AccessibilityState) => {
          if (response) {
            setVision(response.highContrast);
            setDyslexia(response.dyslexiaFont);
            setReadingLine(response.readingLine || false);
            setColorBlind(response.colorBlind || { enabled: false, deuteranopia: false, protanopia: false, tritanopia: false });
            setTextScaling(response.textScaling || { enabled: false, value: 100 });
            setLineHeight(response.lineHeight || { enabled: false, value: 1.5 });
            setReducedMotion(response.reducedMotion || false);
          }
        });
      } else {
        toast.error(`Failed to toggle ${type}`, {
          id: FEATURE_TOAST_ID
        });
        // Revert UI state if operation failed
        setColorBlind(prev => ({ ...prev, [type]: !checked, enabled: prev.deuteranopia || prev.protanopia || prev.tritanopia }));
      }
    });
  };
  
  // Simple handler for non-functional toggles - updated with toast ID
  const handleToggle = (setter: React.Dispatch<React.SetStateAction<boolean>>, name: string) => (checked: boolean) => {
    setter(checked);
    toast.success(`${name} ${checked ? 'enabled' : 'disabled'}!`, {
      id: FEATURE_TOAST_ID
    });
  };
  
  // Handler to turn off all accessibility features at once
  const handleTurnOffAll = () => {
    // Show a loading toast first
    toast.loading('Turning off all features...', {
      id: FEATURE_TOAST_ID
    });
    
    try {
      // Send message to background script to turn everything off
      chrome.runtime.sendMessage({ 
        action: "turnOffAll"
      }, (response) => {
        // Handle potential runtime errors properly
        if (chrome.runtime.lastError) {
          console.error("Error turning off all features:", chrome.runtime.lastError.message || "Unknown error");
          toast.error('Failed to turn off all features', {
            id: FEATURE_TOAST_ID
          });
          return;
        }
        
        if (response && response.status === "success") {
          // Update all local state values
          setVision(false);
          setDyslexia(false);
          setTextScaling({ enabled: false, value: 100 });
          setReadingLine(false);
          setLineHeight({ enabled: false, value: 1.5 });
          setMotor(false);
          setLargeTargets({enabled: false, value: 1.5});
          setCustomCursor(false);
          setAutoScroll(false);          
          setHoverControls(false);
          setSimplifiedView(false);
          setFocusMode(false);
          setHighlightLinks(false);
          setImageDescriptions(false);
          setAiAlt(false);
          setColorBlind({ enabled: false, deuteranopia: false, protanopia: false, tritanopia: false });
          setReducedMotion(false);
          setCustomCursor(false);
          
          // Notify the user
          toast.success('All accessibility features turned off', {
            id: FEATURE_TOAST_ID
          });
          
          // Reset dark mode if it was set by high contrast
          if (localStorage.getItem('darkModeByHighContrast') === 'true') {
            setDarkMode(false);
            setTheme('light');
            localStorage.setItem('theme', 'light');
            localStorage.removeItem('darkModeByHighContrast');
          }
        } else {
          toast.error('Failed to turn off all features', {
            id: FEATURE_TOAST_ID
          });
        }
      });
    } catch (err) {
      // Catch any unexpected errors
      console.error("Unexpected error turning off features:", err);
      toast.error('Failed to turn off all features', {
        id: FEATURE_TOAST_ID
      });
    }
  };
  
  // Handler for reduced motion toggle
  const toggleReducedMotion = (checked: boolean) => {
    // First update UI for responsiveness
    setReducedMotion(checked);
    
    // Then send message to background script
    chrome.runtime.sendMessage({ 
      action: "toggleFeature",
      feature: "reducedMotion",
      enabled: checked
    }, (response) => {
      if (response && response.status === "success") {
        // Show success toast
        toast.success(`Reduced Motion ${checked ? 'enabled' : 'disabled'}!`, {
          id: FEATURE_TOAST_ID
        });
      } else {
        // Show error toast and revert UI state
        toast.error(`Failed to toggle Reduced Motion`, {
          id: FEATURE_TOAST_ID
        });
        setReducedMotion(!checked);
      }
    });
  };

  // Handler for large targets toggle
  const toggleLargeTargets = (checked: boolean) => {
    // First update UI for responsiveness
    setLargeTargets(prev => ({...prev, enabled: checked}));
    
    // Then send message to background script
    try {
      chrome.runtime.sendMessage({ 
        action: "toggleFeature",
        feature: "largeTargets",
        enabled: checked
      }, (response) => {
        // Check for runtime.lastError first
        if (chrome.runtime.lastError) {
          console.error("Error toggling large targets:", chrome.runtime.lastError.message);
          toast.error(`Failed to toggle Larger Click Targets: ${chrome.runtime.lastError.message}`, {
            id: FEATURE_TOAST_ID
          });
          setLargeTargets(prev => ({...prev, enabled: !checked}));
          return;
        }

        if (response && response.status === "success") {
          // Show success toast
          toast.success(`Larger Click Targets ${checked ? 'enabled' : 'disabled'}!`, {
            id: FEATURE_TOAST_ID
          });
        } else {
          // Show error toast and revert UI state
          toast.error(`Failed to toggle Larger Click Targets`, {
            id: FEATURE_TOAST_ID
          });
          setLargeTargets(prev => ({...prev, enabled: !checked}));
        }
      });
    } catch (error) {
      console.error("Exception toggling large targets:", error);
      toast.error(`Failed to toggle Larger Click Targets`, {
        id: FEATURE_TOAST_ID
      });
      setLargeTargets(prev => ({...prev, enabled: !checked}));
    }
  };
  // Handler for custom cursor toggle
  const toggleCustomCursor = (checked: boolean) => {
    // First update UI for responsiveness
    setCustomCursor(checked);
    
    // Then send message to background script
    try {
      chrome.runtime.sendMessage({ 
        action: "toggleFeature",
        feature: "customCursor",
        enabled: checked
      }, (response) => {
        // Check for runtime.lastError first
        if (chrome.runtime.lastError) {
          console.error("Error toggling custom cursor:", chrome.runtime.lastError.message);
          toast.error(`Failed to toggle Custom Cursor: ${chrome.runtime.lastError.message}`, {
            id: FEATURE_TOAST_ID
          });
          setCustomCursor(!checked);
          return;
        }

        if (response && response.status === "success") {
          // Show success toast
          toast.success(`Custom Cursor ${checked ? 'enabled' : 'disabled'}!`, {
            id: FEATURE_TOAST_ID
          });
        } else {
          // Show error toast and revert UI state
          toast.error(`Failed to toggle Custom Cursor`, {
            id: FEATURE_TOAST_ID
          });
          setCustomCursor(!checked);
        }
      });
    } catch (error) {
      console.error("Exception toggling custom cursor:", error);
      toast.error(`Failed to toggle Custom Cursor`, {
        id: FEATURE_TOAST_ID
      });
      setCustomCursor(!checked);
    }
  };
  // Handler for Auto-Scroll toggle
  const handleAutoScroll = (enabled: boolean) => {
    // Update local state
    setAutoScroll(enabled);
    
    // Show toast immediately to improve perceived performance
    toast.success(`Auto-Scroll ${enabled ? 'enabled' : 'disabled'}!`, {
      id: FEATURE_TOAST_ID
    });
    
    // Send message to the background script to update state and apply to all tabs
    chrome.runtime.sendMessage({
      action: "toggleFeature",
      feature: "autoScroll",
      enabled
    }, (response) => {
      // Handle errors if any
      if (chrome.runtime.lastError) {
        console.error("Error toggling auto-scroll via background script:", chrome.runtime.lastError);
        toast.error(`There was an issue with the Auto-Scroll feature`, {
          id: FEATURE_TOAST_ID
        });
        return;
      }
      
      if (response && response.status !== "success") {
        console.error("Error response from background script:", response);
        toast.error(`There was an issue with the Auto-Scroll feature`, {
          id: FEATURE_TOAST_ID
        });
      }    });
  };  // Handle hover controls toggle
  const handleHoverControlsToggle = (checked: boolean) => {
    // Update state immediately for responsive UI
    setHoverControls(checked);
    
    // Show toast immediately for better user experience
    toast.success(`Hover Controls ${checked ? 'enabled' : 'disabled'}!`, {
      id: FEATURE_TOAST_ID
    });
    
    // Send message to background script
    chrome.runtime.sendMessage({ 
      action: "toggleFeature",
      feature: "hoverControls", 
      enabled: checked 
    }, (response) => {
      // Safe check for runtime lastError
      if (chrome.runtime.lastError) {
        console.error("Error toggling hover controls:", chrome.runtime.lastError);
        toast.error('Error toggling Hover Controls', {
          id: FEATURE_TOAST_ID
        });
        // Revert UI state if operation failed
        setHoverControls(!checked);
        return;
      }
      
      // Check response content
      if (!response || response.status !== "success") {
        toast.error('Failed to toggle Hover Controls', {
          id: FEATURE_TOAST_ID
        });        // Revert UI state if operation failed
        setHoverControls(!checked);
      }
    });
  };

  return (
    <main className="w-80 p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-extrabold tracking-tight">Accessibility Booster</h1>
        <button 
          onClick={toggleDarkMode}
          className="p-1 rounded-full hover:bg-muted"
          aria-label="Toggle dark mode"
        >
          {darkMode ? <Sun size={20} /> : <Moon size={20} />}
        </button>
      </div>

      {/* Vision Support Card */}
      <Card>
        <CardContent className="pt-4 pb-3 space-y-3">
          <CardTitle className="flex items-center gap-2 pb-1 text-sm font-medium border-b">
            <Eye size={16} /> Vision Support
          </CardTitle>
          
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Contrast size={16} /> High Contrast
            </span>
            <Switch checked={vision} onCheckedChange={handleVision} />
          </div>

          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Type size={16} /> Dyslexia Font
            </span>
            <Switch checked={dyslexia} onCheckedChange={handleDyslexia} />
          </div>

          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Video size={16} /> Reduced Motion
            </span>
            <Switch checked={reducedMotion} onCheckedChange={toggleReducedMotion} />
          </div>
          
          <div className="flex flex-col">
            <CollapsibleSlider
              icon={<TextSelect size={16} />}
              label="Text Scaling"
              checked={textScaling.enabled}
              sliderValue={textScaling.value}
              min={60}
              max={200}
              step={5}
              formatValue={(val) => `${val}%`}
              onCheckedChange={(enabled) => handleTextScaling(enabled, 100)}
              onSliderChange={(value) => {
                setTextScaling(prev => ({ ...prev, value }));
                
                // Don't send too many requests while slider is moving
                if (isTextScalingUpdating) return;
                
                setIsTextScalingUpdating(true);
                chrome.runtime.sendMessage({
                  action: "updateTextScaling",
                  value
                }, (response) => {
                  setTimeout(() => {
                    setIsTextScalingUpdating(false);
                  }, 150); // Add delay before allowing next update
                  
                  if (!response || response.status !== "success") {
                    toast.error('Failed to update text size', {
                      id: FEATURE_TOAST_ID
                    });
                    // Revert to previous value if failed
                    setTextScaling(prev => ({ ...prev, value: textScaling.value }));
                  }
                });
              }}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <RulerIcon size={16} /> Reading Guide
            </span>
            <Switch checked={readingLine} onCheckedChange={handleReadingLine} />
          </div>
          
          <div className="flex flex-col">
            <CollapsibleSlider
              icon={<AlignJustify size={16} />}
              label="Line Height"
              checked={lineHeight.enabled}
              sliderValue={lineHeight.value}
              min={1.0}
              max={2.5}
              step={0.1}
              formatValue={(val) => `${val.toFixed(1)}x`}
              onCheckedChange={(enabled) => handleLineHeight(enabled, 1.5)}
              onSliderChange={(value) => {
                setLineHeight(prev => ({ ...prev, value }));
                
                // Don't send too many requests while slider is moving
                if (isLineHeightUpdating) return;
                
                setIsLineHeightUpdating(true);
                chrome.runtime.sendMessage({
                  action: "updateLineHeight",
                  value
                }, (response) => {
                  setTimeout(() => {
                    setIsLineHeightUpdating(false);
                  }, 150); // Add delay before allowing next update
                  
                  if (!response || response.status !== "success") {
                    toast.error('Failed to update line height', {
                      id: FEATURE_TOAST_ID
                    });
                    // Revert to previous value if failed
                    setLineHeight(prev => ({ ...prev, value: lineHeight.value }));
                  }
                });
              }}
            />
          </div>

          <CollapsibleToggles
            icon={<EyeOff size={16} />}
            label="Color Blind Mode"
            checked={colorBlind.enabled}
            onCheckedChange={(enabled) => {
              // Create new state with appropriate values
              const newState = { 
                enabled, 
                deuteranopia: enabled ? colorBlind.deuteranopia : false, 
                protanopia: enabled ? colorBlind.protanopia : false, 
                tritanopia: enabled ? colorBlind.tritanopia : false 
              };
              
              // Set local state
              setColorBlind(newState);
              
              // Send the full state to background script to ensure proper synchronization
              chrome.runtime.sendMessage({
                action: "toggleFeature",
                feature: "colorBlind",
                enabled,
                fullState: newState
              }, (response) => {
                if (response && response.status === "success") {
                  toast.success(`Color Blind Mode ${enabled ? 'enabled' : 'disabled'}!`, {
                    id: FEATURE_TOAST_ID
                  });
                  
                  // Get updated state to ensure UI stays in sync with actual state
                  chrome.runtime.sendMessage({ action: "getState" }, (response: AccessibilityState) => {
                    if (response && response.colorBlind) {
                      setColorBlind(response.colorBlind);
                    }
                  });
                } else {
                  toast.error('Failed to toggle Color Blind Mode', {
                    id: FEATURE_TOAST_ID
                  });
                  // Revert UI state if operation failed
                  setColorBlind(prev => ({ ...prev, enabled: !enabled }));
                }
              });
            }}
          >
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <EyeOff size={16} /> Deuteranopia
              </span>
              <Switch checked={colorBlind.deuteranopia} onCheckedChange={(checked) => handleColorBlind(checked, 'deuteranopia')} />
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <EyeOff size={16} /> Protanopia
              </span>
              <Switch checked={colorBlind.protanopia} onCheckedChange={(checked) => handleColorBlind(checked, 'protanopia')} />
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <EyeOff size={16} /> Tritanopia
              </span>
              <Switch checked={colorBlind.tritanopia} onCheckedChange={(checked) => handleColorBlind(checked, 'tritanopia')} />
            </div>
          </CollapsibleToggles>
        </CardContent>
      </Card>

      {/* Motor Support Card */}
      <Card>
        <CardContent className="pt-4 pb-3 space-y-3">
          <CardTitle className="flex items-center gap-2 pb-1 text-sm font-medium border-b">
            <MousePointer size={16} /> Motor Support
          </CardTitle>
          
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Keyboard size={16} /> Keyboard-Only Nav
            </span>            <Switch checked={motor} onCheckedChange={(checked) => {
              // First update UI immediately
              setMotor(checked);
              
              // Send message to content script to toggle keyboard navigation
              chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
                const tabId = tabs[0]?.id;
                if (tabId) {
                  chrome.tabs.sendMessage(tabId, {
                    action: "toggleKeyboardNav",
                    enabled: checked
                  });
                }
              });
              
              // Update background script state directly
              chrome.runtime.sendMessage({
                action: "updateState",
                feature: "keyboardNav",
                enabled: checked
              });
              
              toast.success(`Keyboard-Only Nav ${checked ? 'enabled' : 'disabled'}!`, {
                id: FEATURE_TOAST_ID
              });
            }} />
          </div>
          
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <MousePointerClick size={16} /> Larger Click Targets
            </span>
            <Switch checked={largeTargets.enabled} onCheckedChange={toggleLargeTargets} />
          </div>
          
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <MousePointer2 size={16} /> Custom Cursor
            </span>
            <Switch checked={customCursor} onCheckedChange={toggleCustomCursor} />
          </div>
          
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <ArrowDownUp size={16} /> Auto-Scroll
            </span>
            <Switch checked={autoScroll} onCheckedChange={handleAutoScroll} />
          </div>
          
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <MousePointerSquareDashed size={16} /> Hover Controls
            </span>
            <Switch checked={hoverControls} onCheckedChange={handleHoverControlsToggle} />
          </div>
        </CardContent>
      </Card>

      {/* Cognitive Support Card */}
      <Card>
        <CardContent className="pt-4 pb-3 space-y-3">
          <CardTitle className="flex items-center gap-2 pb-1 text-sm font-medium border-b">
            <Brain size={16} /> Cognitive Support
          </CardTitle>
          
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <LayoutDashboard size={16} /> Simplified View
            </span>
            <Switch checked={simplifiedView} onCheckedChange={handleToggle(setSimplifiedView, 'Simplified View')} />
          </div>
            <div className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Focus size={16} /> Focus Mode
            </span>
            <Switch checked={focusMode} onCheckedChange={handleToggle(setFocusMode, 'Focus Mode')} />
          </div>
          
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Link2 size={16} /> Highlight Links
            </span>
            <Switch checked={highlightLinks} onCheckedChange={handleToggle(setHighlightLinks, 'Highlight Links')} />
          </div>
          
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <ImageIcon size={16} /> Image Descriptions
            </span>
            <Switch checked={imageDescriptions} onCheckedChange={handleToggle(setImageDescriptions, 'Image Descriptions')} />
          </div>
        </CardContent>
      </Card>

      {/* Miscellaneous Card */}
      <Card>
        <CardContent className="pt-4 pb-3 space-y-3">
          <CardTitle className="flex items-center gap-2 pb-1 text-sm font-medium border-b">
            <MoveHorizontal size={16} /> Miscellaneous
          </CardTitle>
          
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <BookA size={16} /> AI Alt-text
            </span>
            <Switch checked={aiAlt} onCheckedChange={handleToggle(setAiAlt, 'AI Alt-text')} />
          </div>
        </CardContent>
      </Card>

      <button 
        onClick={handleTurnOffAll}
        className="w-full py-2 mt-4 text-sm font-medium text-white bg-red-600 rounded hover:bg-red-700"
      >
        Turn All Off
      </button>

      <p className="text-xs text-muted-foreground">
        Yusuf Arpaci (s4012930)
      </p>
      <Toaster />
      <Toaster 
        position="bottom-center" 
        toastOptions={{
          duration: 2000
        }}
      />
    </main>
  );
}
