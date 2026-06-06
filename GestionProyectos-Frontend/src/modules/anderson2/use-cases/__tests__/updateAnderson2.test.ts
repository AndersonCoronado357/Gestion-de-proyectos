import { updateAnderson2 } from '../updateAnderson2';

test('updateAnderson2 delegates to repository.update', async () => {
  const repository = {
    update: (id, dto) => Promise.resolve({ id, ...dto })
  };
  const result = await updateAnderson2({ repository })('1', { name: 'B' });
  expect(result.name).toBe('B');
});
