import type { NextFunction, Request, Response } from 'express';
import type { DocsPort } from '../../ports/docs.port';

const AppError = require('../../../../../shared/errors/app.error');

function requireUserId(req: Request): number {
  const id = req.user?.id;
  if (!id) throw AppError.unauthorized('Falta auth');
  return id;
}

function requireBody<T>(req: Request, keys: (keyof T)[]): T {
  const body = (req.body ?? {}) as T;
  for (const k of keys) {
    if (body[k] === undefined || body[k] === null || body[k] === '') {
      throw AppError.badRequest(`Falta el campo ${String(k)}`);
    }
  }
  return body;
}

module.exports = ({ docs }: { docs: DocsPort }) => ({
  listDocs: async (req: Request, res: Response, next: NextFunction) => {
    try {
      res.json({ items: await docs.listDocs(requireUserId(req)) });
    } catch (e) {
      next(e);
    }
  },
  getDoc: async (req: Request, res: Response, next: NextFunction) => {
    try {
      res.json(await docs.getDoc(requireUserId(req), String(req.params.id)));
    } catch (e) {
      next(e);
    }
  },
  createDoc: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const body = requireBody<{ title: string }>(req, ['title']);
      res
        .status(201)
        .json(await docs.createDoc(requireUserId(req), { title: body.title }));
    } catch (e) {
      next(e);
    }
  },
  renameDoc: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const body = requireBody<{ title: string }>(req, ['title']);
      res.json(
        await docs.renameDoc(requireUserId(req), {
          docId: String(req.params.id),
          title: body.title
        })
      );
    } catch (e) {
      next(e);
    }
  },
  deleteDoc: async (req: Request, res: Response, next: NextFunction) => {
    try {
      await docs.deleteDoc(requireUserId(req), String(req.params.id));
      res.status(204).send();
    } catch (e) {
      next(e);
    }
  },
  replaceContent: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const body = (req.body ?? {}) as { text?: string };
      res.json(
        await docs.replaceContent(requireUserId(req), {
          docId: String(req.params.id),
          text: body.text ?? ''
        })
      );
    } catch (e) {
      next(e);
    }
  },
  appendText: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const body = requireBody<{ text: string }>(req, ['text']);
      res.json(
        await docs.appendText(requireUserId(req), {
          docId: String(req.params.id),
          text: body.text
        })
      );
    } catch (e) {
      next(e);
    }
  }
});
