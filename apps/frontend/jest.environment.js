const JsdomEnvironment = require('jest-environment-jsdom');

class CustomEnvironment extends JsdomEnvironment {
  constructor(config, context) {
    const updated = {
      ...config,
      testEnvironmentOptions: {
        html: '<!doctype html><html><head></head><body></body></html>',
        url: 'http://localhost',
        ...(config.testEnvironmentOptions || {}),
      },
    };
    super(updated, context);
  }

  async setup() {
    await super.setup();
    // Provide a localStorage stub for tests
    this.global.localStorage = {
      getItem: () => null,
      setItem: () => {},
      removeItem: () => {},
      clear: () => {},
    };
  }
}

module.exports = CustomEnvironment; 