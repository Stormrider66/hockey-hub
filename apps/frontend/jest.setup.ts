// Learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';
import 'reflect-metadata';
// Use runtime fetch (Node 18+) for MSW interception; avoid overriding with jest.fn
if (!(global as any).Headers) {
  (global as any).Headers = class {
    private map = new Map<string, string>();
    constructor(init?: Record<string, string>) {
      if (init) {
        for (const [k, v] of Object.entries(init)) this.set(k, v as any);
      }
    }
    set(k: string, v: string) { this.map.set(String(k).toLowerCase(), String(v)); }
    get(k: string) { return this.map.get(String(k).toLowerCase()) ?? null; }
    append(k: string, v: string) { this.set(k, v); }
    has(k: string) { return this.map.has(String(k).toLowerCase()); }
    entries() { return this.map.entries(); }
    forEach(cb: (value: string, key: string) => void) { this.map.forEach((v, k) => cb(v, k)); }
  } as any;
}
if (!(global as any).Response) {
  (global as any).Response = class {
    private _body: any; status: number; headers: any; ok: boolean;
    constructor(body?: any, init?: any) {
      this._body = body;
      this.status = init?.status ?? 200;
      this.headers = new (global as any).Headers(init?.headers);
      this.ok = this.status >= 200 && this.status < 300;
    }
    json = async () => (typeof this._body === 'string' ? JSON.parse(this._body) : this._body);
    text = async () => (typeof this._body === 'string' ? this._body : JSON.stringify(this._body ?? ''));
    clone = () => new (global as any).Response(this._body, { status: this.status, headers: this.headers });
  } as any;
}

// Minimal Request polyfill for fetchBaseQuery
if (!(global as any).Request) {
  (global as any).Request = class {
    url: string;
    method: string;
    headers: any;
    body: any;
    signal?: AbortSignal;
    credentials?: RequestCredentials;
    mode?: RequestMode;
    constructor(input: any, init?: any) {
      this.url = typeof input === 'string' ? input : input?.url || '';
      this.method = (init?.method || 'GET').toUpperCase();
      this.headers = new (global as any).Headers(init?.headers);
      this.body = init?.body;
      this.signal = init?.signal;
      this.credentials = init?.credentials;
      this.mode = init?.mode;
    }
    clone() {
      return new (global as any).Request(this.url, {
        method: this.method,
        headers: this.headers,
        body: this.body,
        signal: this.signal,
        credentials: this.credentials,
        mode: this.mode,
      });
    }
  } as any;
}
import { TextEncoder, TextDecoder } from 'util';

// Polyfills for Jest/node environment
if (!(global as any).TextEncoder) {
  (global as any).TextEncoder = TextEncoder as any;
}
if (!(global as any).TextDecoder) {
  (global as any).TextDecoder = TextDecoder as any;
}

// Mock next/router
jest.mock('next/router', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    pathname: '/',
    query: {},
    asPath: '/',
    route: '/',
    events: {
      on: jest.fn(),
      off: jest.fn(),
      emit: jest.fn(),
    },
  }),
}));

// Mock @hockey-hub/shared-lib enums used in frontend tests
// @hockey-hub/shared-lib is mapped via moduleNameMapper to a local mock

// Provide a minimal i18n mock globally
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: 'en', changeLanguage: jest.fn() },
  }),
  Trans: ({ children }: any) => children,
  // i18next expects a "3rdParty" plugin shape for `.use(initReactI18next)`
  initReactI18next: { type: '3rdParty', init: jest.fn() },
}));

jest.mock('@hockey-hub/translations', () => ({
  useTranslation: () => ({
    t: (key: string, opts?: any) => (opts?.defaultValue ?? key),
    i18n: { language: 'en', changeLanguage: jest.fn() },
  }),
  initReactI18next: { type: '3rdParty', init: jest.fn() },
}));

// Rely on moduleNameMapper for ChatSocketContext and translations package mapping

// Ensure shared-lib enums exist for chat tests (both named and default)
jest.mock('@hockey-hub/shared-lib', () => {
  const lib = {
    ConversationType: { DIRECT: 'direct', GROUP: 'group', CHANNEL: 'channel' },
    MessageType: { TEXT: 'text', IMAGE: 'image', FILE: 'file', SYSTEM: 'system' },
    MessageStatus: { SENT: 'sent', DELIVERED: 'delivered', READ: 'read' },
    PresenceStatus: { ONLINE: 'online', OFFLINE: 'offline', AWAY: 'away' },
  };
  return { __esModule: true, default: lib, ...lib } as any;
});

// Polyfill pointer capture for Radix UI in JSDOM
// @ts-ignore
if (!(Element as any).prototype.hasPointerCapture) {
  // @ts-ignore
  (Element as any).prototype.hasPointerCapture = () => false;
}
// @ts-ignore
if (!(Element as any).prototype.setPointerCapture) {
  // @ts-ignore
  (Element as any).prototype.setPointerCapture = () => {};
}
// @ts-ignore
if (!(Element as any).prototype.releasePointerCapture) {
  // @ts-ignore
  (Element as any).prototype.releasePointerCapture = () => {};
}

// JSDOM doesn't implement scrollIntoView; some Radix/Floating-UI components call it.
if (!(Element as any).prototype.scrollIntoView) {
  // @ts-ignore
  (Element as any).prototype.scrollIntoView = () => {};
}

// JSDOM doesn't implement URL.createObjectURL; file upload flows commonly rely on it.
if (!(URL as any).createObjectURL) {
  (URL as any).createObjectURL = jest.fn(() => 'blob:mock');
}
if (!(URL as any).revokeObjectURL) {
  (URL as any).revokeObjectURL = jest.fn(() => {});
}

// next/navigation is mocked via moduleNameMapper to a shared spyable mock

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
} as any;

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  constructor(callback: any) {}
  disconnect() {}
  observe() {}
  unobserve() {}
} as any;

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // deprecated
    removeListener: jest.fn(), // deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock console methods to reduce noise
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

// Set test environment variables
process.env.NEXT_PUBLIC_API_URL = 'http://localhost:3000';
process.env.NEXT_PUBLIC_ENABLE_MOCK_AUTH = 'false';
// Avoid mutating NODE_ENV in setup to prevent readonly assignment errors
process.env.JEST_TEST_ENV = 'true';

// Ensure fetch exists on window for modules that reference window.fetch
if (typeof (globalThis as any).fetch === 'function' && typeof (window as any).fetch !== 'function') {
  (window as any).fetch = (globalThis as any).fetch.bind(globalThis);
}

// Radix (Dialog/Select/Popover) can leave `pointer-events: none` on <body> in JSDOM when unmounted mid-interaction.
// That breaks @testing-library/user-event's pointer event checks across subsequent tests.
afterEach(() => {
  try {
    document.body.style.pointerEvents = '';
    document.body.removeAttribute('data-scroll-locked');
    document.documentElement.style.pointerEvents = '';
  } catch {}
});

// Keep default act behavior; tests that need return value should capture inside act callback