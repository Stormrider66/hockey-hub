import { AppDataSource } from '../data-source';
import { OutboxMessage } from '../entities/OutboxMessage';

const repo = () => AppDataSource.getRepository(OutboxMessage);

export const enqueueMessage = async (topic: string, payload: Record<string, any>) => {
  const msg = repo().create({ topic, payload });
  await repo().save(msg);
  return msg;
};

export const getDueMessages = async () => {
  return repo().createQueryBuilder('m')
    .where('m.status = :status', { status: 'pending' })
    .andWhere('(m.nextAttemptAt IS NULL OR m.nextAttemptAt <= NOW())')
    .orderBy('m.createdAt', 'ASC')
    .getMany();
};

export const markSuccess = async (id: string) => {
  await repo().update(id, { status: 'sent', processedAt: new Date().toISOString() } as any);
};

export const markFailure = async (
  id: string,
  currentAttempts: number,
  maxRetries = 5,
  baseDelayMs = 5000
) => {
  const nextAttempts = currentAttempts + 1;
  const updates: any = { attemptCount: nextAttempts };
  if (nextAttempts >= maxRetries) {
    updates.status = 'failed';
    updates.processedAt = new Date().toISOString();
  } else {
    const delay = Math.pow(2, nextAttempts) * baseDelayMs;
    updates.nextAttemptAt = new Date(Date.now() + delay).toISOString();
  }
  await repo().update(id, updates);
}; 