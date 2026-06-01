import { createTestRunner } from '../createTestRunner';

test('createTestRunner maps input to dto and calls repository.create', async () => {
  const repository = {
    create: (dto) => Promise.resolve({ id: '1', ...dto })
  };
  const result = await createTestRunner({ repository })({ name: 'A' });
  expect(result.name).toBe('A');
});
