process.env.JWT_SECRET = 'test_secret';
process.env.JWT_REFRESH_SECRET = 'test_refresh';
// @ts-ignore - NODE_ENV is writable in runtime
process.env.NODE_ENV = 'test';

// Prevent process.exit from killing Jest
jest.spyOn(process, 'exit').mockImplementation(((code?: number) => {
  // eslint-disable-next-line no-console
  console.warn(`process.exit called with code ${code}`);
}) as any); 