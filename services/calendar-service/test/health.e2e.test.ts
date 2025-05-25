import request from 'supertest';
import app from '../src/app';
import AppDataSource from '../src/data-source';

describe('Calendar Service Health Check', () => {
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

  it('should return 200 OK', async () => {
    await request(app)
      .get('/health')
      .expect(200)
      .expect((res: request.Response) => {
        expect(res.body).toHaveProperty('status', 'OK');
      });
  });
}); 