import { createModuloDemo } from '../createModuloDemo';

test('createModuloDemo maps input to dto and calls repository.create', async () => {
  const repository = {
    create: (dto) => Promise.resolve({ id: '1', ...dto })
  };
  const result = await createModuloDemo({ repository })({ name: 'A' });
  expect(result.name).toBe('A');
});
