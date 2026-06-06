import { getAnderson3List } from '../getAnderson3List';

test('getAnderson3List delegates to repository.list', async () => {
  const repository = { list: () => Promise.resolve({ items: [], total: 0 }) };
  const result = await getAnderson3List({ repository })({ page: 1, limit: 10 });
  expect(result.total).toBe(0);
});
