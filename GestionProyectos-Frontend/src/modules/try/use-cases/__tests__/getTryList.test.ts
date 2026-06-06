import { getTryList } from '../getTryList';

test('getTryList delegates to repository.list', async () => {
  const repository = { list: () => Promise.resolve({ items: [], total: 0 }) };
  const result = await getTryList({ repository })({ page: 1, limit: 10 });
  expect(result.total).toBe(0);
});
