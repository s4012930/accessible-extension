import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock browser extension API
(window as { chrome: typeof chrome }).chrome = {
  storage: {
    sync: {
      get: vi.fn(),
      set: vi.fn()
    }
  },
  runtime: {
    sendMessage: vi.fn(),
    onMessage: {
      addListener: vi.fn(),
      removeListener: vi.fn()
    }
  }
} as unknown as typeof chrome;