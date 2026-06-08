// Tipos del dominio Calendar — espejo de Google Calendar API v3.

export interface CalendarSummary {
  id: string;
  summary: string;
  description: string | null;
  timeZone: string | null;
  primary: boolean;
  accessRole: string | null;
  backgroundColor: string | null;
  foregroundColor: string | null;
}

export interface EventSummary {
  id: string;
  calendarId: string;
  status: string | null;
  summary: string | null;
  description: string | null;
  location: string | null;
  // ISO strings — pueden ser dateTime o date (eventos all-day).
  start: string | null;
  end: string | null;
  allDay: boolean;
  htmlLink: string | null;
  organizerEmail: string | null;
  attendees: { email: string | null; displayName: string | null; responseStatus: string | null }[];
}

// ── Inputs ───────────────────────────────────────────────────────
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

export interface UpdateEventInput extends Partial<Omit<CreateEventInput, 'calendarId'>> {
  calendarId: string;
  eventId: string;
}
