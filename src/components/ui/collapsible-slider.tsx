import React, { useState, useEffect, useCallback } from 'react';
import { Switch } from './switch';
import { Slider } from './slider';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CollapsibleSliderProps {
  icon: React.ReactNode;
  label: string;
  checked: boolean;
  sliderValue: number;
  min: number;
  max: number;
  step: number;
  formatValue?: (value: number) => string;
  onCheckedChange: (checked: boolean) => void;
  onSliderChange: (value: number) => void;
  className?: string;
}

export function CollapsibleSlider({
  icon,
  label,
  checked,
  sliderValue,
  min,
  max,
  step,
  formatValue = (val) => `${val}`,
  onCheckedChange,
  onSliderChange,
  className
}: CollapsibleSliderProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [localValue, setLocalValue] = useState(sliderValue);
  const [debouncedValue, setDebouncedValue] = useState(sliderValue);
  
  // When the switch is turned off, collapse the slider
  useEffect(() => {
    if (!checked) {
      setIsExpanded(false);
    }
  }, [checked]);
  
  // Update local value when sliderValue prop changes
  useEffect(() => {
    setLocalValue(sliderValue);
    setDebouncedValue(sliderValue);
  }, [sliderValue]);
  
  // Debounce slider changes to reduce API calls
  useEffect(() => {
    const timer = setTimeout(() => {
      if (debouncedValue !== sliderValue) {
        onSliderChange(debouncedValue);
      }
    }, 300); // 300ms debounce
    
    return () => clearTimeout(timer);
  }, [debouncedValue, onSliderChange, sliderValue]);

  // When the switch is turned on, expand the slider
  const handleCheckedChange = (newChecked: boolean) => {
    onCheckedChange(newChecked);
    if (newChecked) {
      setIsExpanded(true);
    }
  };
  
  const handleSliderChange = useCallback((vals: number[]) => {
    const newValue = vals[0];
    setLocalValue(newValue);
    setDebouncedValue(newValue);
  }, []);
  
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
              aria-label={isExpanded ? 'Hide slider' : 'Show slider'}
            >
              {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
          )}
          <Switch checked={checked} onCheckedChange={handleCheckedChange} />
        </div>
      </div>
      
      {checked && isExpanded && (
        <div className="mt-2 px-2 flex flex-col">
          {/* Show current value above slider when dragging */}
          {isDragging && (
            <div className="text-center mb-1 text-sm font-medium">
              {formatValue(localValue)}
            </div>
          )}
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground min-w-8 text-right">
              {formatValue(min)}
            </span>
            <Slider
              className="mx-2"
              value={[localValue]}
              min={min}
              max={max}
              step={step}
              onValueChange={handleSliderChange}
              onValueCommit={() => setIsDragging(false)}
              onPointerDown={() => setIsDragging(true)}
            />
            <span className="text-xs text-muted-foreground min-w-8">
              {formatValue(max)}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}