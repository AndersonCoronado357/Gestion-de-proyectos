import { updateAnderson4 } from '../updateAnderson4';

test('updateAnderson4 delegates to repository.update', async () => {
  const repository = {
    update: (id, dto) => Promise.resolve({ id, ...dto })
  };
  const result = await updateAnderson4({ repository })('1', { name: 'B' });
  expect(result.name).toBe('B');
});
