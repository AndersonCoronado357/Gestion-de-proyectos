// Controller del tester de Google Drive.

import type { NextFunction, Request, Response } from 'express';
import type { DrivePort } from '../../ports/drive.port';

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

module.exports = ({ drive }: { drive: DrivePort }) => ({
  listFiles: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const folderId = req.query.folderId ? String(req.query.folderId) : undefined;
      const query = req.query.q ? String(req.query.q) : undefined;
      const pageSize = req.query.pageSize ? Number(req.query.pageSize) : undefined;
      const includeTrashed = req.query.trashed === 'true';
      res.json({
        items: await drive.listFiles(requireUserId(req), {
          folderId,
          query,
          pageSize,
          includeTrashed
        })
      });
    } catch (e) {
      next(e);
    }
  },
  getFile: async (req: Request, res: Response, next: NextFunction) => {
    try {
      res.json(await drive.getFile(requireUserId(req), String(req.params.id)));
    } catch (e) {
      next(e);
    }
  },
  createFolder: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const body = requireBody<{ name: string; parentId?: string }>(req, ['name']);
      res
        .status(201)
        .json(
          await drive.createFolder(requireUserId(req), {
            name: body.name,
            parentId: body.parentId
          })
        );
    } catch (e) {
      next(e);
    }
  },
  renameFile: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const body = requireBody<{ name: string }>(req, ['name']);
      res.json(
        await drive.renameFile(requireUserId(req), {
          fileId: String(req.params.id),
          name: body.name
        })
      );
    } catch (e) {
      next(e);
    }
  },
  moveFile: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const body = requireBody<{ newParentId: string }>(req, ['newParentId']);
      res.json(
        await drive.moveFile(requireUserId(req), {
          fileId: String(req.params.id),
          newParentId: body.newParentId
        })
      );
    } catch (e) {
      next(e);
    }
  },
  trashFile: async (req: Request, res: Response, next: NextFunction) => {
    try {
      await drive.trashFile(requireUserId(req), String(req.params.id));
      res.status(204).send();
    } catch (e) {
      next(e);
    }
  },
  restoreFile: async (req: Request, res: Response, next: NextFunction) => {
    try {
      res.json(await drive.restoreFile(requireUserId(req), String(req.params.id)));
    } catch (e) {
      next(e);
    }
  },
  deleteFile: async (req: Request, res: Response, next: NextFunction) => {
    try {
      await drive.deleteFile(requireUserId(req), String(req.params.id));
      res.status(204).send();
    } catch (e) {
      next(e);
    }
  }
});
