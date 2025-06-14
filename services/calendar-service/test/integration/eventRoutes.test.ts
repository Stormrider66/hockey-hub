import request from 'supertest';
import express from 'express';

import eventRoutes from '../../src/routes/eventRoutes';
import AppDataSource from '../../src/data-source';

// Stub the conflict detection util so we can control its behaviour in each test.
jest.mock('../../src/utils/conflictDetection', () => {
  return {
    __esModule: true,
    findConflictingEvents: jest.fn(),
  };
});

import { findConflictingEvents } from '../../src/utils/conflictDetection';

const testApp = express();

testApp.use(express.json());

testApp.use((req, _res, next) => {
  req.user = { id: 'user-test', organizationId: 'org-test' } as any;
  next();
});

testApp.use('/events', eventRoutes);

const baseEvent = () => {
  const start = new Date('2025-02-01T10:00:00Z');
  const end = new Date('2025-02-01T11:00:00Z');
  return {
    title: 'Integration Event',
    description: 'test',
    startTime: start.toISOString(),
    endTime: end.toISOString(),
    eventType: 'game',
  };
};

describe('Event routes integration', () => {
  beforeAll(async () => {
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
    }
  });

  afterAll(async () => {
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
    }
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('creates an event when no conflicts', async () => {
    (findConflictingEvents as jest.Mock).mockResolvedValueOnce([]);

    await request(testApp)
      .post('/events')
      .send(baseEvent())
      .expect(201)
      .expect(res => {
        expect(res.body.success).toBe(true);
      });
  });

  it('rejects create when conflicts exist', async () => {
    (findConflictingEvents as jest.Mock).mockResolvedValueOnce([
      {
        id: 'conflict-1',
        title: 'Existing',
        start_time: '2025-02-01T09:00:00Z',
        end_time: '2025-02-01T12:00:00Z',
        event_type: 'game',
        conflict_reason: 'resource',
        conflict_identifier: 'res-1',
      },
    ]);

    await request(testApp)
      .post('/events')
      .send(baseEvent())
      .expect(409)
      .expect(res => {
        expect(res.body.code).toBe('EVENT_CONFLICT');
      });
  });
});
