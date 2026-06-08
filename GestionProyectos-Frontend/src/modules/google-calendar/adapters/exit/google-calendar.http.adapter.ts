import { http } from '../../../../shared/utils/http.js';
import type {
  CalendarSummary,
  EventSummary
} from '../../domain/google-calendar.types.js';
import type {
  CreateEventInput,
  GoogleCalendarRepository,
  ListEventsInput,
  UpdateEventInput
} from '../../ports/google-calendar.repository.js';

const enc = (s: string): string => encodeURIComponent(s);

export const googleCalendarHttp: GoogleCalendarRepository = {
  async listCalendars(): Promise<CalendarSummary[]> {
    const r = await http<{ items: CalendarSummary[] }>(
      '/external-apis/google/calendar/calendars',
      { method: 'GET' }
    );
    return r?.items ?? [];
  },

  async listEvents(input: ListEventsInput): Promise<EventSummary[]> {
    const qs = new URLSearchParams();
    if (input.timeMin) qs.set('timeMin', input.timeMin);
    if (input.timeMax) qs.set('timeMax', input.timeMax);
    if (input.query) qs.set('q', input.query);
    if (input.pageSize) qs.set('pageSize', String(input.pageSize));
    const s = qs.toString();
    const r = await http<{ items: EventSummary[] }>(
      `/external-apis/google/calendar/calendars/${enc(input.calendarId)}/events${s ? `?${s}` : ''}`,
      { method: 'GET' }
    );
    return r?.items ?? [];
  },

  async getEvent(calendarId, eventId) {
    return http<EventSummary>(
      `/external-apis/google/calendar/calendars/${enc(calendarId)}/events/${enc(eventId)}`,
      { method: 'GET' }
    );
  },

  async createEvent(input: CreateEventInput) {
    return http<EventSummary>(
      `/external-apis/google/calendar/calendars/${enc(input.calendarId)}/events`,
      {
        method: 'POST',
        body: {
          summary: input.summary,
          description: input.description,
          location: input.location,
          start: input.start,
          end: input.end,
          allDay: input.allDay,
          attendees: input.attendees
        }
      }
    );
  },

  async updateEvent(input: UpdateEventInput) {
    const { calendarId, eventId, ...rest } = input;
    return http<EventSummary>(
      `/external-apis/google/calendar/calendars/${enc(calendarId)}/events/${enc(eventId)}`,
      { method: 'PATCH', body: rest }
    );
  },

  async deleteEvent(calendarId, eventId) {
    await http(
      `/external-apis/google/calendar/calendars/${enc(calendarId)}/events/${enc(eventId)}`,
      { method: 'DELETE' }
    );
  }
};
