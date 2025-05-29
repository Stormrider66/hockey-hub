import { getDueMessages, markSuccess, markFailure } from '../repositories/outboxRepository';
import { busPublish } from '../lib/eventBus';

export function startOutboxDispatcher(
  pollIntervalMs = 5000,
  maxRetries = 5,
  baseDelayMs = 5000
): NodeJS.Timeout {
  const interval = setInterval(async () => {
    const due = await getDueMessages();
    for (const msg of due) {
      try {
        await busPublish(msg.topic, msg.payload);
        await markSuccess(msg.id as any);
        console.log('[Outbox] message sent', msg.id);
      } catch (err) {
        console.error('[Outbox] publish failed', err);
        await markFailure(msg.id as any, msg.attemptCount || 0, maxRetries, baseDelayMs);
      }
    }
  }, pollIntervalMs);
  return interval;
}
