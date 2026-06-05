import type { NextFunction, Request, Response } from 'express';
import type {
  DesignProject,
  DesignProjectWithViews,
  DesignView,
  CreateProjectInput,
  UpdateProjectInput,
  CreateViewInput,
  UpdateViewInput
} from '../../domain/design.types';

interface UseCases {
  listProjects: () => Promise<DesignProject[]>;
  getProject: (id: number) => Promise<DesignProjectWithViews | null>;
  findOrCreateProjectByName: (input: {
    name: string;
    createdBy?: number | null;
  }) => Promise<DesignProject>;
  createProject: (input: CreateProjectInput) => Promise<DesignProject>;
  updateProject: (id: number, input: UpdateProjectInput) => Promise<DesignProject | null>;
  deleteProject: (id: number) => Promise<boolean>;
  createView: (input: CreateViewInput) => Promise<DesignView>;
  updateView: (id: number, input: UpdateViewInput) => Promise<DesignView | null>;
  deleteView: (id: number) => Promise<boolean>;
}

const numParam = (v: unknown): number | null => {
  if (v == null) return null;
  const raw = Array.isArray(v) ? v[0] : v;
  const n = Number(raw);
  return Number.isFinite(n) && n > 0 ? n : null;
};

module.exports = ({ useCases }: { useCases: UseCases }) => ({
  list: async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      res.json({ items: await useCases.listProjects() });
    } catch (e) {
      next(e);
    }
  },

  get: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = numParam(req.params.id);
      if (id == null) {
        res.status(400).json({ error: 'INVALID_ID' });
        return;
      }
      const p = await useCases.getProject(id);
      if (!p) {
        res.status(404).json({ error: 'NOT_FOUND' });
        return;
      }
      res.json(p);
    } catch (e) {
      next(e);
    }
  },

  create: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const body = req.body as { name?: string };
      const userId = (req as Request & { user?: { id?: number } }).user?.id ?? null;
      const project = await useCases.createProject({
        name: String(body?.name ?? '').slice(0, 200),
        createdBy: userId
      });
      res.status(201).json(project);
    } catch (e) {
      const code = (e as { code?: string }).code;
      if (code === 'INVALID_NAME') {
        res.status(400).json({ error: code, message: (e as Error).message });
        return;
      }
      next(e);
    }
  },

  // Upsert por nombre: usado por el Hub "Crear submódulo" para abrir el
  // editor visual asociado al submódulo (lo crea si todavía no existe).
  findOrCreateByName: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const body = req.body as { name?: string };
      const userId = (req as Request & { user?: { id?: number } }).user?.id ?? null;
      const project = await useCases.findOrCreateProjectByName({
        name: String(body?.name ?? '').slice(0, 200),
        createdBy: userId
      });
      res.status(200).json(project);
    } catch (e) {
      const code = (e as { code?: string }).code;
      if (code === 'INVALID_NAME') {
        res.status(400).json({ error: code, message: (e as Error).message });
        return;
      }
      next(e);
    }
  },

  patch: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = numParam(req.params.id);
      if (id == null) {
        res.status(400).json({ error: 'INVALID_ID' });
        return;
      }
      const body = req.body as UpdateProjectInput;
      const updated = await useCases.updateProject(id, {
        name: body.name !== undefined ? String(body.name).slice(0, 200) : undefined,
        primaryViewId:
          body.primaryViewId !== undefined
            ? body.primaryViewId === null
              ? null
              : Number(body.primaryViewId)
            : undefined
      });
      if (!updated) {
        res.status(404).json({ error: 'NOT_FOUND' });
        return;
      }
      res.json(updated);
    } catch (e) {
      const code = (e as { code?: string }).code;
      if (code === 'INVALID_NAME') {
        res.status(400).json({ error: code, message: (e as Error).message });
        return;
      }
      next(e);
    }
  },

  delete: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = numParam(req.params.id);
      if (id == null) {
        res.status(400).json({ error: 'INVALID_ID' });
        return;
      }
      const ok = await useCases.deleteProject(id);
      if (!ok) {
        res.status(404).json({ error: 'NOT_FOUND' });
        return;
      }
      res.status(204).end();
    } catch (e) {
      next(e);
    }
  },

  createView: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const projectId = numParam(req.params.id);
      if (projectId == null) {
        res.status(400).json({ error: 'INVALID_ID' });
        return;
      }
      const body = req.body as { name?: string };
      const view = await useCases.createView({
        projectId,
        name: body?.name ? String(body.name).slice(0, 120) : undefined
      });
      res.status(201).json(view);
    } catch (e) {
      next(e);
    }
  },

  patchView: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = numParam(req.params.viewId);
      if (id == null) {
        res.status(400).json({ error: 'INVALID_ID' });
        return;
      }
      const body = req.body as UpdateViewInput;
      const patch: UpdateViewInput = {};
      if (body.name !== undefined) patch.name = String(body.name).slice(0, 120);
      if (body.position !== undefined) patch.position = Number(body.position);
      if (body.contentDesktop !== undefined)
        patch.contentDesktop =
          body.contentDesktop === null ? null : String(body.contentDesktop);
      if (body.contentMobile !== undefined)
        patch.contentMobile =
          body.contentMobile === null ? null : String(body.contentMobile);
      const updated = await useCases.updateView(id, patch);
      if (!updated) {
        res.status(404).json({ error: 'NOT_FOUND' });
        return;
      }
      res.json(updated);
    } catch (e) {
      const code = (e as { code?: string }).code;
      if (code === 'INVALID_NAME') {
        res.status(400).json({ error: code, message: (e as Error).message });
        return;
      }
      next(e);
    }
  },

  deleteView: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = numParam(req.params.viewId);
      if (id == null) {
        res.status(400).json({ error: 'INVALID_ID' });
        return;
      }
      const ok = await useCases.deleteView(id);
      if (!ok) {
        res.status(404).json({ error: 'NOT_FOUND' });
        return;
      }
      res.status(204).end();
    } catch (e) {
      next(e);
    }
  }
});
