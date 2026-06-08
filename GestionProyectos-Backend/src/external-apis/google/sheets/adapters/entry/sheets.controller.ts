// Controller del tester de Google Sheets.

import type { NextFunction, Request, Response } from 'express';
import type { SheetsPort } from '../../ports/sheets.port';

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

module.exports = ({ sheets }: { sheets: SheetsPort }) => ({
  // ── Spreadsheet level ─────────────────────────────────────────
  listSpreadsheets: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      res.json({ items: await sheets.listSpreadsheets(requireUserId(req)) });
    } catch (e) { next(e); }
  },
  getSpreadsheet: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      res.json(await sheets.getSpreadsheet(requireUserId(req), String(req.params.id)));
    } catch (e) { next(e); }
  },
  createSpreadsheet: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const body = requireBody<{ title: string }>(req, ['title']);
      res.status(201).json(
        await sheets.createSpreadsheet(requireUserId(req), { title: body.title })
      );
    } catch (e) { next(e); }
  },
  renameSpreadsheet: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const body = requireBody<{ title: string }>(req, ['title']);
      res.json(
        await sheets.renameSpreadsheet(requireUserId(req), {
          spreadsheetId: String(req.params.id),
          title: body.title
        })
      );
    } catch (e) { next(e); }
  },
  deleteSpreadsheet: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      await sheets.deleteSpreadsheet(requireUserId(req), String(req.params.id));
      res.status(204).send();
    } catch (e) { next(e); }
  },

  // ── Sheet (tab) level ─────────────────────────────────────────
  addSheet: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const body = requireBody<{ title: string }>(req, ['title']);
      res.status(201).json(
        await sheets.addSheet(requireUserId(req), {
          spreadsheetId: String(req.params.id),
          title: body.title
        })
      );
    } catch (e) { next(e); }
  },
  renameSheet: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const body = requireBody<{ title: string }>(req, ['title']);
      res.json(
        await sheets.renameSheet(requireUserId(req), {
          spreadsheetId: String(req.params.id),
          sheetId: Number(req.params.sheetId),
          title: body.title
        })
      );
    } catch (e) { next(e); }
  },
  duplicateSheet: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const body = (req.body ?? {}) as { newTitle?: string };
      res.status(201).json(
        await sheets.duplicateSheet(requireUserId(req), {
          spreadsheetId: String(req.params.id),
          sheetId: Number(req.params.sheetId),
          newTitle: body.newTitle
        })
      );
    } catch (e) { next(e); }
  },
  deleteSheet: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      await sheets.deleteSheet(
        requireUserId(req),
        String(req.params.id),
        Number(req.params.sheetId)
      );
      res.status(204).send();
    } catch (e) { next(e); }
  },

  // ── Values level ──────────────────────────────────────────────
  readRange: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const range = String(req.query.range ?? '').trim();
      if (!range) throw AppError.badRequest('Falta el query param range');
      res.json(
        await sheets.readRange(requireUserId(req), {
          spreadsheetId: String(req.params.id),
          range
        })
      );
    } catch (e) { next(e); }
  },
  writeRange: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const body = requireBody<{ range: string; values: unknown[][] }>(req, ['range', 'values']);
      res.json(
        await sheets.writeRange(requireUserId(req), {
          spreadsheetId: String(req.params.id),
          range: body.range,
          values: body.values as never
        })
      );
    } catch (e) { next(e); }
  },
  appendRow: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const body = requireBody<{ range: string; values: unknown[][] }>(req, ['range', 'values']);
      res.json(
        await sheets.appendRow(requireUserId(req), {
          spreadsheetId: String(req.params.id),
          range: body.range,
          values: body.values as never
        })
      );
    } catch (e) { next(e); }
  },
  clearRange: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const body = requireBody<{ range: string }>(req, ['range']);
      await sheets.clearRange(requireUserId(req), {
        spreadsheetId: String(req.params.id),
        range: body.range
      });
      res.status(204).send();
    } catch (e) { next(e); }
  }
});
