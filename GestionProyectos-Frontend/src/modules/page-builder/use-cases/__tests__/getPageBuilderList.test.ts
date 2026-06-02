import { getPageBuilderList } from '../getPageBuilderList';

test('getPageBuilderList delegates to repository.list', async () => {
  const repository = { list: () => Promise.resolve({ items: [], total: 0 }) };
  const result = await getPageBuilderList({ repository })({ page: 1, limit: 10 });
  expect(result.total).toBe(0);
});
