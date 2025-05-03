import '@testing-library/jest-dom/vitest';
import { vi } from 'vitest';

// Mock browser extension API
(window as any).chrome = {
  storage: {
    sync: {
      get: vi.fn(),
      set: vi.fn()
    }
  },
  runtime: {
    sendMessage: vi.fn()
  }
} as unknown as typeof chrome;