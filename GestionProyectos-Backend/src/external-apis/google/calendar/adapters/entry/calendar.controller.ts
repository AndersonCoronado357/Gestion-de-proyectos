import type { NextFunction, Request, Response } from 'express';
import type { CalendarPort } from '../../ports/calendar.port';

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

module.exports = ({ calendar }: { calendar: CalendarPort }) => ({
  listCalendars: async (req: Request, res: Response, next: NextFunction) => {
    try {
      res.json({ items: await calendar.listCalendars(requireUserId(req)) });
    } catch (e) {
      next(e);
    }
  },
  listEvents: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const calendarId = String(req.params.calendarId);
      res.json({
        items: await calendar.listEvents(requireUserId(req), {
          calendarId,
          timeMin: req.query.timeMin ? String(req.query.timeMin) : undefined,
          timeMax: req.query.timeMax ? String(req.query.timeMax) : undefined,
          query: req.query.q ? String(req.query.q) : undefined,
          pageSize: req.query.pageSize ? Number(req.query.pageSize) : undefined
        })
      });
    } catch (e) {
      next(e);
    }
  },
  getEvent: async (req: Request, res: Response, next: NextFunction) => {
    try {
      res.json(
        await calendar.getEvent(
          requireUserId(req),
          String(req.params.calendarId),
          String(req.params.eventId)
        )
      );
    } catch (e) {
      next(e);
    }
  },
  createEvent: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const body = requireBody<{
        summary: string;
        start: string;
        end: string;
        description?: string;
        location?: string;
        allDay?: boolean;
        attendees?: string[];
      }>(req, ['summary', 'start', 'end']);
      res.status(201).json(
        await calendar.createEvent(requireUserId(req), {
          calendarId: String(req.params.calendarId),
          summary: body.summary,
          start: body.start,
          end: body.end,
          description: body.description,
          location: body.location,
          allDay: body.allDay,
          attendees: body.attendees
        })
      );
    } catch (e) {
      next(e);
    }
  },
  updateEvent: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const body = (req.body ?? {}) as {
        summary?: string;
        description?: string;
        location?: string;
        start?: string;
        end?: string;
        allDay?: boolean;
        attendees?: string[];
      };
      res.json(
        await calendar.updateEvent(requireUserId(req), {
          calendarId: String(req.params.calendarId),
          eventId: String(req.params.eventId),
          ...body
        })
      );
    } catch (e) {
      next(e);
    }
  },
  deleteEvent: async (req: Request, res: Response, next: NextFunction) => {
    try {
      await calendar.deleteEvent(
        requireUserId(req),
        String(req.params.calendarId),
        String(req.params.eventId)
      );
      res.status(204).send();
    } catch (e) {
      next(e);
    }
  }
});
