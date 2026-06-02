import { updateHome } from '../updateHome';

test('updateHome delegates to repository.update', async () => {
  const repository = {
    update: (id, dto) => Promise.resolve({ id, ...dto })
  };
  const result = await updateHome({ repository })('1', { name: 'B' });
  expect(result.name).toBe('B');
});
