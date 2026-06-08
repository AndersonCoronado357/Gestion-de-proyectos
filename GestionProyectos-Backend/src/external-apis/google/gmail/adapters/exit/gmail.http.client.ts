import { google, gmail_v1 } from 'googleapis';
type OAuth2Client = InstanceType<typeof google.auth.OAuth2>;
import type {
  GmailLabel,
  ListMessagesInput,
  MessageDetail,
  MessageSummary,
  SendMessageInput
} from '../../domain/gmail.types';
import type { GmailPort } from '../../ports/gmail.port';
import type { ResolvedAccessToken } from '../../../_shared/domain/google-token.types';

const AppError = require('../../../../../shared/errors/app.error');

type ResolveAccessToken = (userId: number) => Promise<ResolvedAccessToken>;

function buildOAuthClient(accessToken: string): OAuth2Client {
  const client = new google.auth.OAuth2();
  client.setCredentials({ access_token: accessToken });
  return client as OAuth2Client;
}

function header(
  headers: gmail_v1.Schema$MessagePartHeader[] | undefined,
  name: string
): string | null {
  if (!headers) return null;
  const h = headers.find((x) => (x.name ?? '').toLowerCase() === name.toLowerCase());
  return h?.value ?? null;
}

function decodeB64Url(s: string | null | undefined): string {
  if (!s) return '';
  const b = s.replace(/-/g, '+').replace(/_/g, '/');
  try {
    return Buffer.from(b, 'base64').toString('utf8');
  } catch {
    return '';
  }
}

function extractBody(p: gmail_v1.Schema$MessagePart | undefined): {
  text: string | null;
  html: string | null;
} {
  let text: string | null = null;
  let html: string | null = null;
  const walk = (part: gmail_v1.Schema$MessagePart | undefined): void => {
    if (!part) return;
    const mime = part.mimeType ?? '';
    if (mime === 'text/plain' && part.body?.data) {
      text = text ?? decodeB64Url(part.body.data);
    } else if (mime === 'text/html' && part.body?.data) {
      html = html ?? decodeB64Url(part.body.data);
    }
    (part.parts ?? []).forEach(walk);
  };
  walk(p);
  return { text, html };
}

function toSummary(m: gmail_v1.Schema$Message): MessageSummary {
  const headers = m.payload?.headers ?? [];
  const labelIds = m.labelIds ?? [];
  return {
    id: m.id ?? '',
    threadId: m.threadId ?? '',
    snippet: m.snippet ?? '',
    labelIds,
    from: header(headers, 'From'),
    to: header(headers, 'To'),
    subject: header(headers, 'Subject'),
    date: header(headers, 'Date'),
    unread: labelIds.includes('UNREAD')
  };
}

function toDetail(m: gmail_v1.Schema$Message): MessageDetail {
  const body = extractBody(m.payload);
  return { ...toSummary(m), bodyText: body.text, bodyHtml: body.html };
}

function toLabel(l: gmail_v1.Schema$Label): GmailLabel {
  return {
    id: l.id ?? '',
    name: l.name ?? '',
    type: l.type ?? null,
    messagesTotal: l.messagesTotal ?? null,
    messagesUnread: l.messagesUnread ?? null
  };
}

