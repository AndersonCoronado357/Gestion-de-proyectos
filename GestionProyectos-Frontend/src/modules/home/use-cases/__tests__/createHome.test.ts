import { createHome } from '../createHome';

test('createHome maps input to dto and calls repository.create', async () => {
  const repository = {
    create: (dto) => Promise.resolve({ id: '1', ...dto })
  };
  const result = await createHome({ repository })({ name: 'A' });
  expect(result.name).toBe('A');
});
