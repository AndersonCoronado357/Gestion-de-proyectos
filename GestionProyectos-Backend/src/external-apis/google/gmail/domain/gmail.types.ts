// Tipos del dominio Gmail.

export interface GmailLabel {
  id: string;
  name: string;
  type: string | null;
  // Counters opcionales (vienen sólo si pedimos `format=FULL`).
  messagesTotal: number | null;
  messagesUnread: number | null;
}

export interface MessageSummary {
  id: string;
  threadId: string;
  snippet: string;
  labelIds: string[];
  from: string | null;
  to: string | null;
  subject: string | null;
  // ISO date string del header `Date`.
  date: string | null;
  unread: boolean;
}

export interface MessageDetail extends MessageSummary {
  bodyText: string | null;
  bodyHtml: string | null;
}

// ── Inputs ───────────────────────────────────────────────────────
export interface ListMessagesInput {
  query?: string;
  labelIds?: string[];
  pageSize?: number;
}

export interface SendMessageInput {
  to: string;
  subject: string;
  bodyText?: string;
  bodyHtml?: string;
  cc?: string;
  bcc?: string;
}
