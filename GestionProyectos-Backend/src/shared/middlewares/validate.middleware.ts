const AppError = require('../errors/app.error');

module.exports = (schema, source = 'body') => (req, _res, next) => {
  const { error, value } = schema.validate(req[source], {
    abortEarly: false,
    stripUnknown: true
  });
  if (error) {
    return next(
      AppError.badRequest('Validation failed', error.details.map((d) => d.message))
    );
  }
  req[source] = value;
  next();
};
