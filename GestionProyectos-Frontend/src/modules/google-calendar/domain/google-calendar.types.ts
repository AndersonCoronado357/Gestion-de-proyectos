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
  start: string | null;
  end: string | null;
  allDay: boolean;
  htmlLink: string | null;
  organizerEmail: string | null;
  attendees: {
    email: string | null;
    displayName: string | null;
    responseStatus: string | null;
  }[];
}
