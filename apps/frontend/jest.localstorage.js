// Mock localStorage before test environment loads
global.window = global.window || {};
global.window.localStorage = {
  getItem: () => null,
  setItem: () => {},
  removeItem: () => {},
  clear: () => {},
};
global.localStorage = global.window.localStorage; 