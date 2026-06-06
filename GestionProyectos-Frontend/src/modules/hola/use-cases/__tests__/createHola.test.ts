import { createHola } from '../createHola';

test('createHola maps input to dto and calls repository.create', async () => {
  const repository = {
    create: (dto) => Promise.resolve({ id: '1', ...dto })
  };
  const result = await createHola({ repository })({ name: 'A' });
  expect(result.name).toBe('A');
});
