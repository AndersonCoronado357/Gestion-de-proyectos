import type {
  GmailLabel,
  ListMessagesInput,
  MessageDetail,
  MessageSummary,
  SendMessageInput
} from '../domain/gmail.types';

export interface GmailPort {
  listLabels(userId: number): Promise<GmailLabel[]>;
  listMessages(
    userId: number,
    input: ListMessagesInput
  ): Promise<MessageSummary[]>;
  getMessage(userId: number, messageId: string): Promise<MessageDetail>;
  sendMessage(userId: number, input: SendMessageInput): Promise<MessageSummary>;
  trashMessage(userId: number, messageId: string): Promise<void>;
  markRead(userId: number, messageId: string, read: boolean): Promise<MessageSummary>;
}
