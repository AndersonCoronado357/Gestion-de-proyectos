import type {
  CalendarSummary,
  EventSummary
} from '../domain/google-calendar.types.js';

export interface ListEventsInput {
  calendarId: string;
  timeMin?: string;
  timeMax?: string;
  query?: string;
  pageSize?: number;
}

export interface CreateEventInput {
  calendarId: string;
  summary: string;
  description?: string;
  location?: string;
  start: string;
  end: string;
  allDay?: boolean;
  attendees?: string[];
}

export interface UpdateEventInput extends Partial<Omit<CreateEventInput, 'calendarId' | 'summary' | 'start' | 'end'>> {
  calendarId: string;
  eventId: string;
  summary?: string;
  start?: string;
  end?: string;
}

export interface GoogleCalendarRepository {
  listCalendars(): Promise<CalendarSummary[]>;
  listEvents(input: ListEventsInput): Promise<EventSummary[]>;
  getEvent(calendarId: string, eventId: string): Promise<EventSummary | null>;
  createEvent(input: CreateEventInput): Promise<EventSummary | null>;
  updateEvent(input: UpdateEventInput): Promise<EventSummary | null>;
  deleteEvent(calendarId: string, eventId: string): Promise<void>;
}
