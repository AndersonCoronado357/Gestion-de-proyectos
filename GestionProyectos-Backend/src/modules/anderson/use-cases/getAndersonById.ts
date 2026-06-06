const AppError = require('../../../shared/errors/app.error');

module.exports = ({ repository }) => async (id) => {
  const entity = await repository.findById(id);
  if (!entity) throw AppError.notFound('anderson not found');
  return entity;
};
