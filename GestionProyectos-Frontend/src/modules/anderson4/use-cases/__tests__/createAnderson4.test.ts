import { createAnderson4 } from '../createAnderson4';

test('createAnderson4 maps input to dto and calls repository.create', async () => {
  const repository = {
    create: (dto) => Promise.resolve({ id: '1', ...dto })
  };
  const result = await createAnderson4({ repository })({ name: 'A' });
  expect(result.name).toBe('A');
});
