import type { NextFunction, Request, Response } from 'express';
import type { GmailPort } from '../../ports/gmail.port';

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

module.exports = ({ gmail }: { gmail: GmailPort }) => ({
  listLabels: async (req: Request, res: Response, next: NextFunction) => {
    try {
      res.json({ items: await gmail.listLabels(requireUserId(req)) });
    } catch (e) {
      next(e);
    }
  },
  listMessages: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const labels = req.query.labels
        ? String(req.query.labels).split(',').filter(Boolean)
        : undefined;
      res.json({
        items: await gmail.listMessages(requireUserId(req), {
          query: req.query.q ? String(req.query.q) : undefined,
          labelIds: labels,
          pageSize: req.query.pageSize ? Number(req.query.pageSize) : undefined
        })
      });
    } catch (e) {
      next(e);
    }
  },
  getMessage: async (req: Request, res: Response, next: NextFunction) => {
    try {
      res.json(await gmail.getMessage(requireUserId(req), String(req.params.id)));
    } catch (e) {
      next(e);
    }
  },
  sendMessage: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const body = requireBody<{
        to: string;
        subject: string;
        bodyText?: string;
        bodyHtml?: string;
        cc?: string;
        bcc?: string;
      }>(req, ['to', 'subject']);
      res.status(201).json(
        await gmail.sendMessage(requireUserId(req), {
          to: body.to,
          subject: body.subject,
          bodyText: body.bodyText,
          bodyHtml: body.bodyHtml,
          cc: body.cc,
          bcc: body.bcc
        })
      );
    } catch (e) {
      next(e);
    }
  },
  trashMessage: async (req: Request, res: Response, next: NextFunction) => {
    try {
      await gmail.trashMessage(requireUserId(req), String(req.params.id));
      res.status(204).send();
    } catch (e) {
      next(e);
    }
  },
  markRead: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const body = requireBody<{ read: boolean }>(req, ['read']);
      res.json(
        await gmail.markRead(
          requireUserId(req),
          String(req.params.id),
          Boolean(body.read)
        )
      );
    } catch (e) {
      next(e);
    }
  }
});
