const buildUseCase = require('../getTestRunnerList');

describe('getTestRunnerList', () => {
  it('delegates to repository.findAll', async () => {
    const repository = { findAll: jest.fn().mockResolvedValue({ items: [], total: 0 }) };
    const result = await buildUseCase({ repository })({ limit: 10, offset: 0 });
    expect(repository.findAll).toHaveBeenCalledWith({ limit: 10, offset: 0 });
    expect(result).toEqual({ items: [], total: 0 });
  });
});
