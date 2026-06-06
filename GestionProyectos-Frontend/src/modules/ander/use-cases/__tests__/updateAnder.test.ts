import { updateAnder } from '../updateAnder';

test('updateAnder delegates to repository.update', async () => {
  const repository = {
    update: (id, dto) => Promise.resolve({ id, ...dto })
  };
  const result = await updateAnder({ repository })('1', { name: 'B' });
  expect(result.name).toBe('B');
});
