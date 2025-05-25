import request from 'supertest';
import express from 'express';

import locationRoutes from '../../src/routes/locationRoutes';
import resourceTypeRoutes from '../../src/routes/resourceTypeRoutes';
import resourceRoutes from '../../src/routes/resourceRoutes';

// --- In-memory stores & helper ---
const genId = () => 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
  const r = Math.random() * 16 | 0;
  const v = c === 'x' ? r : (r & 0x3 | 0x8);
  return v.toString(16);
});

// Mock Location Repository
jest.mock('../../src/repositories/locationRepository', () => {
  const store: any[] = [];
  return {
    findAll: jest.fn(async () => store),
    findById: jest.fn(async (id: string) => store.find(e => e.id === id) || null),
    createLocation: jest.fn(async (dto: any) => {
      const entity = { id: genId(), ...dto };
      store.push(entity);
      return entity;
    }),
    updateLocation: jest.fn(async (id: string, dto: any) => {
      const idx = store.findIndex(e => e.id === id);
      if (idx === -1) return null;
      store[idx] = { ...store[idx], ...dto };
      return store[idx];
    }),
    deleteLocation: jest.fn(async (id: string) => {
      const idx = store.findIndex(e => e.id === id);
      if (idx === -1) return false;
      store.splice(idx, 1);
      return true;
    }),
  };
});

// Mock ResourceType Repository
jest.mock('../../src/repositories/resourceTypeRepository', () => {
  const store: any[] = [];
  return {
    findAll: jest.fn(async () => store),
    findById: jest.fn(async (id: string) => store.find(e => e.id === id) || null),
    createResourceType: jest.fn(async (dto: any) => {
      const entity = { id: genId(), ...dto };
      store.push(entity);
      return entity;
    }),
    updateResourceType: jest.fn(async (id: string, dto: any) => {
      const idx = store.findIndex(e => e.id === id);
      if (idx === -1) return null;
      store[idx] = { ...store[idx], ...dto };
      return store[idx];
    }),
    deleteResourceType: jest.fn(async (id: string) => {
      const idx = store.findIndex(e => e.id === id);
      if (idx === -1) return false;
      store.splice(idx, 1);
      return true;
    }),
  };
});

// Mock Resource Repository
jest.mock('../../src/repositories/resourceRepository', () => {
  const store: any[] = [];
  return {
    findAll: jest.fn(async () => store),
    findById: jest.fn(async (id: string) => store.find(e => e.id === id) || null),
    createResource: jest.fn(async (dto: any) => {
      const entity = { id: genId(), ...dto };
      store.push(entity);
      return entity;
    }),
    updateResource: jest.fn(async (id: string, dto: any) => {
      const idx = store.findIndex(e => e.id === id);
      if (idx === -1) return null;
      store[idx] = { ...store[idx], ...dto };
      return store[idx];
    }),
    deleteResource: jest.fn(async (id: string) => {
      const idx = store.findIndex(e => e.id === id);
      if (idx === -1) return false;
      store.splice(idx, 1);
      return true;
    }),
  };
});

const app = express();
app.use(express.json());
// inject mock user
app.use((req, _res, next) => {
  req.user = { id: 'user1', organizationId: 'org1' } as any;
  next();
});

app.use('/locations', locationRoutes);
app.use('/resource-types', resourceTypeRoutes);
app.use('/resources', resourceRoutes);

// --- Tests ---

describe('Location & Resource routes', () => {
  let locationId: string;
  let resourceTypeId: string;
  let resourceId: string;

  it('creates location', async () => {
    const res = await request(app)
      .post('/locations')
      .send({ name: 'Main Arena' })
      .expect(201);
    expect(res.body.success).toBe(true);
    locationId = res.body.data.id;
  });

  it('creates resource type', async () => {
    const res = await request(app)
      .post('/resource-types')
      .send({ name: 'Ice Rink' })
      .expect(201);
    resourceTypeId = res.body.data.id;
  });

  it('creates resource', async () => {
    const res = await request(app)
      .post('/resources')
      .send({ name: 'Rink A', resourceTypeId, locationId })
      .expect(201);
    resourceId = res.body.data.id;
  });

  it('updates resource', async () => {
    await request(app)
      .put(`/resources/${resourceId}`)
      .send({ capacity: 10 })
      .expect(200);
  });

  it('deletes resource', async () => {
    await request(app)
      .delete(`/resources/${resourceId}`)
      .expect(200);
  });
}); 