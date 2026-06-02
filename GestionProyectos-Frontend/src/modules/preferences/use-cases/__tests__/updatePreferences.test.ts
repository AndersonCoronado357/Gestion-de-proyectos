import { updatePreferences } from '../updatePreferences';

test('updatePreferences delegates to repository.update', async () => {
  const repository = {
    update: (id, dto) => Promise.resolve({ id, ...dto })
  };
  const result = await updatePreferences({ repository })('1', { name: 'B' });
  expect(result.name).toBe('B');
});
