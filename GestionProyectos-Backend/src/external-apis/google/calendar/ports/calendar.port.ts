import type {
  CalendarSummary,
  CreateEventInput,
  EventSummary,
  ListEventsInput,
  UpdateEventInput
} from '../domain/calendar.types';

export interface CalendarPort {
  listCalendars(userId: number): Promise<CalendarSummary[]>;
  listEvents(userId: number, input: ListEventsInput): Promise<EventSummary[]>;
  getEvent(
    userId: number,
    calendarId: string,
    eventId: string
  ): Promise<EventSummary>;
  createEvent(userId: number, input: CreateEventInput): Promise<EventSummary>;
  updateEvent(userId: number, input: UpdateEventInput): Promise<EventSummary>;
  deleteEvent(
    userId: number,
    calendarId: string,
    eventId: string
  ): Promise<void>;
}
