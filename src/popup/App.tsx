import { useState } from 'react';
import { Switch } from '@/components/ui/switch';      // shadcn toggle
import { Card, CardContent } from '@/components/ui/card';
import { Sun, Contrast, Type } from 'lucide-react';   // icons

export default function Popup() {
    
  const [vision, setVision] = useState(false);
  const [dyslexia, setDyslexia] = useState(false);
  const [motor, setMotor] = useState(false);

  return (
    <main className="w-80 p-4 space-y-4">
      <h1 className="text-2xl font-extrabold tracking-tight">Accessibility Booster</h1>

      <Card>
        <CardContent className="py-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Contrast size={18} /> High Contrast
            </span>
            <Switch checked={vision} onCheckedChange={setVision} />
          </div>

          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Type size={18} /> Dyslexia Font
            </span>
            <Switch checked={dyslexia} onCheckedChange={setDyslexia} />
          </div>

          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Sun size={18} /> Keyboard-Only Nav
            </span>
            <Switch checked={motor} onCheckedChange={setMotor} />
          </div>
        </CardContent>
      </Card>

      <p className="text-xs text-muted-foreground">
        Toggles are visual only right now; functionality comes next sprint.
      </p>
    </main>
  );
}
