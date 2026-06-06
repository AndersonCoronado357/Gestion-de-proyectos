import { createAnderson2 } from '../createAnderson2';

test('createAnderson2 maps input to dto and calls repository.create', async () => {
  const repository = {
    create: (dto) => Promise.resolve({ id: '1', ...dto })
  };
  const result = await createAnderson2({ repository })({ name: 'A' });
  expect(result.name).toBe('A');
});
