const AppError = require('../../../shared/errors/app.error');

module.exports = ({ repository }) => async (id, data) => {
  const updated = await repository.update(id, data);
  if (!updated) throw AppError.notFound('ander not found');
  return updated;
};
