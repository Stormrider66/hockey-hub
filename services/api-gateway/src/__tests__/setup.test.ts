describe('Jest Setup', () => {
  it('should run tests successfully', () => {
    expect(true).toBe(true);
  });

  it('should have proper environment', () => {
    expect(process.env.NODE_ENV).toBe('test');
  });
});