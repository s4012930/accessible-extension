import { useState } from 'react';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent } from '@/components/ui/card';
import { Contrast, Type, Keyboard, Video, BookA, } from 'lucide-react';
import { Toaster } from '@/components/ui/sonner';
import { toast } from 'sonner';

export default function Popup() {
    
  const [vision, setVision] = useState(false);
  const [dyslexia, setDyslexia] = useState(false);
  const [motor, setMotor] = useState(false);
  const [motion, setMotion] = useState(false);
  const [aiAlt, setAiAlt] = useState(false);

  const handleVision = () => {
    setVision(!vision);
    toast.success('High Contrast mode toggled!');
  };
  const handleDyslexia  = () => { 
    setDyslexia(!dyslexia);
    toast.success('Dyslexia Font toggled!'); 
  };
  const handleMotor   = () => { 
    setMotor(!motor); 
    toast.success('Keyboard-Only Nav toggled!'); 
  };
  const handleMotion  = () => { 
    setMotion(!motion); 
    toast.success('Reduced Motion toggled!'); 
  };
  const handleAiAlt   = () => { 
    setAiAlt(!aiAlt);   
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
        Toggles do nothing at the moment.
      </p>
      <Toaster />
    </main>
  );
}
