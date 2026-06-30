import { updateModuloDemo } from '../updateModuloDemo';

test('updateModuloDemo delegates to repository.update', async () => {
  const repository = {
    update: (id, dto) => Promise.resolve({ id, ...dto })
  };
  const result = await updateModuloDemo({ repository })('1', { name: 'B' });
  expect(result.name).toBe('B');
});
