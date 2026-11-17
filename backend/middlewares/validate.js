const AppError = require('../utils/AppError');

/**
 * Generic Joi validation middleware factory.
 *
 *   router.post('/', validate(schema), handler);          // validates req.body
 *   router.get('/',  validate(schema, 'query'), handler); // validates req.query
 */
const validate = (schema, source = 'body') => (req, res, next) => {
  const { error, value } = schema.validate(req[source], {
    abortEarly: false,
    stripUnknown: true,
    convert: true,
  });

  if (error) {
    const details = error.details.map((d) => ({
      field: d.path.join('.'),
      message: d.message.replace(/['"]/g, ''),
    }));
    return next(new AppError(details[0]?.message ||'Validation failed', 400, details));
  }

  req[source] = value;
  next();
};

module.exports = validate;
