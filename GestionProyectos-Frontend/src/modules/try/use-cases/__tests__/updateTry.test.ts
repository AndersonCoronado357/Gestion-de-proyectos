import { updateTry } from '../updateTry';

test('updateTry delegates to repository.update', async () => {
  const repository = {
    update: (id, dto) => Promise.resolve({ id, ...dto })
  };
  const result = await updateTry({ repository })('1', { name: 'B' });
  expect(result.name).toBe('B');
});
