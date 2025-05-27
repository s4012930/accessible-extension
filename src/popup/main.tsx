import React from 'react';
import ReactDOM from 'react-dom/client';
import Popup from './App';
import { Toaster } from '@/components/ui/sonner';
import { ThemeProvider } from 'next-themes';
import '../index.css';   // tailwind styles

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ThemeProvider attribute="class">
      <Popup />
      <Toaster />
    </ThemeProvider>
  </React.StrictMode>
);
