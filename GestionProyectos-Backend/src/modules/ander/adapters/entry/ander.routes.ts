const { Router } = require('express');
const auth = require('../../../../shared/middlewares/auth.middleware');
const validate = require('../../../../shared/middlewares/validate.middleware');
const { createSchema, updateSchema } = require('../../validators/ander.validator');
const RepositoryImpl = require('../exit/ander.repository.impl');
const buildController = require('./ander.controller');
const getList = require('../../use-cases/getAnderList');
const getById = require('../../use-cases/getAnderById');
const create = require('../../use-cases/createAnder');
const update = require('../../use-cases/updateAnder');
const remove = require('../../use-cases/deleteAnder');

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
