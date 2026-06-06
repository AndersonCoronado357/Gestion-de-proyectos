const AppError = require('../../../shared/errors/app.error');

module.exports = ({ repository }) => async (id) => {
  const count = await repository.delete(id);
  if (!count) throw AppError.notFound('anderson2 not found');
  return { deleted: true };
};
