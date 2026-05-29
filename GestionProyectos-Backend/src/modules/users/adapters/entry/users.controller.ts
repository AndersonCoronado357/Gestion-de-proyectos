// Controller HTTP del módulo Users.

import type { NextFunction, Request, Response } from 'express';
import type { UserListItem } from '../../domain/user-list-item';

interface UseCases {
  list: () => Promise<UserListItem[]>;
  replaceRoles: (input: {
    userId: number;
    roleNames: string[];
  }) => Promise<{ roles: string[] }>;
}

module.exports = ({ useCases }: { useCases: UseCases }) => ({
  list: async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const users = await useCases.list();
      res.json({ users });
    } catch (e) {
      next(e);
    }
  },

  replaceRoles: async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const idRaw = req.params.id;
      const userId = parseInt(typeof idRaw === 'string' ? idRaw : '', 10);
      if (!Number.isFinite(userId) || userId <= 0) {
        res.status(400).json({ error: 'BAD_REQUEST', message: 'Invalid user id' });
        return;
      }
      const roleNames = Array.isArray(req.body?.roles) ? req.body.roles : [];
      const result = await useCases.replaceRoles({ userId, roleNames });
      res.json(result);
    } catch (e) {
      next(e);
    }
  }
});
