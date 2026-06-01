const buildUseCase = require('../updateLoginContent');

describe('updateLoginContent', () => {
  it('returns the updated entity', async () => {
    const repository = { update: jest.fn().mockResolvedValue({ id: '1', name: 'B' }) };
    const result = await buildUseCase({ repository })('1', { name: 'B' });
    expect(result.name).toBe('B');
  });

  it('throws when entity not found', async () => {
    const repository = { update: jest.fn().mockResolvedValue(null) };
    await expect(buildUseCase({ repository })('x', { name: 'B' })).rejects.toThrow();
  });
});
