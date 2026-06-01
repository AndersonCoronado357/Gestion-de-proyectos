const AppError = require('../../../shared/errors/app.error');

module.exports = ({ repository }) => async (id) => {
  const count = await repository.delete(id);
  if (!count) throw AppError.notFound('test-runner not found');
  return { deleted: true };
};
