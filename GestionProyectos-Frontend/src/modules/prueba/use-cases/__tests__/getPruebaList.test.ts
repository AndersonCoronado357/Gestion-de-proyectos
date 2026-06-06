import { getPruebaList } from '../getPruebaList';

test('getPruebaList delegates to repository.list', async () => {
  const repository = { list: () => Promise.resolve({ items: [], total: 0 }) };
  const result = await getPruebaList({ repository })({ page: 1, limit: 10 });
  expect(result.total).toBe(0);
});
