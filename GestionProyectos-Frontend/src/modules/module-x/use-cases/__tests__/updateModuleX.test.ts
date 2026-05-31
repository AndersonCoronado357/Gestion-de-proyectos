import { updateModuleX } from '../updateModuleX';

test('updateModuleX delegates to repository.update', async () => {
  const repository = {
    update: (id, dto) => Promise.resolve({ id, ...dto })
  };
  const result = await updateModuleX({ repository })('1', { name: 'B' });
  expect(result.name).toBe('B');
});
