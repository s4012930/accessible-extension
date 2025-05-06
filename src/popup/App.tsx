import { useState, useEffect } from 'react';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardTitle } from '@/components/ui/card';
import { CollapsibleSlider } from '@/components/ui/collapsible-slider';
import { Contrast, Type, Keyboard, Video, BookA, Eye, MousePointer, Brain, Sun, Moon, TextSelect, RulerIcon, AlignJustify, MousePointerClick, MousePointer2, StickyNote, MousePointerSquareDashed, LayoutDashboard, Focus, MoveHorizontal } from 'lucide-react';
import { Toaster } from '@/components/ui/sonner';
import { toast } from 'sonner';
import { useTheme } from 'next-themes';

// Define constant toast ID
const FEATURE_TOAST_ID = 'feature-toggle';

interface AccessibilityState {
  highContrast: boolean;
  dyslexiaFont: boolean;
  readingLine: boolean;
  textScaling?: {
    enabled: boolean;
    value: number;
  };
  lineHeight?: {
    enabled: boolean;
    value: number;
  };
}

export default function Popup() {
  const { setTheme } = useTheme();
  const [darkMode, setDarkMode] = useState(false);
  
  // Vision features
  const [vision, setVision] = useState(false);
  const [dyslexia, setDyslexia] = useState(false);
  const [motion, setMotion] = useState(false);
  const [textScaling, setTextScaling] = useState({ enabled: false, value: 100 });
  const [readingLine, setReadingLine] = useState(false);
  const [lineHeight, setLineHeight] = useState({ enabled: false, value: 1.5 });
  
  // Separate throttling flags for each slider to prevent race conditions
  const [isTextScalingUpdating, setIsTextScalingUpdating] = useState(false);
  const [isLineHeightUpdating, setIsLineHeightUpdating] = useState(false);
  
  // Motor features
  const [motor, setMotor] = useState(false);
  const [largeTargets, setLargeTargets] = useState(false);
  const [customCursor, setCustomCursor] = useState(false);
  const [stickyKeys, setStickyKeys] = useState(false);
  const [hoverControls, setHoverControls] = useState(false);
  
  // Cognitive features
  const [simplifiedView, setSimplifiedView] = useState(false);
  const [focusMode, setFocusMode] = useState(false);
  
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
        setTextScaling(updatedState.textScaling || { enabled: false, value: 100 });
        setLineHeight(updatedState.lineHeight || { enabled: false, value: 1.5 });
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
        setTextScaling(response.textScaling || { enabled: false, value: 100 });
        setLineHeight(response.lineHeight || { enabled: false, value: 1.5 });
      }
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
            setTextScaling(response.textScaling || { enabled: false, value: 100 });
            setLineHeight(response.lineHeight || { enabled: false, value: 1.5 });
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
            setTextScaling(response.textScaling || { enabled: false, value: 100 });
            setLineHeight(response.lineHeight || { enabled: false, value: 1.5 });
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
            setTextScaling(response.textScaling || { enabled: false, value: 100 });
            setLineHeight(response.lineHeight || { enabled: false, value: 1.5 });
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
            setTextScaling(response.textScaling || { enabled: false, value: 100 });
            setLineHeight(response.lineHeight || { enabled: false, value: 1.5 });
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
            setTextScaling(response.textScaling || { enabled: false, value: 100 });
            setLineHeight(response.lineHeight || { enabled: false, value: 1.5 });
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
          setMotion(false);
          setTextScaling({ enabled: false, value: 100 });
          setReadingLine(false);
          setLineHeight({ enabled: false, value: 1.5 });
          setMotor(false);
          setLargeTargets(false);
          setCustomCursor(false);
          setStickyKeys(false);
          setHoverControls(false);
          setSimplifiedView(false);
          setFocusMode(false);
          setAiAlt(false);
          
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
            <Switch checked={motion} onCheckedChange={handleToggle(setMotion, 'Reduced Motion')} />
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
            </span>
            <Switch checked={motor} onCheckedChange={handleToggle(setMotor, 'Keyboard-Only Nav')} />
          </div>
          
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <MousePointerClick size={16} /> Larger Click Targets
            </span>
            <Switch checked={largeTargets} onCheckedChange={handleToggle(setLargeTargets, 'Larger Click Targets')} />
          </div>
          
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <MousePointer2 size={16} /> Custom Cursor
            </span>
            <Switch checked={customCursor} onCheckedChange={handleToggle(setCustomCursor, 'Custom Cursor')} />
          </div>
          
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <StickyNote size={16} /> Sticky Keys
            </span>
            <Switch checked={stickyKeys} onCheckedChange={handleToggle(setStickyKeys, 'Sticky Keys')} />
          </div>
          
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <MousePointerSquareDashed size={16} /> Hover Controls
            </span>
            <Switch checked={hoverControls} onCheckedChange={handleToggle(setHoverControls, 'Hover Controls')} />
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
