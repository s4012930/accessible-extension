import { useState, useEffect } from 'react';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent } from '@/components/ui/card';
import { Contrast, Type, Keyboard, Video, BookA } from 'lucide-react';
import { Toaster } from '@/components/ui/sonner';
import { toast } from 'sonner';
import { useTheme } from 'next-themes';

interface AccessibilityState {
  highContrast: boolean;
  // Add other features as needed
}

export default function Popup() {
  const { setTheme } = useTheme();
  const [vision, setVision] = useState(false);
  const [dyslexia, setDyslexia] = useState(false);
  const [motor, setMotor] = useState(false);
  const [motion, setMotion] = useState(false);
  const [aiAlt, setAiAlt] = useState(false);
  
  // Load saved state when popup opens
  useEffect(() => {
    chrome.runtime.sendMessage({ action: "getState" }, (response: AccessibilityState) => {
      if (response) {
        setVision(response.highContrast);
        // Also set theme based on high contrast setting
        setTheme(response.highContrast ? 'dark' : 'light');
      }
    });
  }, [setTheme]);

  const handleVision = (checked: boolean) => {
    setVision(checked);
    
    // Also set the popup theme to match high contrast setting
    setTheme(checked ? 'dark' : 'light');
    
    // Send message to background script
    chrome.runtime.sendMessage({ 
      action: "toggleFeature", 
      feature: "highContrast", 
      enabled: checked 
    }, (response) => {
      if (response && response.status === "success") {
        toast.success(`High Contrast mode ${checked ? 'enabled' : 'disabled'}!`);
      } else {
        toast.error('Failed to toggle High Contrast mode');
        // Revert UI state if operation failed
        setVision(!checked);
        setTheme(!checked ? 'dark' : 'light');
      }
    });
  };
  
  const handleDyslexia = (checked: boolean) => { 
    setDyslexia(checked);
    toast.success('Dyslexia Font toggled!'); 
  };
  
  const handleMotor = (checked: boolean) => { 
    setMotor(checked); 
    toast.success('Keyboard-Only Nav toggled!'); 
  };
  
  const handleMotion = (checked: boolean) => { 
    setMotion(checked); 
    toast.success('Reduced Motion toggled!'); 
  };
  
  const handleAiAlt = (checked: boolean) => { 
    setAiAlt(checked);   
    toast.success('Ai Alt-text toggled!'); 
  };
  
  return (
    <main className="w-80 p-4 space-y-4">
      <h1 className="text-2xl font-extrabold tracking-tight">Accessibility Booster</h1>

      <Card>
        <CardContent className="py-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Contrast size={18} /> High Contrast
            </span>
            <Switch checked={vision} onCheckedChange={handleVision} />
          </div>

          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Type size={18} /> Dyslexia Font
            </span>
            <Switch checked={dyslexia} onCheckedChange={handleDyslexia} />
          </div>

          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Keyboard size={18} /> Keyboard-Only Nav
            </span>
            <Switch checked={motor} onCheckedChange={handleMotor} />
          </div>

          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Video size={18} /> Reduced Motion
            </span>
            <Switch checked={motion} onCheckedChange={handleMotion} />
          </div>

          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <BookA size={18} /> Ai Alt-text
            </span>
            <Switch checked={aiAlt} onCheckedChange={handleAiAlt} />
          </div>
        </CardContent>
      </Card>

      <p className="text-xs text-muted-foreground">
        High Contrast is now functional. Other toggles coming soon.
      </p>
      <Toaster />
    </main>
  );
}
