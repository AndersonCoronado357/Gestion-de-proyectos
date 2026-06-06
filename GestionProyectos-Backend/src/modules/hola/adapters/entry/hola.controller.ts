const pagination = require('../../../../shared/utils/pagination');
const createDto = require('../../dtos/create-hola.dto');
const updateDto = require('../../dtos/update-hola.dto');

module.exports = ({ useCases }) => ({
  list: async (req, res, next) => {
    try {
      const p = pagination.parse(req.query);
      const { items, total } = await useCases.getList(p);
      res.json(pagination.build(items, total, p));
    } catch (e) { next(e); }
  },
  getById: async (req, res, next) => {
    try { res.json(await useCases.getById(req.params.id)); } catch (e) { next(e); }
  },
  create: async (req, res, next) => {
    try {
      const entity = await useCases.create(createDto(req.body));
      res.status(201).json(entity);
    } catch (e) { next(e); }
  },
  update: async (req, res, next) => {
    try { res.json(await useCases.update(req.params.id, updateDto(req.body))); } catch (e) { next(e); }
  },
  delete: async (req, res, next) => {
    try { res.json(await useCases.delete(req.params.id)); } catch (e) { next(e); }
  }
});
