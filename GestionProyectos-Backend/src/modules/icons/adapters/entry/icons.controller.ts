import type { NextFunction, Request, Response } from 'express';
import type {
  IconListFilters,
  IconListResult,
  IconRow,
  IconUpsertInput
} from '../../domain/icon.types';

interface UseCases {
  listIcons: (f: IconListFilters) => Promise<IconListResult>;
  createIcon: (input: IconUpsertInput) => Promise<IconRow>;
  renameIcon: (i: {
    id: number;
    displayName: string | null;
  }) => Promise<IconRow | null>;
  updateIconSvg: (i: { id: number; svg: string }) => Promise<IconRow | null>;
  deleteIcon: (i: { id: number }) => Promise<{ deleted: boolean; usageCount: number }>;
}

module.exports = ({ useCases }: { useCases: UseCases }) => ({
  list: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const q = req.query;
      const result = await useCases.listIcons({
        search: typeof q.search === 'string' ? q.search : undefined,
        limit: q.limit ? Number(q.limit) : undefined,
        offset: q.offset ? Number(q.offset) : undefined
      });
      res.json(result);
    } catch (e) {
      next(e);
    }
  },

  create: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const body = req.body as {
        name?: string | null;
        displayName?: string | null;
        svg: string;
      };
      if (!body || typeof body.svg !== 'string') {
        res.status(400).json({ error: 'INVALID_BODY' });
        return;
      }
      const icon = await useCases.createIcon({
        name: body.name ? String(body.name).slice(0, 120) : null,
        displayName: body.displayName ? String(body.displayName).slice(0, 200) : null,
        svg: body.svg
      });
      res.status(201).json(icon);
    } catch (e) {
      const code = (e as { code?: string }).code;
      if (code === 'INVALID_SVG') {
        res.status(400).json({ error: 'INVALID_SVG', message: (e as Error).message });
        return;
      }
      next(e);
    }
  },

  // PATCH: acepta `displayName` (rename) y/o `svg` (update contenido).
  patch: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = Number(req.params.id);
      if (!Number.isFinite(id)) {
        res.status(400).json({ error: 'INVALID_ID' });
        return;
      }
      const body = req.body as {
        displayName?: string | null;
        svg?: string;
      };
      let icon: IconRow | null = null;
      if (typeof body.svg === 'string' && body.svg.trim() !== '') {
        icon = await useCases.updateIconSvg({ id, svg: body.svg });
      }
      if ('displayName' in body) {
        const dn =
          body.displayName === null
            ? null
            : body.displayName
              ? String(body.displayName).slice(0, 200)
              : null;
        icon = await useCases.renameIcon({ id, displayName: dn });
      }
      if (!icon) {
        res.status(404).json({ error: 'NOT_FOUND' });
        return;
      }
      res.json(icon);
    } catch (e) {
      const code = (e as { code?: string }).code;
      if (code === 'INVALID_SVG' || code === 'DUPLICATE') {
        res.status(400).json({ error: code, message: (e as Error).message });
        return;
      }
      next(e);
    }
  },

  delete: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = Number(req.params.id);
      if (!Number.isFinite(id)) {
        res.status(400).json({ error: 'INVALID_ID' });
        return;
      }
      const result = await useCases.deleteIcon({ id });
      if (!result.deleted) {
        res.status(409).json({
          error: 'IN_USE',
          message: `El icono está usado por ${result.usageCount} submódulo${result.usageCount === 1 ? '' : 's'}.`,
          usageCount: result.usageCount
        });
        return;
      }
      res.status(204).end();
    } catch (e) {
      next(e);
    }
  }
});
