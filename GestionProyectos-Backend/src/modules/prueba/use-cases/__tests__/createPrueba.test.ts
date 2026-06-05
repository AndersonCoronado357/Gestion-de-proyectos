const buildUseCase = require('../createPrueba');

describe('createPrueba', () => {
  it('creates an entity via the repository', async () => {
    const created = { id: '1', name: 'A' };
    const repository = { create: jest.fn().mockResolvedValue(created) };
    const result = await buildUseCase({ repository })({ name: 'A' });
    expect(repository.create).toHaveBeenCalledWith({ name: 'A' });
    expect(result).toBe(created);
  });
});
