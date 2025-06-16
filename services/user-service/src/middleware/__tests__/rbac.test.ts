import request from 'supertest';
import express, { Request, Response, NextFunction } from 'express';
import { checkRole, checkPermission } from '../rbac';
import { AuthenticatedUser } from '../authenticateToken';

// Helper to create an Express app with a provided middleware chain
function createTestApp(middlewares: any[]) {
  const app = express();
  app.use(express.json());
  app.get('/test', ...middlewares, (_req, res) => {
    res.json({ success: true });
  });
  return app;
}

// Mock authenticated user injection middleware
function mockAuth(user: Partial<AuthenticatedUser>) {
  return (req: any, _res: any, next: any) => {
    req.user = {
      id: 'user-1',
      email: 'test@example.com',
      roles: [],
      permissions: [],
      organizationId: 'org-1',
      lang: 'en',
      get userId() {
        return this.id;
      },
      ...user,
    } as any;
    next();
  };
}

// ---- Tests ---- //
describe('RBAC checkRole middleware', () => {
  it('allows request when user has required role', async () => {
    const app = createTestApp([
      mockAuth({ roles: ['admin'] }),
      checkRole('admin'),
    ]);

    const res = await request(app).get('/test');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('blocks request when user lacks required role', async () => {
    const app = createTestApp([
      mockAuth({ roles: ['player'] }),
      checkRole('admin'),
    ]);

    const res = await request(app).get('/test');
    expect(res.status).toBe(403);
    expect(res.body).toMatchObject({
      error: true,
      code: 'INSUFFICIENT_PERMISSIONS',
    });
  });
});

describe('RBAC checkPermission middleware', () => {
  it('allows request when user has all required permissions', async () => {
    const app = createTestApp([
      mockAuth({ permissions: ['team:create', 'team:read'] }),
      checkPermission('team:create', 'team:read'),
    ]);

    const res = await request(app).get('/test');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('blocks request when user lacks required permission', async () => {
    const app = createTestApp([
      mockAuth({ permissions: ['team:read'] }),
      checkPermission('team:create'),
    ]);

    const res = await request(app).get('/test');
    expect(res.status).toBe(403);
    expect(res.body).toMatchObject({
      error: true,
      code: 'INSUFFICIENT_PERMISSIONS',
    });
  });
}); 