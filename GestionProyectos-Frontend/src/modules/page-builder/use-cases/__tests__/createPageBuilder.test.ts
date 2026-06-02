import { createPageBuilder } from '../createPageBuilder';

test('createPageBuilder maps input to dto and calls repository.create', async () => {
  const repository = {
    create: (dto) => Promise.resolve({ id: '1', ...dto })
  };
  const result = await createPageBuilder({ repository })({ name: 'A' });
  expect(result.name).toBe('A');
});
