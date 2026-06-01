// Controller HTTP del módulo "me" (preferencias del usuario logueado).

import type { NextFunction, Request, Response } from 'express';
import type { UiPreferences } from '../../domain/preferences.types';

interface UseCases {
  getPreferences: (input: { userId: number }) => Promise<UiPreferences>;
  updatePreferences: (input: {
    userId: number;
    preferences: UiPreferences;
  }) => Promise<UiPreferences>;
  markActivity: (input: { userId: number }) => Promise<void>;
}

module.exports = ({ useCases }: { useCases: UseCases }) => ({
  getPreferences: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ error: 'UNAUTHORIZED' });
        return;
      }
      const preferences = await useCases.getPreferences({ userId });
      res.json({ preferences });
    } catch (e) {
      next(e);
    }
  },

  updatePreferences: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ error: 'UNAUTHORIZED' });
        return;
      }
      const preferences = await useCases.updatePreferences({
        userId,
        preferences: req.body as UiPreferences
      });
      res.json({ preferences });
    } catch (e) {
      next(e);
    }
  },

  markActivity: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ error: 'UNAUTHORIZED' });
        return;
      }
      await useCases.markActivity({ userId });
      // 204 — no devolvemos body, es un heartbeat liviano.
      res.status(204).end();
    } catch (e) {
      next(e);
    }
  }
});
