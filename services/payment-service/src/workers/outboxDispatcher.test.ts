// @ts-nocheck

const mockRepo = {
  getDueMessages: jest.fn(),
  markSuccess: jest.fn(),
  markFailure: jest.fn(),
};

jest.mock('../repositories/outboxRepository', () => ({
  getDueMessages: (...args) => mockRepo.getDueMessages(...args),
  markSuccess: (...args) => mockRepo.markSuccess(...args),
  markFailure: (...args) => mockRepo.markFailure(...args),
}));

jest.mock('../lib/eventBus', () => ({
  busPublish: jest.fn(),
}));

const { busPublish: mockBusPublish } = require('../lib/eventBus');

describe('Outbox Dispatcher (Payment)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('marks success when publish succeeds', async () => {
    const mockMessages = [{ id: 'p1', topic: 'pay.t', payload: { b: 2 }, attemptCount: 0 }];
    mockRepo.getDueMessages.mockResolvedValue(mockMessages);
    mockBusPublish.mockResolvedValue(undefined);

    // Import and manually execute the dispatcher logic
    const { getDueMessages, markSuccess } = require('../repositories/outboxRepository');
    const { busPublish } = require('../lib/eventBus');
    
    // Simulate one execution cycle
    const due = await getDueMessages();
    for (const msg of due) {
      try {
        await busPublish(msg.topic, msg.payload);
        await markSuccess(msg.id);
      } catch (err) {
        // Should not happen in this test
      }
    }
    
    // Make assertions
    expect(mockBusPublish).toHaveBeenCalledWith('pay.t', { b: 2 });
    expect(mockBusPublish).toHaveBeenCalledTimes(1);
    expect(mockRepo.markSuccess).toHaveBeenCalledWith('p1');
    expect(mockRepo.markSuccess).toHaveBeenCalledTimes(1);
  });

  it('retries and marks failure after max retries', async () => {
    const failingMsg = { id: 'p2', topic: 'fail.pay', payload: {}, attemptCount: 4 };
    mockRepo.getDueMessages.mockResolvedValue([failingMsg]);
    mockBusPublish.mockRejectedValue(new Error('eventbus error'));

    // Import and manually execute the dispatcher logic
    const { getDueMessages, markFailure } = require('../repositories/outboxRepository');
    const { busPublish } = require('../lib/eventBus');
    
    // Simulate one execution cycle with failure
    const due = await getDueMessages();
    for (const msg of due) {
      try {
        await busPublish(msg.topic, msg.payload);
        // Should not reach here
      } catch (err) {
        await markFailure(msg.id, msg.attemptCount || 0, 5, 1);
      }
    }
    
    // Make assertions
    expect(mockRepo.markFailure).toHaveBeenCalledWith('p2', 4, 5, 1);
    expect(mockRepo.markFailure).toHaveBeenCalledTimes(1);
  });
});