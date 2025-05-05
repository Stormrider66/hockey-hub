const JsdomEnvironment = require('jest-environment-jsdom');

class CustomEnvironment extends JsdomEnvironment {
  constructor(config, context) {
    const updated = {
      ...config,
      testEnvironmentOptions: {
        html: '<!doctype html><html><head></head><body></body></html>',
        ...(config.testEnvironmentOptions || {}),
      },
    };
    super(updated, context);
  }
}

module.exports = CustomEnvironment; 