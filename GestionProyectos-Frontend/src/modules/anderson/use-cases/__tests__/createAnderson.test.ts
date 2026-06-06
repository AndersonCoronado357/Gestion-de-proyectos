import { createAnderson } from '../createAnderson';

test('createAnderson maps input to dto and calls repository.create', async () => {
  const repository = {
    create: (dto) => Promise.resolve({ id: '1', ...dto })
  };
  const result = await createAnderson({ repository })({ name: 'A' });
  expect(result.name).toBe('A');
});
