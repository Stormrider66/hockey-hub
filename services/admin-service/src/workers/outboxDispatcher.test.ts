// @ts-nocheck
// Use CommonJS require to ensure mocks are applied before module load

jest.useFakeTimers('legacy');

const repoMock = {
  getDueMessages: jest.fn(),
  markSuccess: jest.fn(),
  markFailure: jest.fn(),
};

jest.mock('../repositories/outboxRepository', () => ({
  getDueMessages: (...args) => repoMock.getDueMessages(...args),
  markSuccess: (...args) => repoMock.markSuccess(...args),
  markFailure: (...args) => repoMock.markFailure(...args),
}));

jest.mock('../lib/eventBus', () => ({
  busPublish: jest.fn(),
}));

// Import the mocked busPublish so we can make assertions on it
const { busPublish } = require('../lib/eventBus');

// Now import the module under test AFTER mocks
const { startOutboxDispatcher } = require('./outboxDispatcher');

// Helper to flush promises
const flushPromises = () => new Promise(setImmediate);

describe('Outbox Dispatcher', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.clearAllTimers();
  });

  it('marks success when publish succeeds', async () => {
    const mockMessages = [{ id: 'm1', topic: 'test.t', payload: { a: 1 }, attemptCount: 0 }];
    repoMock.getDueMessages.mockResolvedValue(mockMessages);
    busPublish.mockResolvedValue(undefined);

    const interval = startOutboxDispatcher(10);
    
    // Advance timers to trigger one interval execution
    jest.advanceTimersByTime(10);    
    // Wait for all async operations to complete
    await flushPromises();
    
    // Clean up
    clearInterval(interval);
    
    // Make assertions
    expect(busPublish).toHaveBeenCalledWith('test.t', { a: 1 });
    expect(busPublish).toHaveBeenCalledTimes(1);
    expect(repoMock.markSuccess).toHaveBeenCalledWith('m1');
    expect(repoMock.markSuccess).toHaveBeenCalledTimes(1);
  });

  it('retries and marks failure after max retries', async () => {
    const failingMsg = { id: 'm2', topic: 'fail.t', payload: {}, attemptCount: 4 };
    repoMock.getDueMessages.mockResolvedValue([failingMsg]);
    busPublish.mockRejectedValue(new Error('nats down'));

    const interval = startOutboxDispatcher(10, 5, 1);
    
    // Advance timers to trigger one interval execution
    jest.advanceTimersByTime(10);
    
    // Wait for all async operations to complete
    await flushPromises();
    
    // Clean up
    clearInterval(interval);
    
    // Make assertions
    expect(repoMock.markFailure).toHaveBeenCalledWith('m2', 4, 5, 1);
    expect(repoMock.markFailure).toHaveBeenCalledTimes(1);
  });
});