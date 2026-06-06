const { Router } = require('express');
const auth = require('../../../../shared/middlewares/auth.middleware');
const validate = require('../../../../shared/middlewares/validate.middleware');
const { createSchema, updateSchema } = require('../../validators/anderson3.validator');
const RepositoryImpl = require('../exit/anderson3.repository.impl');
const buildController = require('./anderson3.controller');
const getList = require('../../use-cases/getAnderson3List');
const getById = require('../../use-cases/getAnderson3ById');
const create = require('../../use-cases/createAnderson3');
const update = require('../../use-cases/updateAnderson3');
const remove = require('../../use-cases/deleteAnderson3');

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
