import { getAnderList } from '../getAnderList';

test('getAnderList delegates to repository.list', async () => {
  const repository = { list: () => Promise.resolve({ items: [], total: 0 }) };
  const result = await getAnderList({ repository })({ page: 1, limit: 10 });
  expect(result.total).toBe(0);
});
