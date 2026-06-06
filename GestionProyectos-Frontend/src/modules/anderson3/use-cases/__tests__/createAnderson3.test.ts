import { createAnderson3 } from '../createAnderson3';

test('createAnderson3 maps input to dto and calls repository.create', async () => {
  const repository = {
    create: (dto) => Promise.resolve({ id: '1', ...dto })
  };
  const result = await createAnderson3({ repository })({ name: 'A' });
  expect(result.name).toBe('A');
});
