import React from 'react';
import ReactDOM from 'react-dom/client';
import Popup from './App';
import { Toaster } from '@/components/ui/sonner';
import '../index.css';   // tailwind styles

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Popup />
    <Toaster />
  </React.StrictMode>
);
