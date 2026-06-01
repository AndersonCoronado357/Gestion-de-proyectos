import type { NextFunction, Request, Response } from 'express';
import type {
  RoleCreateInput,
  RoleItem,
  RoleUpdateInput
} from '../../domain/role.types';

const AppError = require('../../../../shared/errors/app.error');

interface UseCases {
  list: () => Promise<RoleItem[]>;
  create: (input: RoleCreateInput) => Promise<RoleItem>;
  update: (input: { id: number; patch: RoleUpdateInput }) => Promise<RoleItem>;
  delete: (input: { id: number }) => Promise<void>;
}

function parseId(raw: unknown): number {
  const id = parseInt(typeof raw === 'string' ? raw : '', 10);
  if (!Number.isFinite(id) || id <= 0) {
    throw AppError.badRequest('Invalid role id');
  }
  return id;
}

module.exports = ({ useCases }: { useCases: UseCases }) => ({
  list: async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const roles = await useCases.list();
      res.json({ roles });
    } catch (e) {
      next(e);
    }
  },

  create: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const role = await useCases.create(req.body as RoleCreateInput);
      res.status(201).json({ role });
    } catch (e) {
      next(e);
    }
  },

  update: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = parseId(req.params.id);
      const role = await useCases.update({
        id,
        patch: req.body as RoleUpdateInput
      });
      res.json({ role });
    } catch (e) {
      next(e);
    }
  },

  delete: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = parseId(req.params.id);
      await useCases.delete({ id });
      res.status(204).end();
    } catch (e) {
      next(e);
    }
  }
});
