const Joi = require('joi');

const createSchema = Joi.object({
  name: Joi.string().min(1).max(200).required(),
  description: Joi.string().allow(null, '').optional(),
  isActive: Joi.boolean().optional()
});

const updateSchema = Joi.object({
  name: Joi.string().min(1).max(200).optional(),
  description: Joi.string().allow(null, '').optional(),
  isActive: Joi.boolean().optional()
}).min(1);

module.exports = { createSchema, updateSchema };
