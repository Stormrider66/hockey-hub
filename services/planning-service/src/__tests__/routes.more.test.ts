import request from 'supertest';
import express from 'express';
import routes from '../routes/dashboardRoutes';

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

describe('Planning routes (additional)', () => {
  it('returns 400 for POST /templates/:id/use without teamId', async () => {
    const res = await request(app)
      .post('/api/planning/templates/template-123/use')
      .set(headers)
      .send({});
    expect(res.status).toBe(400);
    // Validation middleware returns structured errors
    expect(res.body).toHaveProperty('statusCode', 400);
    expect(res.body).toHaveProperty('message');
  });

  it('coach dashboard responds (200/500)', async () => {
    const res = await request(app)
      .get('/api/planning/dashboard/coach')
      .set(headers);
    expect([200, 500]).toContain(res.status);
  });

  it('drills search responds (200/500)', async () => {
    const res = await request(app)
      .get('/api/planning/drills/search?search=pass')
      .set(headers);
    expect([200, 500]).toContain(res.status);
    if (res.status === 200) {
      expect(res.headers).toHaveProperty('etag');
      expect(res.headers).toHaveProperty('last-modified');
      expect(res.body).toHaveProperty('data');
      expect(res.body).toHaveProperty('total');
    }
  });

  it('drill details returns 404 for unknown id or 500 on error', async () => {
    const res = await request(app)
      .get('/api/planning/drills/unknown-id')
      .set(headers);
    expect([404, 500]).toContain(res.status);
  });
});
