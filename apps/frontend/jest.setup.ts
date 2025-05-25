import '@testing-library/jest-dom';
import 'jest-axe/extend-expect';

// Ensure global.window exists
if (typeof window === 'undefined') {
  (global as any).window = global;
}
// Mock localStorage for test environment
declare global {
  interface Window { localStorage: Storage; }
}
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
Object.defineProperty(window, 'localStorage', { value: localStorageMock }); 