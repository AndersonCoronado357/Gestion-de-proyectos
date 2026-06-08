import { google, docs_v1, drive_v3 } from 'googleapis';
type OAuth2Client = InstanceType<typeof google.auth.OAuth2>;
import type {
  AppendTextInput,
  CreateDocInput,
  DocMeta,
  DocSummary,
  RenameDocInput,
  ReplaceContentInput
} from '../../domain/docs.types';
import type { DocsPort } from '../../ports/docs.port';
import type { ResolvedAccessToken } from '../../../_shared/domain/google-token.types';

const AppError = require('../../../../../shared/errors/app.error');

type ResolveAccessToken = (userId: number) => Promise<ResolvedAccessToken>;

const DOC_MIME = 'application/vnd.google-apps.document';

function buildOAuthClient(accessToken: string): OAuth2Client {
  const client = new google.auth.OAuth2();
  client.setCredentials({ access_token: accessToken });
  return client as OAuth2Client;
}

function extractText(doc: docs_v1.Schema$Document): string {
  let out = '';
  for (const el of doc.body?.content ?? []) {
    const p = el.paragraph;
    if (!p) continue;
    for (const pe of p.elements ?? []) {
      if (pe.textRun?.content) out += pe.textRun.content;
    }
  }
  return out;
}

function toMeta(doc: docs_v1.Schema$Document): DocMeta {
  const id = doc.documentId ?? '';
  return {
    id,
    title: doc.title ?? '(sin título)',
    revisionId: doc.revisionId ?? null,
    url: id ? `https://docs.google.com/document/d/${id}/edit` : null,
    bodyText: extractText(doc)
  };
}

async function withClients<T>(
  resolve: ResolveAccessToken,
  userId: number,
  fn: (d: docs_v1.Docs, drive: drive_v3.Drive) => Promise<T>
): Promise<T> {
  const tok = await resolve(userId);
  const auth = buildOAuthClient(tok.accessToken);
  const docs = google.docs({ version: 'v1', auth });
  const drive = google.drive({ version: 'v3', auth });
  try {
    return await fn(docs, drive);
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

// Devuelve el offset del fin del cuerpo, usado para append y para
// borrar todo el contenido antes de reemplazarlo.
function endIndex(doc: docs_v1.Schema$Document): number {
  const content = doc.body?.content ?? [];
  // El último elemento del body suele ser el "section break" final.
  const last = content[content.length - 1];
  return Math.max(2, last?.endIndex ?? 2);
}

export function buildDocsHttpClient(deps: {
  resolveAccessToken: ResolveAccessToken;
}): DocsPort {
  const resolve = deps.resolveAccessToken;

  return {
    async listDocs(userId) {
      return withClients(resolve, userId, async (_d, drive) => {
        const r = await drive.files.list({
          q: `mimeType='${DOC_MIME}' and trashed=false`,
          fields: 'files(id,name,modifiedTime,webViewLink)',
          pageSize: 100,
          orderBy: 'modifiedTime desc'
        });
        return (r.data.files ?? []).map<DocSummary>((f) => ({
          id: f.id ?? '',
          name: f.name ?? '(sin nombre)',
          modifiedAt: f.modifiedTime ?? null,
          webViewLink: f.webViewLink ?? null
        }));
      });
    },

    async getDoc(userId, docId) {
      return withClients(resolve, userId, async (docs) => {
        const r = await docs.documents.get({ documentId: docId });
        return toMeta(r.data);
      });
    },

    async createDoc(userId, input: CreateDocInput) {
      return withClients(resolve, userId, async (docs) => {
        const r = await docs.documents.create({
          requestBody: { title: input.title }
        });
        return toMeta(r.data);
      });
    },

    async renameDoc(userId, input: RenameDocInput) {
      return withClients(resolve, userId, async (docs, drive) => {
        await drive.files.update({
          fileId: input.docId,
          requestBody: { name: input.title }
        });
        const r = await docs.documents.get({ documentId: input.docId });
        return toMeta(r.data);
      });
    },

    async deleteDoc(userId, docId) {
      await withClients(resolve, userId, async (_d, drive) => {
        await drive.files.delete({ fileId: docId });
      });
    },

    async replaceContent(userId, input: ReplaceContentInput) {
      return withClients(resolve, userId, async (docs) => {
        const cur = await docs.documents.get({ documentId: input.docId });
        const end = endIndex(cur.data);
        const requests: docs_v1.Schema$Request[] = [];
        if (end > 2) {
          requests.push({
            deleteContentRange: {
              range: { startIndex: 1, endIndex: end - 1 }
            }
          });
        }
        if (input.text) {
          requests.push({
            insertText: { location: { index: 1 }, text: input.text }
          });
        }
        if (requests.length > 0) {
          await docs.documents.batchUpdate({
            documentId: input.docId,
            requestBody: { requests }
          });
        }
        const r = await docs.documents.get({ documentId: input.docId });
        return toMeta(r.data);
      });
    },

    async appendText(userId, input: AppendTextInput) {
      return withClients(resolve, userId, async (docs) => {
        const cur = await docs.documents.get({ documentId: input.docId });
        const end = endIndex(cur.data);
        await docs.documents.batchUpdate({
          documentId: input.docId,
          requestBody: {
            requests: [
              {
                insertText: {
                  location: { index: Math.max(1, end - 1) },
                  text: input.text
                }
              }
            ]
          }
        });
        const r = await docs.documents.get({ documentId: input.docId });
        return toMeta(r.data);
      });
    }
  };
}
