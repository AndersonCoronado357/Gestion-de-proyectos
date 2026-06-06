import { getAnderson4List } from '../getAnderson4List';

test('getAnderson4List delegates to repository.list', async () => {
  const repository = { list: () => Promise.resolve({ items: [], total: 0 }) };
  const result = await getAnderson4List({ repository })({ page: 1, limit: 10 });
  expect(result.total).toBe(0);
});
