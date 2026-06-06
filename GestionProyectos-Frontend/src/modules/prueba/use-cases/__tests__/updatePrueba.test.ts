import { updatePrueba } from '../updatePrueba';

test('updatePrueba delegates to repository.update', async () => {
  const repository = {
    update: (id, dto) => Promise.resolve({ id, ...dto })
  };
  const result = await updatePrueba({ repository })('1', { name: 'B' });
  expect(result.name).toBe('B');
});
