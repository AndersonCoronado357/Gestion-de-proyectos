const { Router } = require('express');
const auth = require('../../../../shared/middlewares/auth.middleware');
const validate = require('../../../../shared/middlewares/validate.middleware');
const { createSchema, updateSchema } = require('../../validators/builder.validator');
const RepositoryImpl = require('../exit/builder.repository.impl');
const buildController = require('./builder.controller');
const getList = require('../../use-cases/getBuilderList');
const getById = require('../../use-cases/getBuilderById');
const create = require('../../use-cases/createBuilder');
const update = require('../../use-cases/updateBuilder');
const remove = require('../../use-cases/deleteBuilder');

module.exports = (db) => {
  const repository = new RepositoryImpl(db);
  const useCases = {
    getList: getList({ repository }),
    getById: getById({ repository }),
    create: create({ repository }),
    update: update({ repository }),
    delete: remove({ repository })
  };
  const controller = buildController({ useCases });
  const router = Router();

  router.get('/', controller.list);
  router.get('/:id', controller.getById);
  router.post('/', auth, validate(createSchema), controller.create);
  router.put('/:id', auth, validate(updateSchema), controller.update);
  router.delete('/:id', auth, controller.delete);

  return router;
};
