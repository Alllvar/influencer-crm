import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

// Vitest runs without globals, so Testing Library cannot unmount between tests by itself.
afterEach(() => cleanup());

// In the browser "/api/..." resolves against the page URL; Node's Request has no page URL,
// so relative URLs are resolved against jsdom's location here.
const NativeRequest = globalThis.Request;
globalThis.Request = class extends NativeRequest {
  constructor(input: RequestInfo | URL, init?: RequestInit) {
    super(typeof input === 'string' ? new URL(input, window.location.origin) : input, init);
  }
};
