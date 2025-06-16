import { DataSource } from 'typeorm';
import { Event } from '../../src/entities/Event';
import { EventResource } from '../../src/entities/EventResource';
import { EventAttendee } from '../../src/entities/EventAttendee';
import { Location } from '../../src/entities/Location';
import { Resource } from '../../src/entities/Resource';
import { ResourceType } from '../../src/entities/ResourceType';
import { EventStatus, EventType, EventRepetition } from '@hockey-hub/types';

const genId = () => Math.random().toString(36).substring(2,10)+Date.now().toString(36);

describe.skip('EventRepository with sql.js (skipped pending enum support fix)', () => {
  let ds: DataSource;
  let repo: typeof import('../../src/repositories/eventRepository');

  beforeAll(async () => {
    ds = new DataSource({
      type: 'sqljs',
      synchronize: true,
      entities: [Event, EventResource, EventAttendee, Location, Resource, ResourceType],
      logging: false,
    });
    await ds.initialize();
    jest.doMock('../../src/data-source', () => ({ __esModule: true, default: ds }));
    repo = await import('../../src/repositories/eventRepository');
  });

  afterAll(async () => {
    await ds.destroy();
  });

  it('persists and retrieves', async () => {
    const newEvent = await repo.createEvent({
      organizationId: genId(),
      title: 'SQLjs event',
      eventType: EventType.GAME,
      startTime: new Date().toISOString(),
      endTime: new Date(Date.now()+3600000).toISOString(),
      status: EventStatus.PLANNED,
      repetition: EventRepetition.NONE,
    } as any);

    const fetched = await repo.findById(newEvent.id);
    expect(fetched?.title).toBe('SQLjs event');
  });
}); 