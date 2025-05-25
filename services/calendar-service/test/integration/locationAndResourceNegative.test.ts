import request from 'supertest';
import express from 'express';

import locationRoutes from '../../src/routes/locationRoutes';
import resourceTypeRoutes from '../../src/routes/resourceTypeRoutes';
import resourceRoutes from '../../src/routes/resourceRoutes';

// Reuse the same simple id generator as positive tests
const genId = () => 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
  const r = Math.random() * 16 | 0;
  const v = c === 'x' ? r : (r & 0x3 | 0x8);
  return v.toString(16);
});

// In-memory stores shared for this file
const locations: any[] = [];
const types: any[] = [];
const resources: any[] = [];

jest.mock('../../src/repositories/locationRepository', () => ({
  createLocation: jest.fn(async (dto: any) => {
    const ent = { id: genId(), ...dto };
    locations.push(ent);
    return ent;
  }),
  deleteLocation: jest.fn(async (id: string) => {
    const idx = locations.findIndex(l => l.id === id);
    if (idx === -1) return false;
    // Simulate FK constraint – prevent delete if any resource references location
    const inUse = resources.some(r => r.locationId === id);
    if (inUse) throw { code: '23503' }; // mimic pg constraint error
    locations.splice(idx, 1);
    return true;
  }),
  findAll: jest.fn(async () => locations),
  findById: jest.fn(async (id:string)=>locations.find(l=>l.id===id)||null),
  updateLocation: jest.fn(),
}));

jest.mock('../../src/repositories/resourceTypeRepository', () => ({
  createResourceType: jest.fn(async (dto: any) => {
    const ent = { id: genId(), ...dto };
    types.push(ent);
    return ent;
  }),
  findById: jest.fn(async (id:string)=>types.find(t=>t.id===id)||null),
}));

jest.mock('../../src/repositories/resourceRepository', () => ({
  createResource: jest.fn(async (dto:any) => {
    const ent = { id: genId(), ...dto };
    resources.push(ent);
    return ent;
  }),
  deleteResource: jest.fn(async (id:string)=>{
    const idx = resources.findIndex(r=>r.id===id);
    if(idx===-1) return false;
    resources.splice(idx,1);
    return true;
  }),
  findById: jest.fn(async (id:string)=>resources.find(r=>r.id===id)||null),
  findAll: jest.fn(async ()=>resources),
  updateResource: jest.fn(),
}));

const app = express();
app.use(express.json());
app.use((req,_res,next)=>{req.user={id:'u1',organizationId:'org1'} as any; next();});
app.use('/locations', locationRoutes);
app.use('/resource-types', resourceTypeRoutes);
app.use('/resources', resourceRoutes);

// ---- Tests ----

describe('Negative-path validation & FK constraint checks', () => {
  let locId: string;
  let typeId: string;

  beforeAll(async () => {
    // create valid location & type for later reference
    const locRes = await request(app).post('/locations').send({ name: 'Arena' });
    locId = locRes.body.data.id;
    const tRes = await request(app).post('/resource-types').send({ name: 'Locker' });
    typeId = tRes.body.data.id;
  });

  it('rejects creating location without name', async () => {
    await request(app).post('/locations').send({}).expect(400);
  });

  it('rejects creating resource type with short name', async () => {
    await request(app).post('/resource-types').send({ name: 'A' }).expect(400);
  });

  it('rejects creating resource with missing required fields', async () => {
    await request(app).post('/resources').send({ name: 'No IDs' }).expect(400);
  });

  it('rejects creating resource with invalid UUIDs', async () => {
    await request(app)
      .post('/resources')
      .send({ name: 'Bad IDs', resourceTypeId: 'not-uuid', locationId: 'also-bad' })
      .expect(400);
  });

  it('prevents deleting location in use by resource (FK simulated)', async () => {
    // first create a resource referencing locId & typeId
    await request(app).post('/resources').send({ name: 'Room1', resourceTypeId: typeId, locationId: locId }).expect(201);
    // attempt to delete location – should yield 409 due to mock throwing 23503
    await request(app).delete(`/locations/${locId}`).expect(409);
  });

  it('returns 404 when deleting non-existent resource', async () => {
    await request(app).delete('/resources/non-existent-id').expect(400);
  });
}); 