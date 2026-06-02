import { updateNavigation } from '../updateNavigation';

test('updateNavigation delegates to repository.update', async () => {
  const repository = {
    update: (id, dto) => Promise.resolve({ id, ...dto })
  };
  const result = await updateNavigation({ repository })('1', { name: 'B' });
  expect(result.name).toBe('B');
});
