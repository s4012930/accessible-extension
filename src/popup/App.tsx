import { useState, useEffect } from 'react';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardTitle } from '@/components/ui/card';
import { Contrast, Type, Keyboard, Video, BookA, Eye, MousePointer, Brain, Sun, Moon, TextSelect, RulerIcon, AlignJustify, MousePointerClick, MousePointer2, StickyNote, MousePointerSquareDashed, LayoutDashboard, Focus, MoveHorizontal } from 'lucide-react';
import { Toaster } from '@/components/ui/sonner';
import { toast } from 'sonner';
import { useTheme } from 'next-themes';

// Define constant toast ID
const FEATURE_TOAST_ID = 'feature-toggle';

interface AccessibilityState {
  highContrast: boolean;
  // Add other features as needed
}

export default function Popup() {
  const { setTheme } = useTheme();
  const [darkMode, setDarkMode] = useState(false);
  
  // Vision features
  const [vision, setVision] = useState(false);
  const [dyslexia, setDyslexia] = useState(false);
  const [motion, setMotion] = useState(false);
  const [textScaling, setTextScaling] = useState(false);
  const [readingGuide, setReadingGuide] = useState(false);
  const [lineHeight, setLineHeight] = useState(false);
  
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
    chrome.runtime.sendMessage({ action: "getState" }, (response: AccessibilityState) => {
      if (response) {
        setVision(response.highContrast);
        // Don't set theme based on high contrast here
      }
    });
    
    // Check localStorage for theme preference first
    const savedTheme = localStorage.getItem('theme') || 'light';
    setTheme(savedTheme);
    setDarkMode(savedTheme === 'dark');
    
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
  
  // Simple handler for non-functional toggles - updated with toast ID
  const handleToggle = (setter: React.Dispatch<React.SetStateAction<boolean>>, name: string) => (checked: boolean) => {
    setter(checked);
    toast.success(`${name} ${checked ? 'enabled' : 'disabled'}!`, {
      id: FEATURE_TOAST_ID
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
            <Switch checked={dyslexia} onCheckedChange={handleToggle(setDyslexia, 'Dyslexia Font')} />
          </div>

          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Video size={16} /> Reduced Motion
            </span>
            <Switch checked={motion} onCheckedChange={handleToggle(setMotion, 'Reduced Motion')} />
          </div>
          
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <TextSelect size={16} /> Text Scaling
            </span>
            <Switch checked={textScaling} onCheckedChange={handleToggle(setTextScaling, 'Text Scaling')} />
          </div>
          
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <RulerIcon size={16} /> Reading Guide
            </span>
            <Switch checked={readingGuide} onCheckedChange={handleToggle(setReadingGuide, 'Reading Guide')} />
          </div>
          
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <AlignJustify size={16} /> Line Height
            </span>
            <Switch checked={lineHeight} onCheckedChange={handleToggle(setLineHeight, 'Line Height')} />
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
