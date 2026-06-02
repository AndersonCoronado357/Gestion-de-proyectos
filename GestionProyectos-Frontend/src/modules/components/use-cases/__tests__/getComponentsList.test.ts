import { getComponentsList } from '../getComponentsList';

test('getComponentsList delegates to repository.list', async () => {
  const repository = { list: () => Promise.resolve({ items: [], total: 0 }) };
  const result = await getComponentsList({ repository })({ page: 1, limit: 10 });
  expect(result.total).toBe(0);
});
