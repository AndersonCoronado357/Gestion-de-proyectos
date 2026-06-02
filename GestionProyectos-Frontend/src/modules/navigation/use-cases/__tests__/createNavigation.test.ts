import { createNavigation } from '../createNavigation';

test('createNavigation maps input to dto and calls repository.create', async () => {
  const repository = {
    create: (dto) => Promise.resolve({ id: '1', ...dto })
  };
  const result = await createNavigation({ repository })({ name: 'A' });
  expect(result.name).toBe('A');
});
