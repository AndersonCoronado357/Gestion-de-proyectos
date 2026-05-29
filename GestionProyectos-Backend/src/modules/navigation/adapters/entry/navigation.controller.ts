// Controller HTTP del módulo navigation.

import type { NextFunction, Request, Response } from 'express';
import type {
  NavigationTree,
  NavigationTreeInput,
  SaveTreeResult
} from '../../domain/navigation.types';

interface UseCases {
  getTree: () => Promise<NavigationTree>;
  saveTree: (input: { tree: NavigationTreeInput }) => Promise<SaveTreeResult>;
}

module.exports = ({ useCases }: { useCases: UseCases }) => ({
  getTree: async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const tree = await useCases.getTree();
      res.json({ tree });
    } catch (e) {
      next(e);
    }
  },

  saveTree: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { tree, idMap } = await useCases.saveTree({
        tree: req.body.tree as NavigationTreeInput
      });
      res.json({ tree, idMap });
    } catch (e) {
      next(e);
    }
  }
});