async function withGmail<T>(
  resolve: ResolveAccessToken,
  userId: number,
  fn: (g: gmail_v1.Gmail) => Promise<T>
): Promise<T> {
  const tok = await resolve(userId);
  const auth = buildOAuthClient(tok.accessToken);
  const gmail = google.gmail({ version: 'v1', auth });
  try {
    return await fn(gmail);
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

function buildRawMessage(input: SendMessageInput): string {
  // RFC 2822 mínimo. Si hay HTML y texto, mandamos multipart/alternative.
  const boundary = `bnd_${Date.now()}_${Math.floor((Date.now() % 1) * 1e6)}`;
  const lines: string[] = [];
  lines.push(`To: ${input.to}`);
  if (input.cc) lines.push(`Cc: ${input.cc}`);
  if (input.bcc) lines.push(`Bcc: ${input.bcc}`);
  lines.push(`Subject: ${input.subject}`);
  if (input.bodyHtml && input.bodyText) {
    lines.push('MIME-Version: 1.0');
    lines.push(`Content-Type: multipart/alternative; boundary="${boundary}"`);
    lines.push('');
    lines.push(`--${boundary}`);
    lines.push('Content-Type: text/plain; charset="UTF-8"');
    lines.push('');
    lines.push(input.bodyText);
    lines.push(`--${boundary}`);
    lines.push('Content-Type: text/html; charset="UTF-8"');
    lines.push('');
    lines.push(input.bodyHtml);
    lines.push(`--${boundary}--`);
  } else if (input.bodyHtml) {
    lines.push('MIME-Version: 1.0');
    lines.push('Content-Type: text/html; charset="UTF-8"');
    lines.push('');
    lines.push(input.bodyHtml);
  } else {
    lines.push('MIME-Version: 1.0');
    lines.push('Content-Type: text/plain; charset="UTF-8"');
    lines.push('');
    lines.push(input.bodyText ?? '');
  }
  const raw = lines.join('\r\n');
  // base64url-encoded para el campo `raw` de la API.
  return Buffer.from(raw, 'utf8')
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

export function buildGmailHttpClient(deps: {
  resolveAccessToken: ResolveAccessToken;
}): GmailPort {
  const resolve = deps.resolveAccessToken;

  return {
    async listLabels(userId) {
      return withGmail(resolve, userId, async (gmail) => {
        const r = await gmail.users.labels.list({ userId: 'me' });
        return (r.data.labels ?? []).map(toLabel);
      });
    },

    async listMessages(userId, input: ListMessagesInput) {
      return withGmail(resolve, userId, async (gmail) => {
        const list = await gmail.users.messages.list({
          userId: 'me',
          q: input.query,
          labelIds: input.labelIds,
          maxResults: input.pageSize ?? 25
        });
        const ids = (list.data.messages ?? []).map((m) => m.id ?? '').filter(Boolean);
        // Pedimos cada uno con `format=metadata` para evitar bodies grandes.
        const results = await Promise.all(
          ids.map((id) =>
            gmail.users.messages.get({
              userId: 'me',
              id,
              format: 'metadata',
              metadataHeaders: ['From', 'To', 'Subject', 'Date']
            })
          )
        );
        return results.map((r) => toSummary(r.data));
      });
    },

    async getMessage(userId, messageId) {
      return withGmail(resolve, userId, async (gmail) => {
        const r = await gmail.users.messages.get({
          userId: 'me',
          id: messageId,
          format: 'full'
        });
        return toDetail(r.data);
      });
    },

    async sendMessage(userId, input) {
      return withGmail(resolve, userId, async (gmail) => {
        const r = await gmail.users.messages.send({
          userId: 'me',
          requestBody: { raw: buildRawMessage(input) }
        });
        // La respuesta del send es mínima — pedimos los metadatos.
        const m = await gmail.users.messages.get({
          userId: 'me',
          id: r.data.id ?? '',
          format: 'metadata',
          metadataHeaders: ['From', 'To', 'Subject', 'Date']
        });
        return toSummary(m.data);
      });
    },

    async trashMessage(userId, messageId) {
      await withGmail(resolve, userId, async (gmail) => {
        await gmail.users.messages.trash({ userId: 'me', id: messageId });
      });
    },

    async markRead(userId, messageId, read) {
      return withGmail(resolve, userId, async (gmail) => {
        const r = await gmail.users.messages.modify({
          userId: 'me',
          id: messageId,
          requestBody: read
            ? { removeLabelIds: ['UNREAD'] }
            : { addLabelIds: ['UNREAD'] }
        });
        return toSummary(r.data);
      });
    }
  };
}
