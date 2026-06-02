import { getLoginContentList } from '../getLoginContentList';

test('getLoginContentList delegates to repository.list', async () => {
  const repository = { list: () => Promise.resolve({ items: [], total: 0 }) };
  const result = await getLoginContentList({ repository })({ page: 1, limit: 10 });
  expect(result.total).toBe(0);
});
