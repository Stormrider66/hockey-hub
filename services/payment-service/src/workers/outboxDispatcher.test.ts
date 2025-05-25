// @ts-nocheck
const { startOutboxDispatcher } = require('./outboxDispatcher');

jest.useFakeTimers();

const mockMessages = [
  { id: 'p1', topic: 'pay.t', payload: { b: 2 }, attemptCount: 0 },
];

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

const mockBusPublish = jest.fn();
jest.mock('../lib/eventBus', () => ({
  busPublish: (...args) => mockBusPublish(...args),
}));

describe('Outbox Dispatcher (Payment)', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('marks success when publish succeeds', async () => {
    mockRepo.getDueMessages.mockResolvedValue(mockMessages);
    mockBusPublish.mockResolvedValue(undefined);

    const interval = startOutboxDispatcher(10);
    jest.advanceTimersByTime(10);
    clearInterval(interval);
    // flush pending microtasks (async callbacks)
    await Promise.resolve();
    await Promise.resolve();

    expect(mockBusPublish).toHaveBeenCalledWith('pay.t', { b: 2 });
    expect(mockRepo.markSuccess).toHaveBeenCalledWith('p1');
  });

  it('retries and marks failure after max retries', async () => {
    const failingMsg = { id: 'p2', topic: 'fail.pay', payload: {}, attemptCount: 4 };
    mockRepo.getDueMessages.mockResolvedValue([failingMsg]);
    mockBusPublish.mockRejectedValue(new Error('publish fail'));

    const intervalFail = startOutboxDispatcher(10, 5, 1);
    jest.advanceTimersByTime(10);
    clearInterval(intervalFail);
    // flush pending microtasks (async callbacks)
    await Promise.resolve();
    await Promise.resolve();

    expect(mockRepo.markFailure).toHaveBeenCalledWith('p2', 4, 5, 1);
  });
}); 