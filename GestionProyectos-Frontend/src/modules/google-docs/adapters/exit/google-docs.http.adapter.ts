import { http } from '../../../../shared/utils/http.js';
import type { DocMeta, DocSummary } from '../../domain/google-docs.types.js';
import type { GoogleDocsRepository } from '../../ports/google-docs.repository.js';

const enc = (s: string): string => encodeURIComponent(s);

export const googleDocsHttp: GoogleDocsRepository = {
  async listDocs(): Promise<DocSummary[]> {
    const r = await http<{ items: DocSummary[] }>(
      '/external-apis/google/docs/documents',
      { method: 'GET' }
    );
    return r?.items ?? [];
  },

  async getDoc(id) {
    return http<DocMeta>(`/external-apis/google/docs/documents/${enc(id)}`, {
      method: 'GET'
    });
  },

  async createDoc(title) {
    return http<DocMeta>('/external-apis/google/docs/documents', {
      method: 'POST',
      body: { title }
    });
  },

  async renameDoc(id, title) {
    return http<DocMeta>(`/external-apis/google/docs/documents/${enc(id)}`, {
      method: 'PATCH',
      body: { title }
    });
  },

  async deleteDoc(id) {
    await http(`/external-apis/google/docs/documents/${enc(id)}`, {
      method: 'DELETE'
    });
  },

  async replaceContent(id, text) {
    return http<DocMeta>(
      `/external-apis/google/docs/documents/${enc(id)}/content`,
      { method: 'PUT', body: { text } }
    );
  },

  async appendText(id, text) {
    return http<DocMeta>(
      `/external-apis/google/docs/documents/${enc(id)}/append`,
      { method: 'POST', body: { text } }
    );
  }
};
