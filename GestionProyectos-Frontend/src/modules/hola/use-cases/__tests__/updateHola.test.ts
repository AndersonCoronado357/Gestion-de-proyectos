import { updateHola } from '../updateHola';

test('updateHola delegates to repository.update', async () => {
  const repository = {
    update: (id, dto) => Promise.resolve({ id, ...dto })
  };
  const result = await updateHola({ repository })('1', { name: 'B' });
  expect(result.name).toBe('B');
});
