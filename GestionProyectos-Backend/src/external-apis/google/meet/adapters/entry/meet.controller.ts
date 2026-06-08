import type { NextFunction, Request, Response } from 'express';
import type { MeetPort } from '../../ports/meet.port';

const AppError = require('../../../../../shared/errors/app.error');

function requireUserId(req: Request): number {
  const id = req.user?.id;
  if (!id) throw AppError.unauthorized('Falta auth');
  return id;
}

// Recibimos el space como `spaces/<id>` en path → unimos params.id con
// el prefijo "spaces/" para llamar a la API.
function spaceNameFromReq(req: Request): string {
  return `spaces/${String(req.params.id)}`;
}

module.exports = ({ meet }: { meet: MeetPort }) => ({
  createSpace: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const body = (req.body ?? {}) as {
        accessType?: 'OPEN' | 'TRUSTED' | 'RESTRICTED';
      };
      res
        .status(201)
        .json(await meet.createSpace(requireUserId(req), { accessType: body.accessType }));
    } catch (e) {
      next(e);
    }
  },
  getSpace: async (req: Request, res: Response, next: NextFunction) => {
    try {
      res.json(await meet.getSpace(requireUserId(req), spaceNameFromReq(req)));
    } catch (e) {
      next(e);
    }
  },
  endActiveConference: async (req: Request, res: Response, next: NextFunction) => {
    try {
      await meet.endActiveConference(requireUserId(req), spaceNameFromReq(req));
      res.status(204).send();
    } catch (e) {
      next(e);
    }
  },
  listConferenceRecords: async (req: Request, res: Response, next: NextFunction) => {
    try {
      res.json({
        items: await meet.listConferenceRecords(requireUserId(req))
      });
    } catch (e) {
      next(e);
    }
  }
});
