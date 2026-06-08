import { http } from '../../../../shared/utils/http.js';
import type {
  DriveFileMeta,
  DriveFileSummary
} from '../../domain/google-drive.types.js';
import type {
  DriveListInput,
  GoogleDriveRepository
} from '../../ports/google-drive.repository.js';

const enc = (s: string): string => encodeURIComponent(s);

export const googleDriveHttp: GoogleDriveRepository = {
  async listFiles(input = {}): Promise<DriveFileSummary[]> {
    const qs = new URLSearchParams();
    if (input.query) qs.set('q', input.query);
    if (input.folderId) qs.set('folderId', input.folderId);
    if (input.pageSize) qs.set('pageSize', String(input.pageSize));
    if (input.includeTrashed) qs.set('trashed', 'true');
    const s = qs.toString();
    const r = await http<{ items: DriveFileSummary[] }>(
      `/external-apis/google/drive/files${s ? `?${s}` : ''}`,
      { method: 'GET' }
    );
    return r?.items ?? [];
  },

  async getFile(id) {
    return http<DriveFileMeta>(`/external-apis/google/drive/files/${enc(id)}`, {
      method: 'GET'
    });
  },

  async createFolder(name, parentId) {
    return http<DriveFileMeta>('/external-apis/google/drive/folders', {
      method: 'POST',
      body: { name, parentId }
    });
  },

  async renameFile(id, name) {
    return http<DriveFileMeta>(`/external-apis/google/drive/files/${enc(id)}`, {
      method: 'PATCH',
      body: { name }
    });
  },

  async moveFile(id, newParentId) {
    return http<DriveFileMeta>(
      `/external-apis/google/drive/files/${enc(id)}/move`,
      { method: 'POST', body: { newParentId } }
    );
  },

  async trashFile(id) {
    await http(`/external-apis/google/drive/files/${enc(id)}/trash`, {
      method: 'POST'
    });
  },

  async restoreFile(id) {
    return http<DriveFileMeta>(
      `/external-apis/google/drive/files/${enc(id)}/restore`,
      { method: 'POST' }
    );
  },

  async deleteFile(id) {
    await http(`/external-apis/google/drive/files/${enc(id)}`, {
      method: 'DELETE'
    });
  }
};
