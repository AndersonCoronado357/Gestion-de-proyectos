import type {
  GmailLabel,
  MessageDetail,
  MessageSummary
} from '../domain/google-gmail.types.js';

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

export interface GoogleGmailRepository {
  listLabels(): Promise<GmailLabel[]>;
  listMessages(input?: ListMessagesInput): Promise<MessageSummary[]>;
  getMessage(id: string): Promise<MessageDetail | null>;
  sendMessage(input: SendMessageInput): Promise<MessageSummary | null>;
  trashMessage(id: string): Promise<void>;
  markRead(id: string, read: boolean): Promise<MessageSummary | null>;
}
