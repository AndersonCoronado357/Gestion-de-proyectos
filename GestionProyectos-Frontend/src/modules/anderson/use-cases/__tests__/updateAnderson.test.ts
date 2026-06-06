import { updateAnderson } from '../updateAnderson';

test('updateAnderson delegates to repository.update', async () => {
  const repository = {
    update: (id, dto) => Promise.resolve({ id, ...dto })
  };
  const result = await updateAnderson({ repository })('1', { name: 'B' });
  expect(result.name).toBe('B');
});
