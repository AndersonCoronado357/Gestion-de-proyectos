import { getAnderson2List } from '../getAnderson2List';

test('getAnderson2List delegates to repository.list', async () => {
  const repository = { list: () => Promise.resolve({ items: [], total: 0 }) };
  const result = await getAnderson2List({ repository })({ page: 1, limit: 10 });
  expect(result.total).toBe(0);
});
