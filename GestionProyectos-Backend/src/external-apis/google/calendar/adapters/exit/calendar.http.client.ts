import { google, calendar_v3 } from 'googleapis';
type OAuth2Client = InstanceType<typeof google.auth.OAuth2>;
import type {
  CalendarSummary,
  CreateEventInput,
  EventSummary,
  ListEventsInput,
  UpdateEventInput
} from '../../domain/calendar.types';
import type { CalendarPort } from '../../ports/calendar.port';
import type { ResolvedAccessToken } from '../../../_shared/domain/google-token.types';

const AppError = require('../../../../../shared/errors/app.error');

type ResolveAccessToken = (userId: number) => Promise<ResolvedAccessToken>;

function buildOAuthClient(accessToken: string): OAuth2Client {
  const client = new google.auth.OAuth2();
  client.setCredentials({ access_token: accessToken });
  return client as OAuth2Client;
}

function toCalendar(c: calendar_v3.Schema$CalendarListEntry): CalendarSummary {
  return {
    id: c.id ?? '',
    summary: c.summary ?? '(sin nombre)',
    description: c.description ?? null,
    timeZone: c.timeZone ?? null,
    primary: Boolean(c.primary),
    accessRole: c.accessRole ?? null,
    backgroundColor: c.backgroundColor ?? null,
    foregroundColor: c.foregroundColor ?? null
  };
}

function toEvent(calendarId: string, e: calendar_v3.Schema$Event): EventSummary {
  const start = e.start?.dateTime ?? e.start?.date ?? null;
  const end = e.end?.dateTime ?? e.end?.date ?? null;
  const allDay = Boolean(e.start?.date && !e.start?.dateTime);
  return {
    id: e.id ?? '',
    calendarId,
    status: e.status ?? null,
    summary: e.summary ?? null,
    description: e.description ?? null,
    location: e.location ?? null,
    start,
    end,
    allDay,
    htmlLink: e.htmlLink ?? null,
    organizerEmail: e.organizer?.email ?? null,
    attendees:
      e.attendees?.map((a) => ({
        email: a.email ?? null,
        displayName: a.displayName ?? null,
        responseStatus: a.responseStatus ?? null
      })) ?? []
  };
}

async function withCal<T>(
  resolve: ResolveAccessToken,
  userId: number,
  fn: (c: calendar_v3.Calendar) => Promise<T>
): Promise<T> {
  const tok = await resolve(userId);
  const auth = buildOAuthClient(tok.accessToken);
  const cal = google.calendar({ version: 'v3', auth });
  try {
    return await fn(cal);
  } catch (e) {
    throw AppError.badGateway(extractGoogleError(e));
  }
}

function extractGoogleError(e: unknown): string {
  if (e && typeof e === 'object') {
    const err = e as { errors?: Array<{ message?: string }>; message?: string };
    if (err.errors?.[0]?.message) return `Google: ${err.errors[0].message}`;
    if (err.message) return `Google: ${err.message}`;
  }
  return 'Google: error desconocido';
}

function buildEventBody(
  input: CreateEventInput | UpdateEventInput
): calendar_v3.Schema$Event {
  const body: calendar_v3.Schema$Event = {};
  if (input.summary !== undefined) body.summary = input.summary;
  if (input.description !== undefined) body.description = input.description;
  if (input.location !== undefined) body.location = input.location;
  if (input.start !== undefined && input.end !== undefined) {
    if (input.allDay) {
      body.start = { date: input.start.slice(0, 10) };
      body.end = { date: input.end.slice(0, 10) };
    } else {
      body.start = { dateTime: input.start };
      body.end = { dateTime: input.end };
    }
  }
  if (input.attendees !== undefined) {
    body.attendees = input.attendees.map((email) => ({ email }));
  }
  return body;
}

export function buildCalendarHttpClient(deps: {
  resolveAccessToken: ResolveAccessToken;
}): CalendarPort {
  const resolve = deps.resolveAccessToken;

  return {
    async listCalendars(userId) {
      return withCal(resolve, userId, async (cal) => {
        const r = await cal.calendarList.list({ maxResults: 100 });
        return (r.data.items ?? []).map(toCalendar);
      });
    },

    async listEvents(userId, input) {
      return withCal(resolve, userId, async (cal) => {
        const r = await cal.events.list({
          calendarId: input.calendarId,
          timeMin: input.timeMin,
          timeMax: input.timeMax,
          q: input.query,
          maxResults: input.pageSize ?? 50,
          singleEvents: true,
          orderBy: 'startTime'
        });
        return (r.data.items ?? []).map((e) => toEvent(input.calendarId, e));
      });
    },

    async getEvent(userId, calendarId, eventId) {
      return withCal(resolve, userId, async (cal) => {
        const r = await cal.events.get({ calendarId, eventId });
        return toEvent(calendarId, r.data);
      });
    },

    async createEvent(userId, input) {
      return withCal(resolve, userId, async (cal) => {
        const r = await cal.events.insert({
          calendarId: input.calendarId,
          requestBody: buildEventBody(input)
        });
        return toEvent(input.calendarId, r.data);
      });
    },

    async updateEvent(userId, input) {
      return withCal(resolve, userId, async (cal) => {
        const r = await cal.events.patch({
          calendarId: input.calendarId,
          eventId: input.eventId,
          requestBody: buildEventBody(input)
        });
        return toEvent(input.calendarId, r.data);
      });
    },

    async deleteEvent(userId, calendarId, eventId) {
      await withCal(resolve, userId, async (cal) => {
        await cal.events.delete({ calendarId, eventId });
      });
    }
  };
}
