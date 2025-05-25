import { startOutboxDispatcher } from './outboxDispatcher';

jest.useFakeTimers();

const mockMessages = [
  { id: 'm1', topic: 'test.t', payload: { a: 1 }, attemptCount: 0 } as any,
];

const repoMock = {
  getDueMessages: jest.fn(),
  markSuccess: jest.fn(),
  markFailure: jest.fn(),
};

jest.mock('../repositories/outboxRepository', () => ({
  getDueMessages: (...args: any[]) => repoMock.getDueMessages(...args),
  markSuccess: (...args: any[]) => repoMock.markSuccess(...args),
  markFailure: (...args: any[]) => repoMock.markFailure(...args),
}));

const busPublish = jest.fn();
jest.mock('../lib/eventBus', () => ({
  busPublish: (...args: any[]) => busPublish(...args),
}));

// Import after mocks
import { getDueMessages, markSuccess, markFailure } from '../repositories/outboxRepository';


describe('Outbox Dispatcher', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('marks success when publish succeeds', async () => {
    repoMock.getDueMessages.mockResolvedValue(mockMessages);
    busPublish.mockResolvedValue(undefined);

    startOutboxDispatcher(10); // poll every 10ms

    await jest.runOnlyPendingTimers();

    expect(busPublish).toHaveBeenCalledWith('test.t', { a: 1 });
    expect(repoMock.markSuccess).toHaveBeenCalledWith('m1');
  });

  it('retries and marks failure after max retries', async () => {
    const failingMsg = { id: 'm2', topic: 'fail.t', payload: {}, attemptCount: 4 } as any;
    repoMock.getDueMessages.mockResolvedValue([failingMsg]);
    busPublish.mockRejectedValue(new Error('nats down'));

    startOutboxDispatcher(10, 5, 1);

    await jest.runOnlyPendingTimers();

    expect(repoMock.markFailure).toHaveBeenCalledWith('m2', 4, 5, 1);
  });
}); 