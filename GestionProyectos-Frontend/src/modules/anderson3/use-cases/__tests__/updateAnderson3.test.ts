import { updateAnderson3 } from '../updateAnderson3';

test('updateAnderson3 delegates to repository.update', async () => {
  const repository = {
    update: (id, dto) => Promise.resolve({ id, ...dto })
  };
  const result = await updateAnderson3({ repository })('1', { name: 'B' });
  expect(result.name).toBe('B');
});
