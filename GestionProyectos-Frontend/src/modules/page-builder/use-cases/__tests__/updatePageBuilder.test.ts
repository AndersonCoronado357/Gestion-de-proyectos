import { updatePageBuilder } from '../updatePageBuilder';

test('updatePageBuilder delegates to repository.update', async () => {
  const repository = {
    update: (id, dto) => Promise.resolve({ id, ...dto })
  };
  const result = await updatePageBuilder({ repository })('1', { name: 'B' });
  expect(result.name).toBe('B');
});
