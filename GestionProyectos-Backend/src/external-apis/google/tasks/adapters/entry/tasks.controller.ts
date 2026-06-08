import type { NextFunction, Request, Response } from 'express';
import type { TasksPort } from '../../ports/tasks.port';

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

module.exports = ({ tasks }: { tasks: TasksPort }) => ({
  listTaskLists: async (req: Request, res: Response, next: NextFunction) => {
    try {
      res.json({ items: await tasks.listTaskLists(requireUserId(req)) });
    } catch (e) {
      next(e);
    }
  },
  createTaskList: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const body = requireBody<{ title: string }>(req, ['title']);
      res
        .status(201)
        .json(
          await tasks.createTaskList(requireUserId(req), { title: body.title })
        );
    } catch (e) {
      next(e);
    }
  },
  renameTaskList: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const body = requireBody<{ title: string }>(req, ['title']);
      res.json(
        await tasks.renameTaskList(requireUserId(req), {
          taskListId: String(req.params.id),
          title: body.title
        })
      );
    } catch (e) {
      next(e);
    }
  },
  deleteTaskList: async (req: Request, res: Response, next: NextFunction) => {
    try {
      await tasks.deleteTaskList(requireUserId(req), String(req.params.id));
      res.status(204).send();
    } catch (e) {
      next(e);
    }
  },

  listTasks: async (req: Request, res: Response, next: NextFunction) => {
    try {
      res.json({
        items: await tasks.listTasks(requireUserId(req), String(req.params.id))
      });
    } catch (e) {
      next(e);
    }
  },
  createTask: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const body = requireBody<{
        title: string;
        notes?: string;
        due?: string;
        parentId?: string;
      }>(req, ['title']);
      res.status(201).json(
        await tasks.createTask(requireUserId(req), {
          taskListId: String(req.params.id),
          title: body.title,
          notes: body.notes,
          due: body.due,
          parentId: body.parentId
        })
      );
    } catch (e) {
      next(e);
    }
  },
  updateTask: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const body = (req.body ?? {}) as {
        title?: string;
        notes?: string;
        due?: string | null;
        status?: 'needsAction' | 'completed';
      };
      res.json(
        await tasks.updateTask(requireUserId(req), {
          taskListId: String(req.params.id),
          taskId: String(req.params.taskId),
          ...body
        })
      );
    } catch (e) {
      next(e);
    }
  },
  deleteTask: async (req: Request, res: Response, next: NextFunction) => {
    try {
      await tasks.deleteTask(
        requireUserId(req),
        String(req.params.id),
        String(req.params.taskId)
      );
      res.status(204).send();
    } catch (e) {
      next(e);
    }
  }
});
