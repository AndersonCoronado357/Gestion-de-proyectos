const { Router } = require('express');
const auth = require('../../../../shared/middlewares/auth.middleware');
const validate = require('../../../../shared/middlewares/validate.middleware');
const { createSchema, updateSchema } = require('../../validators/login-content.validator');
const RepositoryImpl = require('../exit/login-content.repository.impl');
const buildController = require('./login-content.controller');
const getList = require('../../use-cases/getLoginContentList');
const getById = require('../../use-cases/getLoginContentById');
const create = require('../../use-cases/createLoginContent');
const update = require('../../use-cases/updateLoginContent');
const remove = require('../../use-cases/deleteLoginContent');

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
