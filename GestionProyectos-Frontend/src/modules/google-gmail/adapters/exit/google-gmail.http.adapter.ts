import { http } from '../../../../shared/utils/http.js';
import type {
  GmailLabel,
  MessageDetail,
  MessageSummary
} from '../../domain/google-gmail.types.js';
import type {
  GoogleGmailRepository,
  ListMessagesInput,
  SendMessageInput
} from '../../ports/google-gmail.repository.js';

const enc = (s: string): string => encodeURIComponent(s);

export const googleGmailHttp: GoogleGmailRepository = {
  async listLabels(): Promise<GmailLabel[]> {
    const r = await http<{ items: GmailLabel[] }>(
      '/external-apis/google/gmail/labels',
      { method: 'GET' }
    );
    return r?.items ?? [];
  },

  async listMessages(input: ListMessagesInput = {}): Promise<MessageSummary[]> {
    const qs = new URLSearchParams();
    if (input.query) qs.set('q', input.query);
    if (input.labelIds?.length) qs.set('labels', input.labelIds.join(','));
    if (input.pageSize) qs.set('pageSize', String(input.pageSize));
    const s = qs.toString();
    const r = await http<{ items: MessageSummary[] }>(
      `/external-apis/google/gmail/messages${s ? `?${s}` : ''}`,
      { method: 'GET' }
    );
    return r?.items ?? [];
  },

  async getMessage(id) {
    return http<MessageDetail>(`/external-apis/google/gmail/messages/${enc(id)}`, {
      method: 'GET'
    });
  },

  async sendMessage(input: SendMessageInput) {
    return http<MessageSummary>('/external-apis/google/gmail/messages', {
      method: 'POST',
      body: input
    });
  },

  async trashMessage(id) {
    await http(`/external-apis/google/gmail/messages/${enc(id)}/trash`, {
      method: 'POST'
    });
  },

  async markRead(id, read) {
    return http<MessageSummary>(
      `/external-apis/google/gmail/messages/${enc(id)}/read`,
      { method: 'POST', body: { read } }
    );
  }
};
