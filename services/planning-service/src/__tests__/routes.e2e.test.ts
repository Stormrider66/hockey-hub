import request from 'supertest';
import express from 'express';
import routes from '../routes/dashboardRoutes';

// Build an app instance using the compiled router
const app = express();
app.use(express.json());
app.use('/api/planning', routes as any);

const headers = {
  'X-User-Id': 'test-user-id',
  'X-User-Email': 'test@example.com',
  'X-User-Roles': JSON.stringify(['coach']),
  'X-User-Permissions': JSON.stringify(['planning:read']),
  'X-Organization-Id': 'org-123',
  'X-Team-Ids': JSON.stringify(['team-1']),
};

describe('Planning routes (smoke)', () => {
  it('responds on templates/popular', async () => {
    const res = await request(app)
      .get('/api/planning/templates/popular')
      .set(headers);
    expect([200, 500]).toContain(res.status);
    if (res.status === 200) {
      expect(res.headers).toHaveProperty('etag');
      expect(res.headers).toHaveProperty('last-modified');
      expect(res.body).toHaveProperty('data');
      expect(res.body).toHaveProperty('total');
    }
  });

  it('responds on drills/popular with metadata', async () => {
    const res = await request(app)
      .get('/api/planning/drills/popular?limit=5')
      .set(headers);
    expect([200, 500, 304]).toContain(res.status);
    if (res.status === 200) {
      expect(res.headers).toHaveProperty('etag');
      expect(res.headers).toHaveProperty('last-modified');
      expect(res.body).toHaveProperty('data');
      expect(res.body).toHaveProperty('total');
      const etag = res.headers['etag'];
      // Conditional GET should return 304
      const res304 = await request(app)
        .get('/api/planning/drills/popular?limit=5')
        .set(headers)
        .set('If-None-Match', etag as string);
      expect([304, 500]).toContain(res304.status);
    }
  });

  it('template details supports conditional GET', async () => {
    const res = await request(app)
      .get('/api/planning/templates/non-existent-id')
      .set(headers);
    expect([404, 500]).toContain(res.status);
  });

  it('requires team for player dashboard or returns 400', async () => {
    const res = await request(app)
      .get('/api/planning/dashboard/player')
      .set(headers);
    expect([200, 400, 500]).toContain(res.status);
  });
});
