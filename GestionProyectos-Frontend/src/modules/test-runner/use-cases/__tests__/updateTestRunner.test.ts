import { updateTestRunner } from '../updateTestRunner';

test('updateTestRunner delegates to repository.update', async () => {
  const repository = {
    update: (id, dto) => Promise.resolve({ id, ...dto })
  };
  const result = await updateTestRunner({ repository })('1', { name: 'B' });
  expect(result.name).toBe('B');
});
