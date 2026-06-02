import { createPreferences } from '../createPreferences';

test('createPreferences maps input to dto and calls repository.create', async () => {
  const repository = {
    create: (dto) => Promise.resolve({ id: '1', ...dto })
  };
  const result = await createPreferences({ repository })({ name: 'A' });
  expect(result.name).toBe('A');
});
